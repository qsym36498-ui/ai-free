/**
 * أدوات معالجة النصوص — مكتوبة يدوياً بالكامل.
 * تطبيع عربي + إنجليزي، تقطيع كلمات، وإزالة كلمات التوقف.
 */

/** إزالة التشكيل وتوحيد الألف والهاء والياء والتطويل */
export function normalizeArabic(input: string): string {
  return input
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "") // تشكيل + تطويل
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .toLowerCase();
}

/** استخراج الكلمات: أحرف عربية/لاتينية وأرقام و _ (بدون ترقيم عربي مثل ؟ ، ؛) */
export function tokenize(input: string): string[] {
  const normalized = normalizeArabic(input);
  const matches = normalized.match(/[\u0621-\u063A\u0641-\u064Aa-z0-9_]+/g);
  return matches ?? [];
}

const STOPWORDS = new Set([
  "في", "من", "على", "عن", "الي", "الى", "انه", "انها", "هذا", "هذه",
  "ذلك", "التي", "الذي", "ثم", "او", "و", "ب", "ل", "ف", "كيف", "ما",
  "ماذا", "ماذا", "هل", "لماذا", "متي", "اين", "انا", "انت", "هو", "هي",
  "نحن", "كل", "بعد", "قبل", "مع", "عند", "يا", "لو", "بدي", "بديك",
  "هيك", "كتير", "شوي", "يعني", "ايه", "لا", "نعم", "طيب", "منيح",
  "معلومات", "معلومه", "اشرح", "اشرحلي", "شرح", "شرحلي", "كيفية", "كيفيه",
  "شي", "شغله", "شغلة", "عندي", "عنديك", "ممكن", "بسرعه", "الان", "هلق",
  "تفصيل", "تفاصيل", "بالتفصيل", "بالكامل", "تمام", "لي", "لك", "اله",
  "طريقه", "طريقة", "احسن", "افضل", "اسهل", "ازاي", "شو", "وش", "ايش",
  "the", "a", "an", "of", "to", "in", "on", "for", "and", "or", "is",
  "are", "how", "what", "why", "when", "where", "can", "you", "i", "my",
  "me", "it", "this", "that", "with", "about", "please", "want", "need",
]);

/**
 * جذع عربي خفيف مكتوب يدوياً: يفصل البادئات الشائعة
 * (ال، وال، بال، لل، فـ، بـ، لـ، و~) حتى تتطابق الكلمات بأشكالها.
 */
const LONG_AR_PREFIXES = ["وال", "بال", "كال", "فال", "لل"];

export function stemArabic(token: string): string {
  if (!/[\u0621-\u063A\u0641-\u064A]/.test(token)) return token;
  for (const prefix of LONG_AR_PREFIXES) {
    if (token.startsWith(prefix) && token.length - prefix.length >= 3) {
      return token.slice(prefix.length);
    }
  }
  if (token.startsWith("ال") && token.length >= 5) {
    return token.slice(2);
  }
  for (const prefix of ["و", "ب", "ل", "ف"]) {
    if (token.startsWith(prefix) && token.length >= 5) {
      return token.slice(1);
    }
  }
  return token;
}

/** كل أشكال الجذع لكلمة: البادئات + الجمع (ات) + ياء الملكية */
export function stemVariants(token: string): string[] {
  const variants = new Set<string>([token]);
  if (!/[\u0621-\u063A\u0641-\u064A]/.test(token)) return [token];

  let t = token;
  for (const prefix of LONG_AR_PREFIXES) {
    if (t.startsWith(prefix) && t.length - prefix.length >= 3) {
      t = t.slice(prefix.length);
      variants.add(t);
      break;
    }
  }
  if (t.startsWith("ال") && t.length >= 5) {
    t = t.slice(2);
    variants.add(t);
  } else if (/^[وبلف]/.test(t) && t.length >= 5) {
    variants.add(t.slice(1));
  }

  if (t.endsWith("ات") && t.length >= 5) variants.add(t.slice(0, -2));
  if (t.endsWith("ي") && t.length >= 4) variants.add(t.slice(0, -1));

  return Array.from(variants);
}

/** توسيع قائمة توكنات بكل أشكالها الجذعية — يرفع الاسترجاع دون فقدان الدقة */
export function expandWithStems(tokens: string[]): string[] {
  const expanded = new Set<string>();
  for (const token of tokens) {
    for (const variant of stemVariants(token)) {
      if (variant.length >= 2) expanded.add(variant);
    }
  }
  return Array.from(expanded);
}

export function contentTokens(input: string): string[] {
  const base = tokenize(input).filter((t) => !STOPWORDS.has(t) && t.length > 1);
  return expandWithStems(base);
}

/**
 * نص بحث مطبّع ومجذوع يُخزَّن في عمود `search_text` لجداول قاعدة البيانات.
 * يجمع كل الأجزاء (عنوان/محتوى/كود/وسوم) ويمررها على نفس خط المعالجة الذي
 * يستخدمه الاستعلام (`contentTokens`)، فيتطابق ما هو مفهرس مع صيغة السؤال في
 * بحث Postgres النصي (to_tsvector/to_tsquery). يعيد سلسلة توكنات مفصولة بمسافات.
 */
export function buildSearchText(...parts: Array<string | null | undefined>): string {
  const joined = parts.filter((p): p is string => typeof p === "string" && p.length > 0).join(" ");
  if (!joined.trim()) return "";
  return contentTokens(joined).join(" ");
}

/** تقسيم بسيط لسطور الكود إلى عبارات قابلة للبحث */
export function codeTokens(code: string): string[] {
  const noStrings = code.replace(/"(?:[^"\\]|\\.)*"/g, " ");
  return tokenize(noStrings).filter((t) => t.length > 1 && !/^\d+$/.test(t));
}

/** FNV-1a 32bit — تستخدم في تدريب الأجهزة وفي البصمات */
export function fnv1a(text: string, seed = 0x811c9dc5): number {
  let hash = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function hashToHex(n: number): string {
  return n.toString(16).padStart(8, "0");
}

/** تشابه بسيط بين استعلامين عبر تقاطع التوكنات — للاقتراحات */
export function overlapScore(a: string[], b: string[]): number {
  const setB = new Set(b);
  let hit = 0;
  for (const t of a) if (setB.has(t)) hit++;
  return hit;
}
