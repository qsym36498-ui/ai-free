/**
 * منفّذ الزحف الذاتي: خطوة واحدة تجلب صفحة من الطابور وتضعها في قاعدة المعرفة.
 * مع شفاء ذاتي: يعيد التقاط الصفحات التي مات طلبها (reading قديمة) ويعيد
 * محاولة الفاشلة مؤقتاً بحدّ أقصى للمحاولات وفاصل بين الجلسات — لا تتجمد
 * "قرأ X من Y" بعد الآن.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { crawledPages } from "@/db/schema";
import { buildSearchText } from "./text";
import {
  CRAWL_FAILED_COOLDOWN_SECONDS,
  CRAWL_MAX_ATTEMPTS,
  CRAWL_QUEUE,
  CRAWL_STALE_READING_SECONDS,
  countTokens,
  extractReadableText,
} from "./crawler";

export interface CrawlTickResult {
  ok: boolean;
  done: boolean;
  message?: string;
  title?: string;
  origin?: string;
  tokens?: number;
  pageId?: number;
  failedUrl?: string;
  error?: string;
}

/** يضيف روابط الطابور الجديدة فقط (بدل إعادة البذر التي تتجاهل القائمة المحدثة) */
export async function seedCrawlQueue(): Promise<number> {
  const existing = await db.select({ url: crawledPages.url }).from(crawledPages);
  const seen = new Set(existing.map((row) => row.url));
  const missing = CRAWL_QUEUE.filter((item) => !seen.has(item.url));
  if (missing.length === 0) return 0;
  await db
    .insert(crawledPages)
    .values(missing.map((item) => ({ url: item.url, origin: item.origin, tags: item.tags })));
  return missing.length;
}

/** ينفذ خطوة قراءة واحدة ويرجع تقريرها */
export async function crawlNextPage(): Promise<CrawlTickResult> {
  const now = new Date();

  // يلتقط: الصفحات المعلّقة، أو عالقة "reading" بطلب ميت، أو فاشلة تستحق محاولة
  const [page] = await db
    .select()
    .from(crawledPages)
    .where(
      sql`(${crawledPages.status} = 'pending'
        OR (${crawledPages.status} = 'reading'
          AND (${crawledPages.fetchedAt} IS NULL OR ${crawledPages.fetchedAt} < now() - make_interval(secs => ${CRAWL_STALE_READING_SECONDS})))
        OR (${crawledPages.status} = 'failed'
          AND ${crawledPages.crawlAttempts} < ${CRAWL_MAX_ATTEMPTS}
          AND (${crawledPages.fetchedAt} IS NULL OR ${crawledPages.fetchedAt} < now() - make_interval(secs => ${CRAWL_FAILED_COOLDOWN_SECONDS}))))`
    )
    .orderBy(sql`${crawledPages.id} asc`)
    .limit(1);

  if (!page) {
    return { ok: true, done: true, message: "انتهى طابور القراءة الحالي" };
  }

  // احجز الصفحة وسجّل المحاولة قبل الجلب لتفادي القراءات المتكررة المتزامنة
  await db
    .update(crawledPages)
    .set({ status: "reading", crawlAttempts: page.crawlAttempts + 1, fetchedAt: now })
    .where(eq(crawledPages.id, page.id));

  try {
    const response = await fetch(page.url, {
      signal: AbortSignal.timeout(12_000),
      headers: {
        "User-Agent": "LuauMind-learner/1.0 (educational reader)",
        "Accept-Language": "en",
      },
    });
    if (!response.ok) throw new Error("HTTP " + response.status);

    const html = await response.text();
    const { title, text } = extractReadableText(html);

    if (text.length < 200) throw new Error("نص غير كافٍ");

    const content = text.slice(0, 24000);
    const tokens = countTokens(content);

    await db
      .update(crawledPages)
      .set({
        status: "done",
        title,
        content,
        tokens,
        fetchedAt: new Date(),
        searchText: buildSearchText(title, content, page.tags),
      })
      .where(eq(crawledPages.id, page.id));

    return { ok: true, done: false, title, origin: page.origin, tokens, pageId: page.id };
  } catch (error) {
    await db
      .update(crawledPages)
      .set({ status: "failed", fetchedAt: new Date() })
      .where(eq(crawledPages.id, page.id));
    return { ok: false, done: false, failedUrl: page.url, error: String(error), pageId: page.id };
  }
}