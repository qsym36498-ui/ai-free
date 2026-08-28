import type { AnswerSection } from "./luau/types";

/**
 * عميل Qwen (أو أي مزوّد متوافق مع OpenAI) — يعمل على الخادم فقط.
 * المفتاح/النموذج/العنوان كلها من متغيرات البيئة، وبلا مفتاح يعود فوراً بـ null
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
}

function qwenConfig(): QwenConfig {
  const base = process.env.QWEN_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1";
  return {
    enabled: (process.env.QWEN_ENABLED ?? "").toLowerCase() === "true",
    apiKey: process.env.QWEN_API_KEY ?? "",
    baseUrl: base.replace(/\/+$/, ""),
    model: process.env.QWEN_MODEL ?? "qwen-coder-plus",
    maxTokens: Number(process.env.QWEN_MAX_TOKENS ?? 900),
    temperature: Number(process.env.QWEN_TEMPERATURE ?? 0.4),
    timeoutMs: 20_000,
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

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("qwen http error", response.status, body.slice(0, 300));
      return null;
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: unknown } }[];
      usage?: { total_tokens?: unknown };
    };
    const text = data.choices?.[0]?.message?.content;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch (error) {
    console.error("qwen call failed", error);
    return null;
  }
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