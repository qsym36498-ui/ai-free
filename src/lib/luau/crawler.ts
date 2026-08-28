/**
 * الزاحف الذاتي: قائمة كتب ومراجع مجانية يقرؤها النموذج من الإنترنت.
 * السيرفر يجلب الصفحة، يستخرج النص، ويضيفها لقاعدة المعرفة — بدون أي API.
 */

export interface QueueItem {
  url: string;
  origin: string;
  tags: string;
}

/** طابور القراءة: كتب مجانية ومنصات تعلم مفتوحة */
export const CRAWL_QUEUE: QueueItem[] = [
  {
    url: "https://www.lua.org/manual/5.1/manual.html",
    origin: "كتاب مجاني — مرجع Lua الرسمي",
    tags: "لوا,لغة,جداول,دوال,ميتا تيبل,كوروتين,انماط,مرجع,اساسيات",
  },
  {
    url: "https://www.lua.org/pil/1.html",
    origin: "كتاب مجاني — Programming in Lua الفصل 1",
    tags: "لوا,مقدمة,بداية,تعلم,اساسيات,برمجة",
  },
  {
    url: "https://www.lua.org/pil/2.html",
    origin: "كتاب مجاني — Programming in Lua الفصل 2 (الأنواع والقيم)",
    tags: "انواع,ارقام,نصوص,منطقي,نيل,جداول,اساسيات",
  },
  {
    url: "https://www.lua.org/pil/3.html",
    origin: "كتاب مجاني — Programming in Lua الفصل 3 (العبارات)",
    tags: "شروط,حلقات,عبارات,تكرار,اساسيات",
  },
  {
    url: "https://www.lua.org/pil/5.html",
    origin: "كتاب مجاني — Programming in Lua الفصل 5 (الجداول)",
    tags: "جداول,مصفوفات,قوائم,فرز,ترتيب,اساسيات",
  },
  {
    url: "https://www.lua.org/pil/6.html",
    origin: "كتاب مجاني — Programming in Lua الفصل 6 (الدوال)",
    tags: "دوال,وسائط,ارجاع,دوال متعددة,اساسيات",
  },
  {
    url: "https://www.lua.org/pil/13.html",
    origin: "كتاب مجاني — Programming in Lua الفصل 13 (الميتا تيبل)",
    tags: "ميتا تيبل,ميتاميثود,اندكس,وراثه,كائنات,متقدم",
  },
  {
    url: "https://en.wikibooks.org/wiki/Lua_Programming",
    origin: "كتاب مجاني — ويكي كتاب برمجة Lua",
    tags: "لوا,كتاب,دروس,اساسيات,منصات تعلم",
  },
  {
    url: "https://luau.org/",
    origin: "منصة — موقع لغة Luau الرسمي",
    tags: "لواو,لغة,روبلوكس,انواع,تحسين,اداء",
  },
  {
    url: "https://create.roblox.com/docs/luau",
    origin: "منصة — وثائق روبلوكس للواو",
    tags: "روبلوكس,لواو,وثائق,خدمات,اساسيات",
  },
  {
    url: "https://www.lua.org/pil/9.html",
    origin: "كتاب مجاني — Programming in Lua الفصل 9 (الكوروتين)",
    tags: "كوروتين,خيوط,تزامن,متقدم",
  },
  {
    url: "https://www.lua.org/pil/16.html",
    origin: "كتاب مجاني — Programming in Lua الفصل 16 (OOP بالجداول)",
    tags: "كائنات,وراثه,برمجه كائنيه,ميتا تيبل,متقدم",
  },
  {
    url: "https://www.lua.org/pil/7.html",
    origin: "كتاب مجاني — Programming in Lua الفصل 7 (التكرار والمكررات)",
    tags: "تكرار,مكررات,حلقات,iterators,متوسط",
  },
  {
    url: "https://www.lua.org/pil/8.html",
    origin: "كتاب مجاني — Programming in Lua الفصل 8 (مزيد عن الجداول)",
    tags: "جداول,فرز,ترتيب,قوائم,متوسط",
  },
  {
    url: "https://www.lua.org/pil/10.html",
    origin: "كتاب مجاني — Programming in Lua الفصل 10 (أنماط النصوص Patterns)",
    tags: "انماط,باترن,نصوص,بحث,استبدال,متوسط",
  },
  {
    url: "https://www.lua.org/pil/11.html",
    origin: "كتاب مجاني — Programming in Lua الفصل 11 (التعابير النمطية الكاملة)",
    tags: "انماط,ريجكس,نصوص,متقدم",
  },
  {
    url: "https://www.lua.org/pil/12.html",
    origin: "كتاب مجاني — Programming in Lua الفصل 12 (البيانات المنظمة)",
    tags: "بيانات,تقييم,تحميل,متوسط",
  },
  {
    url: "https://en.wikibooks.org/wiki/Lua_Programming/Tables",
    origin: "كتاب مجاني — ويكي الكتب: الجداول بالتفصيل",
    tags: "جداول,مصفوفات,قواميس,اساسيات",
  },
  {
    url: "https://en.wikibooks.org/wiki/Lua_Programming/Functions",
    origin: "كتاب مجاني — ويكي الكتب: الدوال بالتفصيل",
    tags: "دوال,وسائط,ارجاع,اساسيات",
  },
  {
    url: "https://luau.org/types",
    origin: "منصة — توثيق نظام الأنواع في لواو",
    tags: "انواع,تايب تشيك,لواو,متقدم",
  },
  {
    url: "https://luau.org/performance",
    origin: "منصة — دليل أداء لواو",
    tags: "اداء,تحسين,سرعه,لواو,متقدم",
  },
  {
    url: "https://en.wikipedia.org/wiki/Luau_(programming_language)",
    origin: "منصة — ويكيبيديا: لغة لواو",
    tags: "لواو,لغه,روبلوكس,تاريخ",
  },
  {
    url: "https://en.wikipedia.org/wiki/Roblox",
    origin: "منصة — ويكيبيديا: روبلوكس",
    tags: "روبلوكس,لعبه,منصه,تاريخ",
  },
  {
    url: "https://ar.wikipedia.org/wiki/%D8%B1%D9%88%D8%A8%D9%84%D9%88%D9%83%D8%B3",
    origin: "منصة — ويكيبيديا العربية: روبلوكس",
    tags: "روبلوكس,لعبه,منصه,عربي",
  },
];

/** استخراج النص المقروء من صفحة HTML يدوياً: حذف سكريبت وستايل ثم تقشير الوسوم */
export function extractReadableText(html: string): { title: string; text: string } {
  let title = "";
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) title = titleMatch[1].trim();

  let body = html;
  const bodyMatch = html.match(/<body[\s\S]*?<\/body>/i);
  if (bodyMatch) body = bodyMatch[0];

  body = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|p|div|li|h[1-6]|tr|td|th|section|article)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  let text = body
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();

  return { title: title || "(بدون عنوان)", text };
}

/** عدّ توكنات خفيف */
export function countTokens(text: string): number {
  const matches = text.match(/[\u0621-\u063A\u0641-\u064Aa-z0-9_]{2,}/gi);
  return matches ? matches.length : 0;
}
