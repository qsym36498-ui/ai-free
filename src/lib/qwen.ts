import type { AnswerSection } from "./luau/types";

/**
 * عميل المزوّد (Groq افتراضياً — أي واجهة متوافقة مع OpenAI) — يعمل على الخادم فقط.
 * المفتاح/النموذج/العنوان من متغيرات البيئة: تُقرأ أسماء GROQ_* أولاً (التسمية
 * الصحيحة) ثم QWEN_* كاحتياط للتوافق الخلفي. بلا مفتاح يعود فوراً بـ null
 * فلا تتأثر الأداة إطلاقاً (تبقى بالإجابات اليدوية).
 */

interface QwenConfig {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  provider: "openai" | "gemini";
}

export function qwenConfig(): QwenConfig {
  const base =
    process.env.GROQ_BASE_URL ??
    process.env.QWEN_BASE_URL ??
    "https://api.groq.com/openai/v1";
  return {
    enabled: (process.env.GROQ_ENABLED ?? process.env.QWEN_ENABLED ?? "").toLowerCase() === "true",
    apiKey: process.env.GROQ_API_KEY ?? process.env.QWEN_API_KEY ?? "",
    baseUrl: base.replace(/\/+$/, ""),
    model: process.env.GROQ_MODEL ?? process.env.QWEN_MODEL ?? "openai/gpt-oss-120b",
    maxTokens: Number(process.env.GROQ_MAX_TOKENS ?? process.env.QWEN_MAX_TOKENS ?? 4000),
    temperature: Number(process.env.GROQ_TEMPERATURE ?? process.env.QWEN_TEMPERATURE ?? 0.4),
    timeoutMs: 30_000,
    provider:
      (process.env.GROQ_PROVIDER ?? process.env.QWEN_PROVIDER ?? "").toLowerCase() === "gemini"
        ? "gemini"
        : "openai",
  };
}

/** هل النموذج مفعّل وجاهز فعلاً؟ */
export function qwenAvailable(): boolean {
  const c = qwenConfig();
  return c.enabled && c.apiKey.length > 0;
}

interface QwenRequest {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

/** استدعاء واحد — يعيد نص الإجابة أو null عند التعطيل/الفشل (مهم للـ fallback) */
export async function qwenChat(req: QwenRequest): Promise<string | null> {
  const c = qwenConfig();
  if (!c.enabled || !c.apiKey) return null;

  try {
    const text =
      c.provider === "gemini" ? await geminiChat(c, req) : await openaiChat(c, req);
    return text && text.trim() ? text.trim() : null;
  } catch (error) {
    console.error("qwen call failed", error);
    return null;
  }
}

/** مهلة إعادة المحاولة بعد ضغط المعدل (429): من الترويسة أو من نص الخطأ أو افتراض 5 ثوانٍ */
function parseRetryMs(response: Response, body: string): number {
  const header = Number(response.headers.get("Retry-After"));
  if (Number.isFinite(header) && header > 0) return header * 1000;
  const match = body.match(/try again in ([0-9.]+)\s*s/i);
  if (match) return Number(match[1]) * 1000;
  return 5000;
}

async function openaiChat(c: QwenConfig, req: QwenRequest): Promise<string | null> {
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(`${c.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${c.apiKey}`,
      },
      body: JSON.stringify({
        model: c.model,
        messages: [
          { role: "system", content: req.system },
          { role: "user", content: req.user },
        ],
        max_tokens: req.maxTokens ?? c.maxTokens,
        temperature: req.temperature ?? c.temperature,
      }),
      signal: AbortSignal.timeout(req.timeoutMs ?? c.timeoutMs),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        choices?: { message?: { content?: unknown } }[];
        usage?: { total_tokens?: unknown };
      };
      const text = data.choices?.[0]?.message?.content;
      return typeof text === "string" ? text : null;
    }

    const body = await response.text().catch(() => "");
    if (response.status === 429 && attempt < maxAttempts) {
      const waitMs = parseRetryMs(response, body) + 800;
      console.error(
        `qwen rate limited (429) — انتظار ~${Math.round(waitMs / 1000)}s ثم إعادة المحاولة (${attempt}/${maxAttempts - 1})`,
        body.slice(0, 200)
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }

    console.error("qwen http error", response.status, body.slice(0, 300));
    return null;
  }
  return null;
}

