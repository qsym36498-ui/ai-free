/**
 * مولّف الإجابات المتعددة المصادر — لما سؤال اللاعب يلمس أكثر من نظام أو يطلب
 * تفاصيل دقيقة (حد أقصى، حفظ، لكل لاعب) لا ننسخ قالباً واحداً، بل نجمع من
 * أكثر من مصدر ونكتب نظاماً متكاملاً يحترم كل ما طلبه.
 */
import { getTemplate, scoreTemplates, type TemplateScored } from "./templates";
import type { CodeTemplate, EngineAnswer } from "./types";

/** اسم قالب العداد الآمن المتكامل */
const ADVANCED_CLICK_ID = "click-counter-advanced";

/** استخراج "حد أقصى للنقرات في الثانية" من السؤال إن ذُكر */
export function extractClickLimit(question: string): number | null {
  const normalized = question.toLowerCase().replace(/ة/g, "ه");

  const patterns: RegExp[] = [
    /حد\s*[ااأ]قصى?\s*(\d+)/,
    /بحد\s*(\d+)/,
    /اقصى?\s*عدد\s*(\d+)/,
    /فقط\s*(\d+)\s*(نقره|نقرات|كليك|ضغطه|مره)/,
    /(\d+)\s*بالنقره/,
    /(\d+)\s*نقرات?\s*(في|بال)?\s*(الثانيه|كل ثانيه|بالوثانيه)/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const value = parseInt(match[1], 10);
      if (value >= 1 && value <= 1000) return value;
    }
  }

  return null;
}

/** هل السؤال يطلب نظاماً يوفر الحفظ بين الجلسات؟ */
function wantsPersistence(question: string): boolean {
  const normalized = normalizeForDetection(question);
  return (
    normalized.includes("حفظ") ||
    normalized.includes("يخزن") ||
    normalized.includes("داتا ستور") ||
    normalized.includes("datastore") ||
    normalized.includes("عند الخروج") ||
    normalized.includes("عند الطلوع") ||
    normalized.includes("بين الجلسات")
  );
}

/** هل السؤال يطلب نظاماً لكل لاعب (جداول/حالة منفصلة)؟ */
function wantsPerPlayer(question: string): boolean {
  const normalized = normalizeForDetection(question);
  return normalized.includes("لكل لاعب") || normalized.includes("لكل انفر") || normalized.includes("على حدا");
}

/** هل السؤال يطلب حماية ضد الغش؟ */
function wantsAntiCheat(question: string): boolean {
  const normalized = normalizeForDetection(question);
  return (
    normalized.includes("حد اقصى") ||
    normalized.includes("بحد") ||
    normalized.includes("ما يغش") ||
    normalized.includes("ضد الغش") ||
    normalized.includes("معدل") ||
    normalized.includes("استغلال")
  );
}

function normalizeForDetection(text: string): string {
  return text.toLowerCase().replace(/[إأآا]/g, "ا").replace(/ة/g, "ه");
}

/** هل السؤال يطلب عداد نقرات أو واجهة زر؟ */
function wantsClickCounter(question: string): boolean {
  const normalized = normalizeForDetection(question);
  return (
    normalized.includes("نقرات") ||
    normalized.includes("نقره") ||
    normalized.includes("كليك") ||
    normalized.includes("النقر") ||
    normalized.includes("العداد") ||
    normalized.includes("زر ")
  );
}

/**
 * إجابات مدمجة متعددة المصادر — تُرجع null إذا السؤال يخص نظاماً واحداً فقط.
 */
export function multiSourceAnswer(question: string): EngineAnswer | null {
  const matches = scoreTemplates(question).filter((m) => m.hits >= 2);
  if (matches.length === 0) return null;

  const top = matches[0];

  // 1) عداد النقرات الآمن: نلبي كل التفاصيل المطلوبة (لكل لاعب + حد + حفظ).
  //    الكود يأتي دائماً من القالب المتكامل حتى لو رجّح غيره سؤالٌ بسيط.
  if (top.template.id === ADVANCED_CLICK_ID || (wantsClickCounter(question) && matches.some((m) => m.template.id === ADVANCED_CLICK_ID))) {
    const advanced = matches.find((m) => m.template.id === ADVANCED_CLICK_ID) ?? { template: getTemplate(ADVANCED_CLICK_ID)! };
    return composedClickAnswer(matches, advanced.template, question);
  }

  // 2) سؤال مركّب يلمس أكثر من نظام جاهز — نعرضها معاً وسرّبنا بينها
  if (matches.length >= 2) {
    return composedMultiTemplateAnswer(matches, question);
  }

  return null;
}

