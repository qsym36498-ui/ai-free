import { db } from "@/db";
import { crawledPages } from "@/db/schema";
import { countTokens, extractReadableText } from "./crawler";
import { buildSearchText, tokenize } from "./text";

export interface LearnedItem {
  title: string;
  origin: string;
  url: string;
  tokens: number;
}

const TIMEOUT = 8000;

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!response.ok) throw new Error("HTTP " + response.status);
  return response.json();
}

async function getText(url: string): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT),
    headers: { "User-Agent": "LuauMind-learner/1.0 (educational reader)" },
  });
  if (!response.ok) throw new Error("HTTP " + response.status);
  return response.text();
}

/** حفظ ما تعلمناه في قاعدة المعرفة (بدون تكرار لنفس الرابط) */
async function saveLearned(
  url: string,
  title: string,
  content: string,
  origin: string,
  tags: string
): Promise<LearnedItem | null> {
  const tokens = countTokens(content);
  if (tokens < 30) return null;

  const inserted = await db
    .insert(crawledPages)
    .values({
      url,
      title: title.slice(0, 200),
      content: content.slice(0, 16000),
      origin,
      tags,
      status: "done",
      tokens,
      fetchedAt: new Date(),
      searchText: buildSearchText(title, content, tags),
    })
    .onConflictDoNothing({ target: crawledPages.url })
    .returning({ id: crawledPages.id });

  if (inserted.length === 0) return null; // تعلمناه سابقاً
  return { title, origin, url, tokens };
}

/** يقرأ خلاصة موضوع من ويكيبيديا (عربي ثم إنجليزي) — API عام بلا مفتاح */
async function wikipediaLearn(query: string, lang: "ar" | "en", tags: string): Promise<LearnedItem | null> {
  const searchUrl =
    `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=1&srsearch=` +
    encodeURIComponent(query);
  const searchData = (await getJson(searchUrl)) as {
    query?: { search?: { title?: string }[] };
  };
  const title = searchData.query?.search?.[0]?.title;
  if (!title) return null;

  const summaryUrl =
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/` + encodeURIComponent(title);
  const summary = (await getJson(summaryUrl)) as { extract?: string; title?: string };
  const extract = summary.extract ?? "";
  if (extract.length < 150) return null;

  return saveLearned(
    `https://${lang}.wikipedia.org/wiki/` + encodeURIComponent(title),
    (summary.title ?? title) + (lang === "ar" ? "" : " (ويكيبيديا)"),
    extract,
    lang === "ar" ? "بحث حر — ويكيبيديا العربية" : "بحث حر — ويكيبيديا الإنجليزية",
    tags
  );
}

/** يقرأ روابط نتائج DuckDuckGo (قراءة صفحة النتائج كزائر عادي، بلا مفتاح) */
async function duckDuckGoLinks(query: string): Promise<string[]> {
  const html = await getText(
    "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query)
  );

  const links: string[] = [];
  const pattern = /class="result__a"[^>]*href="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null && links.length < 4) {
    let href = match[1];
    const uddg = href.match(/[?&]uddg=([^&]+)/);
    if (uddg) {
      try {
        href = decodeURIComponent(uddg[1]);
      } catch {
        continue;
      }
    }
    if (href.startsWith("http") && !href.includes("duckduckgo.com") && !href.includes("wikipedia.org")) {
      links.push(href);
    }
  }
  return links;
}

/**
 * البحث الحر: يسأل ويكيبيديا (عربي/إنجليزي) ويقرأ أول نتيجتين من
 * DuckDuckGo، ويحفظ كل شيء في دماغ النموذج — بدون أي مفتاح API.
 */
export async function learnFromWeb(query: string): Promise<LearnedItem[]> {
  const learned: LearnedItem[] = [];
  const tags = tokenize(query).slice(0, 10).join(",");
  const isArabic = /[\u0621-\u064A]/.test(query);

  // ويكيبيديا: اللغة الأقرب للسؤال أولاً
  for (const lang of isArabic ? (["ar", "en"] as const) : (["en", "ar"] as const)) {
    try {
      const item = await wikipediaLearn(query, lang, tags);
      if (item) learned.push(item);
    } catch {
      /* نتابع لباقي المصادر */
    }
  }

  // نتائج DuckDuckGo: نقرأ أول صفحتين خارجيتين
  try {
    const links = await duckDuckGoLinks(query);
    for (const url of links.slice(0, 2)) {
      try {
        const html = await getText(url);
        const { title, text } = extractReadableText(html);
        if (text.length < 200) continue;
        const item = await saveLearned(url, title, text, "بحث حر — من نتائج DuckDuckGo", tags);
        if (item) learned.push(item);
      } catch {
        /* صفحة محجوبة أو بطيئة — نتخطاها */
      }
    }
  } catch {
    /* البحث بالروابط اختياري */
  }

  return learned;
}
