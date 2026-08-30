/**
 * عقل لواو — محرك الفهم والإجابة.
 * مكتوب يدوياً بالكامل: كشف نوايا + بحث BM25 + دمج معرفة اللاعبين من قاعدة البيانات.
 */
import { desc, eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { crawledPages, knowledgeEntries, languageBooks } from "@/db/schema";
import { bookToSearchDocs, fetchKnowledgeBooks } from "./langbooks";
import { BUILTIN_DOCS, docToTrainingText } from "./corpus";
import { buildSearchIndex, type ScoredDoc, type SearchDoc, type LuauSearchIndex } from "./search";
import { fetchLanguageBooks } from "./langbooks";
import { contentTokens, expandWithStems, normalizeArabic, stemArabic, tokenize } from "./text";
import { TEMPLATES } from "./templates";
import { parseQwenAnswer, qwenAvailable, qwenChat } from "../qwen";
import type { CodeTemplate, EngineAnswer, KnowledgeDoc } from "./types";

function builtinToSearchDoc(doc: KnowledgeDoc): SearchDoc {
  return {
    id: doc.id,
    source: "builtin",
    title: doc.title,
    level: doc.level,
    tags: doc.tags,
    paragraphs: [doc.summary, ...doc.content],
    code: doc.code,
  };
}

/** صفوف قاعدة البيانات التي تتحول إلى وثائق بحث — يشترك فيها drizzle وبحث pg الخام */
interface UserRow {
  id: number;
  title: string;
  content: string;
  code: string | null;
  tags: string;
  sourceUrl: string | null;
  sourceType: string;
  authorName: string;
  verified: boolean;
  confirmCount: number;
  disputeCount: number;
}

interface CrawledRow {
  id: number;
  url: string;
  origin: string;
  tags: string;
  title: string;
  content: string;
}

/** تقطيع نص صفحة مزحوفة إلى فقرات ~700 حرف قابلة للبحث */
function chunkCrawledContent(content: string): string[] {
  const paragraphs: string[] = [];
  const chunks = content.split(/\n+/);
  let current = "";
  for (const chunk of chunks) {
    if ((current + chunk).length > 700) {
      if (current) paragraphs.push(current.trim());
      current = chunk;
    } else {
      current += " " + chunk;
    }
  }
  if (current.trim()) paragraphs.push(current.trim());
  return paragraphs;
}

/** صف صفحة مزحوفة → وثيقة بحث (يُستخدم من drizzle ومن مرشّحي FTS معاً) */
function crawledRowToDoc(row: CrawledRow): SearchDoc {
  const paragraphs = chunkCrawledContent(row.content);
  return {
    id: `crawled-${row.id}`,
    source: "crawled",
    title: row.title || row.origin,
    tags: row.tags.split(",").map((t) => t.trim()).filter(Boolean),
    paragraphs: paragraphs.length > 0 ? paragraphs : [row.content.slice(0, 700)],
    sourceUrl: row.url,
    authorName: row.origin,
  };
}

/** صف معرفة لاعب/درس → وثيقة بحث (يُستخدم من drizzle ومن مرشّحي FTS معاً) */
function userRowToDoc(row: UserRow): SearchDoc {
  return {
    id: `user-${row.id}`,
    entryId: row.id,
    source: "user",
    title: row.title,
    tags: row.tags.split(",").map((t) => t.trim()).filter(Boolean),
    paragraphs: [row.content],
    code: row.code ?? undefined,
    authorName: row.authorName,
    sourceUrl: row.sourceUrl ?? undefined,
    sourceType: row.sourceType,
    verified: row.verified,
    confirmCount: row.confirmCount,
    disputeCount: row.disputeCount,
  };
}

/** صفحات قرأها الزاحف الذاتي من كتب ومواقع مجانية */
async function fetchCrawledDocs(): Promise<SearchDoc[]> {
  try {
    const rows = await db
      .select()
      .from(crawledPages)
      .where(eq(crawledPages.status, "done"))
      .orderBy(desc(crawledPages.id))
      .limit(150);
    return rows.filter((row) => row.content.length > 0).map(crawledRowToDoc);
  } catch {
    return [];
  }
}

async function fetchUserDocs(): Promise<SearchDoc[]> {
  try {
    const rows = await db
      .select()
      .from(knowledgeEntries)
      .orderBy(desc(knowledgeEntries.createdAt))
      .limit(400);
    return rows.map(userRowToDoc);
  } catch {
    // الجدول غير موجود بعد أو لا اتصال — نكمل بالمعرفة المدمجة فقط
    return [];
  }
}

/** مطابقة النية مع قوالب المولد — مع مطابقة الجذوع العربية */
function matchTemplate(question: string) {
  const normalized = normalizeArabic(question);
  const tokens = new Set(tokenize(question));
  const stemmed = new Set(expandWithStems(Array.from(tokens)));

  let best: { id: string; hits: number } | null = null;

  for (const template of TEMPLATES) {
    let hits = 0;
    for (const keyword of template.keywords) {
      const normalizedKeyword = normalizeArabic(keyword);
      // مطابقة عبارة كاملة داخل السؤال
      if (normalizedKeyword.includes(" ") && normalized.includes(normalizedKeyword)) {
        hits += 3;
        continue;
      }
      // مطابقة كلمة واحدة (مباشرة أو بجذرها)
      if (tokens.has(normalizedKeyword)) {
        hits += normalizedKeyword.length >= 4 ? 2 : 1;
      } else if (stemmed.has(stemArabic(normalizedKeyword))) {
        hits += 1;
      }
    }
    if (hits > 0 && (best === null || hits > best.hits)) {
      best = { id: template.id, hits };
    }
  }

  return best;
}

/** هل السؤال طلب إنشاء نظام؟ */
const CREATE_VERBS = ["اصنع", "اعمل", "سوي", "اكتب", "انشئ", "صمم", "برمج", "جهز", "ابني", "بدي", "ودي", "ابغى", "بدنا", "make", "create", "build", "write"];

function isCreationRequest(question: string): boolean {
  const normalized = normalizeArabic(question);
  return CREATE_VERBS.some((verb) => normalized.includes(verb));
}

/** استخراج اسم النظام المطلوب من السؤال */
function extractSystemName(question: string): string {
  const cleaned = question
    .replace(/(اصنع|اعمل|سوي|اكتب|انشئ|صمم|برمج|جهز|ابني)\s+(لي|لي نظام|نظام|لي سيستم)?/g, "")
    .replace(/^(بدي|ودي|ابغى|بدنا)\s*/, "")
    .replace(/[؟?!.]+$/, "")
    .trim();
  return cleaned.length > 2 ? cleaned.slice(0, 60) : "نظامك المخصص";
}

/** مولد هيكل نظام مخصص: خطة + كود هيكل لأي نظام يطلبه اللاعب */
function customSystemAnswer(question: string): EngineAnswer {
  const systemName = extractSystemName(question);

  return {
    kind: "generator",
    intro:
      "طلبك: \"" +
      systemName +
      "\". ليس عندي قالب محفوظ لهذا النظام تحديداً بعد، لكن جهزت لك هيكله الكامل وخطة بنائه خطوة بخطوة — ابنِ عليه واطلب مني أي تفصيلة وسأكملها لك:",
    sections: [
      {
        heading: "خطة البناء (5 خطوات)",
        text:
          "1. حدد بيانات النظام: ماذا يخزن؟ (مثلاً: التقدم، الكمية، المستوى) واحفظها في جدول على السيرفر.\n2. أنشئ RemoteEvent للتواصل بين الكلينت والسيرفر — كل فعل يمر من خلاله.\n3. السيرفر يتحقق ثم ينفذ: النوع، المدى، المعدل، الملكية.\n4. الكلينت يرسل الطلبات ويعرض النتائج على الشاشة بواجهة.\n5. اربط النظام بالداتا ستور للحفظ بين الجلسات.",
      },
      {
        heading: "Script — هيكل السيرفر الجاهز",
        text: "المكان: ServerScriptService — غيّر اسم الحدث وعدّل منطق handleAction",
        code: `-- هيكل نظام: ${systemName}
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local actionEvent = Instance.new("RemoteEvent")
actionEvent.Name = "${systemName.replace(/[^\w\u0600-\u06FF]+/g, "_").slice(0, 30)}Action"
actionEvent.Parent = ReplicatedStorage

local playerState = {}  -- حالة كل لاعب في هذا النظام

local function handleAction(player, payload)
	-- 1) تحقق من النوع
	if typeof(payload) ~= "table" then return end

	-- 2) منطق النظام هنا: حدّث الحالة وأعطِ النتائج
	playerState[player] = playerState[player] or { count = 0 }
	playerState[player].count += 1

	-- 3) أخبر الكلينت بالنتيجة
	actionEvent:FireClient(player, "updated", playerState[player].count)
end

actionEvent.OnServerEvent:Connect(function(player, payload)
	handleAction(player, payload)
end)

print("نظام ${systemName} جاهز للاستقبال")`,
        fileName: "SystemServer.luau",
      },
      {
        heading: "LocalScript — هيكل الكلينت الجاهز",
        text: "المكان: StarterPlayerScripts — أرسل الطلب واعرض النتيجة",
        code: `local ReplicatedStorage = game:GetService("ReplicatedStorage")
local actionEvent = ReplicatedStorage:WaitForChild("${systemName.replace(/[^\w\u0600-\u06FF]+/g, "_").slice(0, 30)}Action")

-- أرسل طلباً (اربطه بزر أو حدث في لعبتك)
actionEvent:FireServer({ type = "start" })

-- استقبل النتائج واعرضها
actionEvent.OnClientEvent:Connect(function(_, status, value)
	print("تحديث النظام:", status, value)
end)`,
        fileName: "SystemClient.luau",
      },
      {
        heading: "كيف أكمله لك بالكامل؟",
        text:
          "أخبرني بتفاصيل أدق وسأولد لك النسخة الكاملة: ما الذي يفعله اللاعب بالضبط؟ ما البيانات المحفوظة؟ ما المكافأة أو النتيجة؟ مثال: \"اصنع نظام صيد سمك بزر وانتظار وندرة أسماك\".",
      },
    ],
    tips: [
      "تصفح مولد الأكواد — فيه أنظمة جاهزة قد تكون قريبة من فكرتك وتعدّل عليها.",
      "كل طلب تفصيلي أكثر يعطيني صورة أوضح فأكتب كوداً أدق.",
    ],
    sources: ["مولد هياكل عقل لواو"],
    followUps: [
      "أضف له حفظ بيانات بالداتا ستور",
      "أضف واجهة أزرار لهذا النظام",
      "كيف أحميه من الاستغلال؟",
    ],
  };
}

/** حالة توثيق معرفة اللاعب */
function docStatus(doc: SearchDoc): string {
  if (doc.source !== "user") return "";
  const confirms = doc.confirmCount ?? 0;
  const disputes = doc.disputeCount ?? 0;
  if (doc.verified) return "موثقة ✓ (" + confirms + " تأييد من اللاعبين)";
  if (disputes > confirms && disputes > 0) return "عليها خلاف ⚠ (" + disputes + " اعتراض)";
  return "جديدة — بانتظار تأكيد اللاعبين";
}

function greetingAnswer(question: string): EngineAnswer | null {
  const normalized = normalizeArabic(question);
  const greetings = ["مرحبا", "هلا", "سلام", "اهلين", "هاي", "صباح", "مساء", "هلو", "يا صاحبي", "كيفك"];
  if (normalized.length > 30) return null;
  const isGreeting = greetings.some((g) => normalized.includes(g));
  if (!isGreeting) return null;

  return {
    kind: "greeting",
    intro:
      "أهلاً بك يا صديقي! أنا عقل لواو — نموذج ذكاء اصطناعي لبرمجة روبلوكس مكتوب يدوياً من الصفر. جاهز أكتب لك أنظمة كاملة وأشرح لك كل التفاصيل.",
    sections: [
      {
        heading: "جرب أن تطلب مني:",
        text:
          "• \"اكتب لي نظام نقاط وذهب\"\n• \"زومبي يلاحق اللاعب\"\n• \"كيف أحفظ بيانات اللاعب؟\"\n• \"اشرح لي الميتا تيبل\"\n• \"متجر شراء آمن\"",
      },
    ],
    tips: [
      "كلما كان سؤالك أوضح كانت الإجابة أدق — اذكر ماذا تريد بالضبط.",
      "يمكنك أن تطلب أنظمة كاملة جاهزة للنسخ مباشرة إلى ستوديو.",
    ],
    sources: [],
    followUps: ["اكتب لي نظام حفظ بيانات كامل", "كيف أحمي لعبتي من المخترقين؟", "اشرح لي الأحداث في روبلوكس"],
  };
}

function capabilitiesAnswer(question: string): EngineAnswer | null {
  const normalized = normalizeArabic(question);
  const triggers = ["شو بتعرف", "ماذا تعرف", "ماذا تستطيع", "ماذا تفعل", "قدراتك", "من انت", "من أنت", "وش تقدر", "ايش تقدر", "ماذا يمكنك"];
  if (!triggers.some((t) => normalized.includes(t))) return null;

  return {
    kind: "capabilities",
    intro:
      "أنا عقل لواو — نموذج مكتوب يدوياً بالكامل" +
      (qwenAvailable()
        ? "، معزّز بنموذج Qwen للردود المولّدة والأكواد الكاملة."
        : " ولا أعتمد على أي API خارجي.") +
      " أجيبك من قاعدة معرفية ضخمة: دروس مدمجة، كتب، ومعارف اللاعبين، وأتعلم باستمرار من مساهماتهم.",
    sections: [
      {
        heading: "ما أستطيع فعله",
        text:
          "1. توليد أنظمة كاملة: نقاط، حفظ بيانات، أعداء أذكياء، متاجر، أبواب، منصات متحركة والمزيد.\n2. شرح المفاهيم: من المتغيرات حتى الميتا تيبل ونظام الأنواع.\n3. البحث في المعرفة: عندي " +
          BUILTIN_DOCS.length +
          " درساً ومرجعاً مدمجاً، إضافة إلى كل ما يعلمني إياه اللاعبون.\n4. نصائح أمان: لأن أغلب ثغرات روبلوكس تأتي من الثقة بالكلينت.",
      },
    ],
    tips: ["زر صفحة التدريب وأضف معلومات وجدتها على الإنترنت — سأستخدمها في إجاباتي فوراً."],
    sources: [],
    followUps: ["ما الفرق بين اللواو واللوا؟", "اكتب لي فخاً قاتلاً", "كيف يعمل التواصل بين السيرفر والكلينت؟"],
  };
}

/** وصف مصدر وثيقة — يستخدم في بناء سياق RAG وفي قائمة المصادر */
function sourceLabel(doc: SearchDoc): string {
  if (doc.source === "builtin") return "درس مدمج: " + doc.title;
  if (doc.source === "user") {
    if (doc.authorName === "تدريب Qwen") return "درس تدريب: " + doc.title;
    return "مساهمة لاعب: " + doc.title;
  }
  if (doc.source === "crawled")
    return (doc.authorName ?? "مصدر مجاني") + ": " + (doc.sourceUrl ?? doc.title);
  if (doc.source === "book") return "كتاب " + (doc.bookName ?? "") + " — " + doc.title;
  return doc.title;
}

/** يبني سياقاً مضغوطاً من أفضل النتائج لإرساله مع السؤال إلى النموذج */
function buildRagContext(results: ScoredDoc[], maxChars = 6000): string {
  const blocks: string[] = [];
  let used = 0;
  for (const r of results) {
    const doc = r.doc;
    const head = (doc.paragraphs[0] ?? "").slice(0, 1200);
    const code = doc.code ? "\nمثال كود:\n" + doc.code.slice(0, 1400) : "";
    const block = "[" + sourceLabel(doc) + "]\n" + head + code;
    if (used + block.length > maxChars) break;
    blocks.push(block);
    used += block.length;
  }
  return blocks.join("\n\n---\n\n");
}

const QWEN_SYSTEM =
  "أنت «عقل لواو» — مساعد خبير في برمجة روبلوكس بلغة لواو (Luau)، مدمج في أداة " +
  "تعليمية عربية. أجب بالعربية العامية (لهجة شامية)، بحد أقصى ~600 كلمة، مباشرة وبدون " +
  "مقدمات («إليك الجواب» ونحوها). استخدم عناوين ### للأقسام، وأكواد لواو داخل ```lua ... ```، " +
  "واختم بقائمة نصائح تبدأ بشرطة. استند إلى سياق المعرفة المقدَّم إن وجد، ولا تخترع شيئاً ضد " +
  "ما هو وارد فيه؛ وإن لم يوجد سياق فأجب من معرفتك بلغة لواو وروبلكس. ركّز على أفضل الممارسات " +
  "والأمان (لا تثق بالكلينت أبداً).";

/** إجابة مولّدة عبر Qwen بسياق المعرفة المسترجعة — تعيد null عند التعطيل/الفشل/الطريقة دون اتصال */
async function qwenEngineAnswer(
  question: string,
  results: ScoredDoc[],
  offline = false
): Promise<EngineAnswer | null> {
  if (!qwenAvailable() || offline) return null;

  const context = buildRagContext(results);
  const user =
    (context
      ? "معلومات من قاعدة معرفتي (وثائق، معارف لاعبين، كتب، صفحات قرأتها):\n" + context + "\n\n"
      : "لم أجد معلومات مسترجعة من قاعدة معرفتي — أجب من معرفتك الخاصة بلغة لواو.\n\n") +
    "سؤال اللاعب: " +
    question;

  const text = await qwenChat({ system: QWEN_SYSTEM, user });
  if (!text) return null;

  const parsed = parseQwenAnswer(text);
  const named = results
    .slice(0, 3)
    .map((r) => sourceLabel(r.doc));

  return {
    kind: "knowledge",
    intro:
      parsed.intro ||
      (results.length > 0 ? "هذا جوابي المولّد بناءً على معرفتي المدمجة:" : "إجابة مولّدة بواسطة النموذج:"),
    sections: parsed.sections,
    tips:
      parsed.tips.length > 0
        ? parsed.tips
        : ["إجابة مولّدة بالذكاء الاصطناعي — جرّب المثال في ستوديو قبل اعتماده."],
    sources: [...named, "مولّد بذكاء Qwen"],
    followUps: [
      "اشرح لي هذا الكود سطراً سطراً",
      "أعطني نسخة أنشط على هذا الموضوع",
      "كيف أحمي هذا النظام من الاستغلال؟",
    ],
  };
}

export async function answerQuestion(question: string, opts?: { offline?: boolean }): Promise<EngineAnswer> {
  const trimmed = question.trim();
  if (!trimmed) {
    return {
      kind: "fallback",
      intro: "اكتب سؤالك عن برمجة روبلوكس بلغة لواو وسأجيبك فوراً.",
      sections: [],
      tips: [],
      sources: [],
      followUps: ["اكتب لي نظام نقاط", "اشرح لي الجداول في لواو"],
    };
  }

  const greeting = greetingAnswer(trimmed);
  if (greeting) return greeting;

  const capabilities = capabilitiesAnswer(trimmed);
  if (capabilities) return capabilities;

  // 1) هل يقصد نظاماً جاهزاً من المولد؟
  const match = matchTemplate(trimmed);
  if (match && match.hits >= 2) {
    const template = TEMPLATES.find((t) => t.id === match.id)!;
    return generatorAnswer(template);
  }

  return await knowledgeAnswer(trimmed, opts?.offline === true);
}

function generatorAnswer(template: CodeTemplate): EngineAnswer {
  return {
    kind: "generator",
    intro:
      "فهمت طلبك — تريد: " +
      template.title +
      ". جهزت لك الكود كاملاً وجاهزاً للنسخ. " +
      template.description,
    sections: [
      { heading: "أين تضع الكود؟", text: template.placement },
      ...template.scripts.map((script) => ({
        heading: script.scriptType + " — " + script.name,
        text: "المكان: " + script.location,
        code: script.code,
        fileName: script.name + ".lua",
      })),
      {
        heading: "ملاحظات احترافية",
        text: template.notes.map((note, index) => index + 1 + ". " + note).join("\n"),
      },
    ],
    tips: [
      "اختبر النظام في وضع اللعب التجريبي قبل النشر.",
      "إذا أردت تعديلاً عليه أخبرني بالتفصيل وسأعدله لك.",
    ],
    sources: ["مولد أكواد عقل لواو — قالب " + template.title],
    followUps: [
      "كيف أضيف حفظ بيانات لهذا النظام؟",
      "كيف أحمي هذا النظام من الاستغلال؟",
      "أعطني درساً مرتبطاً بهذا النظام",
    ],
  };
}

/** فهرس موحد مخزّن مؤقتاً (كتب ضخمة + كل المصادر) — يعاد بناؤه كل دقيقة */
let unifiedCache: {
  at: number;
  index: LuauSearchIndex;
  docCount: number;
  baseIds: Set<string>;
} | null = null;
const INDEX_TTL = 60_000;

/**
 * يبني نص tsquery آمناً من توكنات السؤال (مطبّعة/مجذوعة بنفس خط `search_text`).
 * كل توكن يُقيَّد بحروف عربية/لاتينية/أرقام فقط ثم يُلحق به `:*` للمطابقة بالبادئة،
 * وتُوصل التوكنات بـ OR لرفع الاسترجاع. يعيد "" إن لم يبقَ توكن صالح.
 */
function ftsQueryString(query: string): string {
  const safe = contentTokens(query).filter((t) => /^[a-z0-9ء-ي_]+$/.test(t));
  const uniq = Array.from(new Set(safe)).slice(0, 20);
  return uniq.map((t) => t + ":*").join(" | ");
}

/**
 * مرشّحو بحث Postgres النصي (FTS) فوق كامل الجدولين — يتجاوز سقف الـ400 بجلب
 * أفضل المطابقات حسب `ts_rank_cd`. أي خطأ (عمود `search_text` غير مُهاجَر بعد،
 * أو لا اتصال) → مصفوفة فارغة، فيرجع البحث للنتائج الأساسية دون أي تراجع.
 */
async function ftsCandidates(query: string): Promise<SearchDoc[]> {
  const tsq = ftsQueryString(query);
  if (!tsq) return [];
  try {
    const [knowledge, crawled] = await Promise.all([
      pool.query<UserRow>(
        `SELECT id, title, content, code, tags,
                source_url AS "sourceUrl", source_type AS "sourceType",
                author_name AS "authorName", verified,
                confirm_count AS "confirmCount", dispute_count AS "disputeCount"
           FROM knowledge_entries
          WHERE to_tsvector('simple', coalesce(search_text, '')) @@ to_tsquery('simple', $1)
          ORDER BY ts_rank_cd(to_tsvector('simple', coalesce(search_text, '')), to_tsquery('simple', $1)) DESC
          LIMIT 60`,
        [tsq]
      ),
      pool.query<CrawledRow>(
        `SELECT id, url, origin, tags, title, content
           FROM crawled_pages
          WHERE status = 'done'
            AND to_tsvector('simple', coalesce(search_text, '')) @@ to_tsquery('simple', $1)
          ORDER BY ts_rank_cd(to_tsvector('simple', coalesce(search_text, '')), to_tsquery('simple', $1)) DESC
          LIMIT 30`,
        [tsq]
      ),
    ]);
    return [
      ...knowledge.rows.map(userRowToDoc),
      ...crawled.rows.map(crawledRowToDoc),
    ];
  } catch {
    // العمود غير مُهاجَر بعد أو تعذّر الاتصال — لا مرشّحين، والأساس يكفي
    return [];
  }
}

async function unifiedSearch(query: string): Promise<ScoredDoc[]> {
  const now = Date.now();
  if (!unifiedCache || now - unifiedCache.at > INDEX_TTL) {
    const [userDocs, crawledDocs, langBooks, knowBooks] = await Promise.all([
      fetchUserDocs(),
      fetchCrawledDocs(),
      fetchLanguageBooks(),
      fetchKnowledgeBooks(),
    ]);
    const bookDocs = [
      ...langBooks.flatMap((book) => bookToSearchDocs(book, "langbook")),
      ...knowBooks.flatMap((book) => bookToSearchDocs(book, "kbook")),
    ];
    const allDocs: SearchDoc[] = [
      ...BUILTIN_DOCS.map(builtinToSearchDoc),
      ...userDocs,
      ...crawledDocs,
      ...bookDocs,
    ];
    unifiedCache = {
      at: now,
      index: buildSearchIndex(allDocs),
      docCount: allDocs.length,
      baseIds: new Set(allDocs.map((d) => d.id)),
    };
  }
  const cache = unifiedCache;

  // 1) نتائج أساسية من الفهرس الثقيل المخزّن (مدمجة + آخر 400 + زاحف + كتب مقطّعة).
  const baseResults = cache.index.search(query, 8);

  // 2) مرشّحون من بحث Postgres النصي فوق كامل الجدولين — يكشف ما يتجاوز سقف الـ400.
  const ftsDocs = await ftsCandidates(query);
  const newDocs = ftsDocs.filter((d) => !cache.baseIds.has(d.id));

  // لا مرشّح جديد (أو تعطّل/فشل FTS) → النتائج الأساسية كما هي، مطابقة لسلوك اليوم.
  if (newDocs.length === 0) return baseResults;

  // 3) إعادة ترتيب اتحاد صغير: وثائق النتائج الأساسية + الجديدة، عبر فهرس BM25 طازج
  //    (لا نعيد بناء الفهرس الثقيل — الكتب قد تبلغ مئات المقاطع لكل كتاب).
  const unionDocs: SearchDoc[] = [];
  const seen = new Set<string>();
  for (const doc of [...baseResults.map((r) => r.doc), ...newDocs]) {
    if (seen.has(doc.id)) continue;
    seen.add(doc.id);
    unionDocs.push(doc);
  }
  const reranked = buildSearchIndex(unionDocs).search(query, 8);
  return reranked.length > 0 ? reranked : baseResults;
}

async function knowledgeAnswer(trimmed: string, offline = false): Promise<EngineAnswer> {
  // 2) البحث في كل المعرفة: المدمجة + اللاعبين + الزاحف + كتب اللغات
  const rawResults = await unifiedSearch(trimmed);

  // ترجيح حسب توثيق اللاعبين: الموثقة أقوى، المختلف عليها أضعف
  for (const result of rawResults) {
    const doc = result.doc;
    if (doc.source !== "user") continue;
    const confirms = doc.confirmCount ?? 0;
    const disputes = doc.disputeCount ?? 0;
    if (doc.verified) {
      result.score *= 1.5 + Math.min(confirms, 6) * 0.08;
    } else if (disputes > confirms && disputes > 0) {
      result.score *= 0.4;
    }
  }
  rawResults.sort((a, b) => b.score - a.score);
  const results = rawResults.slice(0, 3);

  // الدمج الكامل RAG: إن كان النموذج مفعّلاً، يولّد الجواب بسياق المعرفة المسترجعة.
  // أي فشل يعيد null → نكمل بالسيرة اليدوية الحالية دون أي تأثير.
  const ai = await qwenEngineAnswer(trimmed, results, offline);
  if (ai) return ai;

  // تغطية السؤال: نرفض فقط إذا لم تتطابق أي كلمة مع أفضل وثيقة
  const questionTokens = Array.from(new Set(contentTokens(trimmed)));
  let coverage = 0;
  if (results.length > 0) {
    const topDoc = results[0].doc;
    const topTokens = new Set(
      expandWithStems(
        tokenize(
          topDoc.title + " " + topDoc.paragraphs.join(" ") + " " + topDoc.tags.join(" ")
        )
      )
    );
    coverage = questionTokens.filter((t) => topTokens.has(t)).length;
  }

  const creation = isCreationRequest(trimmed);
  let tooWeak =
    results.length === 0 ||
    results[0].score < 0.8 ||
    (questionTokens.length >= 2 && coverage === 0);
  // طلب إنشاء لا يخطفه درس مدمج إلا بتطابق قوي — كتب اللغات ومعارف اللاعبين لها الأولوية
  if (!tooWeak && creation && results[0].doc.source === "builtin" && coverage < 2) {
    tooWeak = true;
  }

  if (tooWeak) {
    // طلب إنشاء نظام وما عندنا لا قالب ولا معرفة قوية → هيكل مخصص
    if (creation) {
      return customSystemAnswer(trimmed);
    }
    return {
      kind: "fallback",
      intro:
        "لم أجد في معرفتي الحالية جواباً دقيقاً لهذا السؤال — لكنني أتعلم بسرعة! إليك كيف تحصل على أفضل نتيجة:",
      sections: [
        {
          heading: "جرب إحدى هذه الطرق",
          text:
            "• اضغط زر «علّمه من الإنترنت» تحت هذا الرد — أبحث فوراً في ويكيبيديا ونتائج الويب وأتعلم الموضوع وأجيبك.\n• اطلب نظاماً من المولد: صيد، زراعة، بيتات، تعدين، مهام، أسلحة، مركبات، حفظ، أعداء...\n• من غرفة التدريب تقدر تكتب أي موضوع بخاصية البحث الحر فيقرؤه وأحفظه للأبد.",
        },
        {
          heading: "مجالات أتقنها تماماً",
          text:
            "المتغيرات والجداول والدوال، الشروط والحلقات، الميتا تيبل والأنواع، الأحداث والريموتات، الداتا ستور، التوين والمسارات، الواجهات، الأمان ضد المخترقين، وأنظمة الألعاب الكاملة.",
        },
      ],
      tips: ["كل معلومة تضيفها أو صفحة يقرؤها الزاحف تدخل فهرس بحثي مباشرة."],
      sources: [],
      followUps: ["اكتب لي نظام صيد سمك كامل", "اشرح لي الميتا تيبل", "كيف تصنع زومبي يلاحق اللاعب؟"],
    };
  }

  const top = results[0];
  const others = results.slice(1);

  const introParts: string[] = [];
  if (top.doc.source === "user") {
    introParts.push(
      "وجدت جواباً من المعرفة التي علمني إياها اللاعبون" +
        (top.doc.authorName ? " (بمساهمة " + top.doc.authorName + ")" : "") +
        " — إليك التفاصيل:"
    );
    introParts.push(
      "\n📌 حالة المعلومة: " +
        docStatus(top.doc) +
        (top.doc.sourceType ? " — مصدرها: " + top.doc.sourceType : "")
    );
  } else if (top.doc.source === "crawled") {
    introParts.push(
      "قرأت هذا من الإنترنت بنفسي (" +
        (top.doc.authorName ?? "مصدر مجاني") +
        ") وتعلمته — إليك الخلاصة:"
    );
  } else if (top.doc.source === "book") {
    introParts.push(
      "تعلمت هذا من كتاب \"" +
        (top.doc.bookName ?? "") +
        "\" الذي أضافه اللاعبون" +
        (top.doc.authorName ? " (بمساهمة " + top.doc.authorName + ")" : "") +
        " — إليك الخلاصة:"
    );
  } else {
    introParts.push("سؤال ممتاز! هذا ما أعرفه عن \"" + top.doc.title + "\":");
  }

  return {
    kind: "knowledge",
    intro: introParts.join(" "),
    sections: [
      {
        heading: top.doc.title,
        text: [top.doc.paragraphs[0] ?? "", ...top.doc.paragraphs.slice(1, 6)].filter(Boolean).join("\n\n"),
      },
      ...(top.doc.code
        ? [{ heading: "مثال كود جاهز", code: top.doc.code, fileName: "example.luau" }]
        : []),
      ...(others.length > 0
        ? [
            {
              heading: "مواضيع مرتبطة قد تفيدك",
              text: others
                .map((other) => "• " + other.doc.title + (other.doc.level ? " — مستوى " + other.doc.level : ""))
                .join("\n"),
            },
          ]
        : []),
    ],
    tips:
      top.doc.source === "builtin"
        ? [
            "اطلب مني دائماً مثالاً إضافياً أو حالة خاصة — أعرف تفاصيل كثيرة.",
            "راجع صفحة الدروس لهذا المستوى إذا أردت التعمق أكثر.",
          ]
        : top.doc.source === "crawled"
          ? [
              "هذه خلاصة قرأها الزاحف من مصدر مجاني — راجع الرابط الكامل للتعمق.",
              "شغّل الزاحف أكثر ليقرأ فصولاً وكتباً إضافية فيقوى جوابي.",
            ]
          : top.doc.source === "book"
            ? [
                "هذه المعرفة من كتاب " + (top.doc.bookName ?? "") + " — أجهزة اللاعبين تتدرب عليه الآن.",
                "اسألني أي تفصيلة أخرى عن " + (top.doc.bookName ?? "هذه اللغة") + " — الكتاب كامل عندي.",
              ]
            : [
              ...(top.doc.verified
                ? ["هذه المعلومة وثقها اللاعبون — موثوقيتها عالية."]
                : []),
              ...((top.doc.disputeCount ?? 0) > (top.doc.confirmCount ?? 0) && (top.doc.disputeCount ?? 0) > 0
                ? ["⚠ يوجد اعتراضات على هذه المعلومة — تحقق منها في الوثائق الرسمية قبل اعتمادها."]
                : []),
              "أكد أو اعترض على معارف اللاعبين في غرفة التدريب لتقوية المعلومة الصحيحة.",
              "أضف أنت أيضاً معلومات من الكتب والإنترنت في صفحة التدريب لتكبر معرفتي.",
            ],
    sources:
      top.doc.source === "user"
        ? [
            "مساهمة لاعب: " + top.doc.title,
            ...others.map((other) =>
              other.doc.source === "user" ? "مساهمة لاعب: " + other.doc.title : "درس مدمج: " + other.doc.title
            ),
          ]
        : top.doc.source === "crawled"
          ? [
              (top.doc.authorName ?? "مصدر مجاني") + ": " + (top.doc.sourceUrl ?? top.doc.title),
            ]
          : top.doc.source === "book"
            ? ["كتاب " + (top.doc.bookName ?? "") + " — أضافه " + (top.doc.authorName ?? "لاعب")]
            : [
              "درس مدمج: " + top.doc.title,
              ...others.map((other) =>
                other.doc.source === "user" ? "مساهمة لاعب: " + other.doc.title : "درس مدمج: " + other.doc.title
              ),
            ],
    followUps: [
      top.doc.code ? "اشرح لي هذا الكود سطراً سطراً" : "أعطني مثال كود على هذا الموضوع",
      "ما الأخطاء الشائعة في هذا الموضوع؟",
      "أعطني نظاماً كاملاً مرتبطاً بهذا",
    ],
  };
}

/** حجم قاعدة المعرفة الحالية — يستخدم في إحصاءات التدريب */
export async function knowledgeStats() {
  const [userDocs, crawledDocs, books, knowledgeBooksRows] = await Promise.all([
    fetchUserDocs(),
    fetchCrawledDocs(),
    fetchLanguageBooks(),
    fetchKnowledgeBooks(),
  ]);
  const builtinTokens = BUILTIN_DOCS.reduce(
    (sum, doc) => sum + tokenize(docToTrainingText(doc)).length,
    0
  );
  const userTokens = userDocs.reduce(
    (sum, doc) => sum + tokenize(doc.paragraphs.join(" ") + " " + (doc.code ?? "")).length,
    0
  );
  const crawledTokens = crawledDocs.reduce(
    (sum, doc) => sum + tokenize(doc.paragraphs.join(" ")).length,
    0
  );
  const bookTokensTotal =
    books.reduce((sum, book) => sum + book.tokens, 0) +
    knowledgeBooksRows.reduce((sum, book) => sum + book.tokens, 0);
  return {
    builtinDocs: BUILTIN_DOCS.length,
    userDocs: userDocs.length,
    crawledDocs: crawledDocs.length,
    languages: books.length,
    knowledgeBookCount: knowledgeBooksRows.length,
    bookTokens: bookTokensTotal,
    builtinTokens,
    userTokens,
    crawledTokens,
  };
}
