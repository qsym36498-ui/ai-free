/**
 * فحص صحة كود تعليمي يخرج من النموذج المدرب — يمنع حفظ دروس بكود لا يعمل:
 * معرّفات غير لاتينية (أسماء متغيرات/دوال عربية = خطأ نحوي في كل اللغات المدعومة)
 * وعامل ++ غير موجود في لواو. النصوص الحرفية والتعليقات العربية مسموحة.
 *
 * ملاحظة لغوية حاسمة: لواو تدعم العوامل المركبة (+= -= *= /= ..= وغيرها) منذ 2020 —
 * فلا تُرفض أبداً. الوعي باللغة ضروري: عارض `#` طولٌ في لواو لكنه تعليق في بايثون.
 * لذلك الفحص والتنظيف يعملان باصطياد تعليقات اللغة المستهدفة فقط.
 */

export type CodeLang = "lua" | "python" | "js" | "cpp";

/**
 * يحدد لغة درس من اسم موضوعه أو حقل lang — الافتراضي لواو (قلب المنهج).
 * عندما لا يفضح الاسم اللغة، نحتاط بتوقيعات داخل الكود (std:: / import / const...).
 */
export function detectLang(topicOrLang: string, code?: string | null): CodeLang {
  const s = topicOrLang.toLowerCase();
  if (s.includes("باي") || s.includes("python")) return "python";
  if (s.includes("جافاس") || s.includes("typescript") || s.includes("javascript") || s.includes("js")) return "js";
  if (s.includes("c++") || s.includes("cpp") || s.includes("سي+")) return "cpp";

  // لا توقيع أصلاً — الافتراضي لواو
  if (!code || !code.trim()) return "lua";

  const c = code.slice(0, 2000);
  let python = 0;
  let js = 0;
  let cpp = 0;
  if (/^\s*(import|from)\s+[a-zA-Z_]|^[ \t]*(print|if __name__|def )|#[^\n]*/m.test(c)) python++;
  if (/\bimport\s+(argparse|json|os|sys)\b|argparse|sys\.argv|json\.load|open\(.*'[wr]'/.test(c)) python++;
  if (/std::|#include\s*<|cout|cin\s*>>|using namespace|int main\s*\(/.test(c)) cpp++;
  if (/^[ \t]*(const|let|var|console\.|\bimport\s+.*from\s+)|new Date\(|document\.|require\(['"]react/.test(c) && !/def\s+\w+\(/.test(c)) js++;
  if (/Intl\.|window\.|=>/.test(c)) js++;

  const best = [python, js, cpp];
  const max = Math.max(...best);
  if (max > 0 && (max > 1 || [python, js, cpp].filter((x) => x === max).length === 1)) {
    if (python === max) return "python";
    if (js === max) return "js";
    if (cpp === max) return "cpp";
  }
  return "lua";
}

/** يشيل التعليقات والنصوص الحرفية بلغة اللغة المستهدفة — لتبقى المعرّفات والبنية فقط */
export function stripStringsAndComments(code: string, lang: CodeLang = "lua"): string {
  let s = code;
  if (lang === "lua") {
    s = s
      .replace(/--\[\[[\s\S]*?\]\]/g, "\n")
      .replace(/--\[=*\[[\s\S]*?\]=*\]/g, "\n")
      .replace(/--[^\n]*/g, "\n")
      .replace(/--[^\n]*$/gm, "");
  } else if (lang === "python") {
    s = s.replace(/"""[\s\S]*?"""/g, '""').replace(/'''[\s\S]*?'''/g, "''").replace(/#[^\n]*/g, "\n");
  } else if (lang === "js") {
    s = s
      .replace(/`(?:\\.|[^\\`])*`/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "\n")
      .replace(/\/\/[^\n]*/g, "\n");
  } else {
    // cpp: // و /* */ و أسطر المسبق #
    s = s
      .replace(/\/\*[\s\S]*?\*\//g, "\n")
      .replace(/\/\/[^\n]*/g, "\n")
      .replace(/^#.*$/gm, "\n");
  }
  return s
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
}

/** يرجع سبب عدم صحة الكود أو null لو صالح ظاهرياً حسب لغة الدرس */
export function hasInvalidCode(code: string, lang: CodeLang = "lua"): string | null {
  const stripped = stripStringsAndComments(code, lang);

  // معرّفات غير لاتينية (عربية/عبرية/سيريلية...) = خطأ نحوي في كل اللغات
  const nonLatin = stripped.match(/[\p{Script=Arabic}\u05D0-\u05FF\u0400-\u04FF\u3000-\u30FF]/u);
  if (nonLatin) return "معرّفات غير لاتينية (أسماء عربية) في الكود";

  // عامل ++ غير موجود في لواو فقط (المركّبة += لدى لواو صالحة)
  if (lang === "lua") {
    if (stripped.includes("++")) return "عامل الزيادة ++ غير مدعوم في الكود";
  }

  return null;
}

/**
 * يعيد تسمية المعرّفات غير اللاتينية (عربية) بأسماء لاتينية آمنة — مع الحفاظ
 * على السلاسل والتعليقات حسب لغة الدرس. الاستبدال متسق داخل الدرس: نفس الاسم
 * العربي → نفس الاسم اللاتيني دوماً. العوامل المركبة (+= وغيرها) تُترك كما هي
 * لأنها صالحة في لواو وكل اللغات المدعومة.
 */
export function sanitizeCode(code: string, lang: CodeLang = "lua"): string {
  const existing = new Set<string>();
  for (const m of code.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)) existing.add(m[0]);

  const renames = new Map<string, string>();
  let counter = 0;
  const renameFor = (token: string): string => {
    const prev = renames.get(token);
    if (prev) return prev;
    let candidate = "ar" + ++counter;
    while (existing.has(candidate)) candidate = "ar" + ++counter;
    existing.add(candidate);
    renames.set(token, candidate);
    return candidate;
  };

  // النصوص الحرفية والتعليقات الخاصة بلغة الدرس تحفظ كما هي
  const protectedRe: RegExp =
    lang === "lua"
      ? /("[^"\\\n]*(?:\\.[^"\\\n]*)*"|'[^'\\\n]*(?:\\.[^'\\\n]*)*'|--\[\[[\s\S]*?\]\]|\[\[[\s\S]*?\]\]|--[^\n]*)/g
      : lang === "python"
        ? /("[^"\\\n]*(?:\\.[^"\\\n]*)*"|'[^'\\\n]*(?:\\.[^'\\\n]*)*'|"""[\s\S]*?"""|'''[\s\S]*?'''|#[^\n]*)/g
        : lang === "js"
          ? /("[^"\\\n]*(?:\\.[^"\\\n]*)*"|'[^'\\\n]*(?:\\.[^'\\\n]*)*'|`(?:\\.|[^\\`])*`|\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g
          : /("[^"\\\n]*(?:\\.[^"\\\n]*)*"|'[^'\\\n]*(?:\\.[^'\\\n]*)*'|\/\/[^\n]*|\/\*[\s\S]*?\*\/|^#[^\n]*$)/gm;

  // فاصل عنونة عربي صامت (ZWNJ/ZWJ) أحياناً داخل الاسم — يشال ليصير توكناً واحداً
  const invisible = /[\u200C\u200D\u200E\u200F]/g;
  // أي كتلة معرّف (حروف/أرقام/شرطة سفلية من أي لغة) — لو تحوي رمزاً غير أسكي أعيد تسميتها كلها
  const identRun = /[\p{L}\p{N}_\u200C-\u200F]+/gu;

  const fixPlain = (plain: string): string => {
    const cleaned = plain.replace(invisible, "");
    const renamed = cleaned.replace(identRun, (m) => (/[\u0080-\uFFFF]/u.test(m) ? renameFor(m) : m));
    if (lang !== "lua") return renamed;
    return renamed
      // "local a b = ..." غير صالح في لواو (بقايا اسمين عربيين متجاورين)
      .replace(/^\s*local\s+[A-Za-z_]\w*\s+[A-Za-z_]\w*\s*=/gm, (m) => m.replace(/\s+[A-Za-z_]\w*\s*=/g, " = "));
  };

  let out = "";
  let lastPos = 0;
  for (const pm of code.matchAll(protectedRe)) {
    const idx = pm.index as number;
    out += fixPlain(code.slice(lastPos, idx));
    out += pm[0];
    lastPos = idx + pm[0].length;
  }
  out += fixPlain(code.slice(lastPos));
  return out;
}

/** اسم قديم محفوظ للتوافق — نفس دالة sanitizeCode */
export function sanitizeLuauCode(code: string, lang: CodeLang = "lua"): string {
  return sanitizeCode(code, lang);
}