/** نقطة Gemini يستقبل المفتاح كمعامل URL والصيغة struct فيها — لا سجل رسائل */
async function geminiChat(c: QwenConfig, req: QwenRequest): Promise<string | null> {
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(
      `${c.baseUrl}/models/${encodeURIComponent(c.model)}:generateContent?key=${encodeURIComponent(c.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: req.user }] }],
          ...(req.system ? { systemInstruction: { parts: [{ text: req.system }] } } : {}),
          generationConfig: {
            maxOutputTokens: req.maxTokens ?? c.maxTokens,
            temperature: req.temperature ?? c.temperature,
          },
        }),
        signal: AbortSignal.timeout(req.timeoutMs ?? c.timeoutMs),
      }
    );

    if (response.ok) {
      const data = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: unknown }[] } }[];
      };
      return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
    }

    const body = await response.text().catch(() => "");
    if (response.status === 429 && attempt < maxAttempts) {
      const waitMs = parseRetryMs(response, body) + 800;
      console.error(
        `gemini rate limited (429) — انتظار ~${Math.round(waitMs / 1000)}s ثم إعادة المحاولة (${attempt}/${maxAttempts - 1})`,
        body.slice(0, 200)
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }

    console.error("gemini http error", response.status, body.slice(0, 300));
    return null;
  }
  return null;
}

export interface ParsedAnswer {
  intro: string;
  sections: AnswerSection[];
  tips: string[];
}

/**
 * يحوّل نص إجابة النموذج (markdown خفيف) إلى أقسام الواجهة:
 * عناوين ### بدء قسم جديد، أكواد ``` لون كتلة كود، و"نصائح" تجمع نقاط.
 */
export function parseQwenAnswer(text: string): ParsedAnswer {
  const lines = text.split(/\r?\n/);
  const sections: AnswerSection[] = [];
  const tips: string[] = [];
  const introParts: string[] = [];

  let current: AnswerSection | null = null;
  let inCode = false;
  let codeLines: string[] = [];
  let codeTitle: string | undefined;
  let inTips = false;
  let seenContent = false;

  const pushCurrent = () => {
    if (!current) return;
    if (current.text && !current.text.trim() && !current.code) return;
    sections.push(current);
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (inCode) {
      if (line.startsWith("```")) {
        inCode = false;
        if (!current) current = { code: "", fileName: codeTitle };
        current.code = (current.code ?? "") + codeLines.join("\n");
        current.fileName = current.code ? (codeTitle ?? current.fileName) : undefined;
        codeLines = [];
        continue;
      }
      codeLines.push(line);
      continue;
    }

    if (line.startsWith("```")) {
      inCode = true;
      codeTitle = line.replace(/^```/, "").trim() || undefined;
      continue;
    }

    if (/^#{1,4}\s+/.test(line)) {
      pushCurrent();
      const heading = line.replace(/^#{1,4}\s+/, "").trim();
      current = { heading };
      inTips = /نصائح/i.test(heading) || /الأخطاء الشائعة/i.test(heading);
      seenContent = true;
      continue;
    }

    if (line.trim() === "") {
      if (!current) current = { text: "" };
      continue;
    }

    const isBullet = /^[-*•]\s+/.test(line.trim());
    const plain = line.trim();

    // نصائح تبدأ تحت رأس "نصائح"
    if (current && inTips && isBullet) {
      tips.push(plain.replace(/^[-*•]\s+/, ""));
      continue;
    }
    if (current && !inTips && isBullet && /نصائح/i.test(plain)) {
      inTips = true;
      tips.push(plain.replace(/^[-*•]\s+/, ""));
      continue;
    }

    if (!current) {
      if (!seenContent && !isBullet) {
        introParts.push(plain);
        continue;
      }
      current = { text: "" };
      seenContent = true;
    }

    current.text = (current.text ?? "") + (current.text ? "\n" : "") + plain;
  }

  if (inCode && current) {
    current.code = (current.code ?? "") + codeLines.join("\n");
  }
  pushCurrent();

  return {
    intro: introParts.join(" ").trim(),
    sections: sections.filter((s) => s.heading || s.code || (s.text && s.text.trim())),
    tips,
  };
}