/** بناء رد عداد النقرات المتكامل مع تطبيق الحد المُكتَشف */
function composedClickAnswer(matches: TemplateScored[], primary: CodeTemplate, question: string): EngineAnswer {
  const limit = extractClickLimit(question) ?? 3;
  const persistence = wantsPersistence(question);
  const perPlayer = wantsPerPlayer(question);
  const antiCheat = wantsAntiCheat(question);

  const sections = primary.scripts.slice(0, 2).map((script) => {
    const code = applyClickAdapter(script.code, limit);
    return {
      heading: script.scriptType + " — " + script.name,
      text: "المكان: " + script.location,
      code,
      fileName: script.name + ".lua",
    };
  });

  const otherTemplates = matches.filter((m) => m.template.id !== primary.id);

  const requiredNotes: string[] = [];
  if (!persistence) {
    requiredNotes.push("هذا القالب يحفظ التلقائياً افتراضياً — إن لم ترد الحفظ احذف قسم DataStoreService من السكربت.");
  }
  if (!antiCheat) {
    requiredNotes.push("أضفت حداً أقصى 3 بالنقرة افتراضياً — عدِّل MAX_PER_SECOND أو اطلب مني تغييره.");
  }

  return {
    kind: "generator",
    intro:
      "جمعت لك هذا الرد من أكثر من مصدر في دماغي، مش من صفحة وحدة: عداد النقرات (جداول لكل لاعب)، أمان الريموتات عبر RemoteEvent، الداتا ستور للحفظ، ولوحة الـ leaderstats للعرض، بالإضافة إلى " + primary.title + ". سأراعي كل تفاصيل طلبك: " +
      (perPlayer ? "عداد مخزّن في جدول لكل لاعب، " : "") +
      (antiCheat ? "الحد الأقصى للنقرات لمنع الغش، " : "") +
      (persistence ? "حفظ تلقائي للبيانات عند الخروج، " : "") +
      "والتأكيد أن أي تغيير يمر من السيرفر.",

    sections: [
      { heading: "أين تضع الكود؟", text: primary.placement },
      ...sections,
      {
        heading: "ملاحظات احترافية (مدمجة من أكثر من مصدر)",
        text: [
          ...primary.notes.map((note, i) => i + 1 + ". " + note),
          ...requiredNotes.map((note, i) => primary.notes.length + i + 1 + ". " + note),
        ].join("\n"),
      },
    ],

    tips: [
      "السيرفر هو الوحيد الذي يملك الحقيقة — اللوكال يرسل طلباً فقط، فلا يمكن الغش من واجهة اللاعب.",
      "إن زادت النقرات على الحد ترد لك 'blocked' في الواجهة — يستطيع اللاعب رؤيتها عند محاولة تجاوز الحد.",
    ],
    sources: [
      "مولد أكواد عقل لواو — " + primary.title,
      ...otherTemplates.slice(0, 3).map((m) => "قالب مدمج: " + m.template.title),
      "درس: الجداول مراجع لا نسخ (tables-references)",
      "درس: التعامل الآمن مع RemoteEvent (remote-events + remote-security-deep)",
      "درس: الداتا ستور والحفظ (datastores)",
      "درس: لوحة الإحصائيات leaderstats (قالب نقاط وذهب)",
    ],
    followUps: [
      "بدّل لي الحد الأقصى إلى 10 نقرات في الثانية",
      "أضف مكافأة ذهب لكل 10 نقرات",
      "كيف أحمي هذا النظام من الاستغلال؟",
    ],
  };
}

/** تطبيق تخصيصات السؤال على كود القالب (الحد/المصطلحات) */
function applyClickAdapter(code: string, limit: number): string {
  return code.replace(/MAX_PER_SECOND\s*=\s*\d+/, "MAX_PER_SECOND = " + limit);
}

/** بناء رد يوضح أكثر من نظام جاهز يلمسه السؤال، مع دمج المصادر */
function composedMultiTemplateAnswer(matches: TemplateScored[], question: string): EngineAnswer {
  const primary = matches[0].template;

  const sections: Array<{ heading?: string; text?: string; code?: string; fileName?: string }> = [
    { heading: "أين تضع كل سكربت؟", text: mergePlacements(matches) },
  ];

  for (const m of matches.slice(0, 4)) {
    for (const script of m.template.scripts.slice(0, 2)) {
      sections.push({
        heading: script.scriptType + " — " + script.name + " (" + m.template.title + ")",
        text: "المكان: " + script.location,
        code: script.code,
        fileName: script.name + ".lua",
      });
    }
  }

  sections.push({
    heading: "كيف تربطهم معاً؟",
    text: mergeNote(matches),
  });

  return {
    kind: "generator",
    intro:
      "سؤالك يلمس أكثر من نظام، جمعت جوابك من أكثر من مصدر عندي بدل ما أنسخك صفحة وحدة. الأنظمة المتقاطعة في طلبك: " +
      matches.map((m, i) => (i + 1) + ") " + m.template.title).join("، ") +
      ". إليك كل ملف مع ملاحظة ربطهم معاً:",
    sections,
    tips: [
      "كل نظام هنا يعمل مستقلاً — الروابط بينهم (ريموتات/جداول مشتركة) مذكورة في ملاحظة الربط.",
      "أخبرني إن أردت أن أدمجهم في سكربت واحد كامل بدل عدة ملفات.",
    ],
    sources: [
      ...matches.map((m) => "مولد أكواد عقل لواو — قالب " + m.template.title),
      "دمج تلقائي متعدد المصادر من محرك عقل لواو",
    ],
    followUps: [
      "ادمجهم لي في نظام واحد كامل",
      "أضف حفظ بيانات بين الجلسات لهم",
      "كيف أحمي الربط من الاستغلال؟",
    ],
  };
}

function mergePlacements(matches: TemplateScored[]): string {
  const lines = matches.map((m, i) => (i + 1) + ". " + m.template.title + " → " + m.template.placement);
  return lines.join("\n");
}

function mergeNote(matches: TemplateScored[]): string {
  const names = matches.map((m) => m.template.title);
  return (
    "ضع كل نظام في موضعه، ثم اربط بينهم بالطريقة التالية:\n" +
    "• أنشئ RemoteEvent واحداً في ReplicatedStorage يمرر حدث الفعل (النقر، الشراء، اللمس) ليصل للسيرفر.\n" +
    "• السيرفر يعتمد على جداول حالة لكل لاعب (playerState) ليملك الحقيقة ويمنع التلاعب.\n" +
    "• كل قيمة يُكتب لها في مثيلات leaderstats تُحدَّث من السيرفر فقط.\n" +
    "• عند الخروج احفظ الحالة في DataStore بمفتاح player_<UserId>.\n" +
    "الأنظمة المدمجة: " +
    names.join("، ") +
    " — كل واحد يكمل الآخر، والسيرفر هو الرابط الذي يضمن الأمان."
  );
}