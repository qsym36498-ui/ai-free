/**
 * خطوة زحف واحدة من سطر الأوامر — مثل train-cron لكن للقراءة من الإنترنت:
 * إيقاظ قاعدة Neon النائمة، إضافة الروابط الجديدة، ثم قراءة صفحة واحدة.
 *
 * التشغيل: npx tsx scripts/crawl-once.ts
 */
import { pingDatabase } from "@/db";
import { crawlNextPage, seedCrawlQueue } from "@/lib/luau/crawler-runner";

async function main(): Promise<void> {
  await pingDatabase();
  const added = await seedCrawlQueue();
  const startedAt = Date.now();
  const result = await crawlNextPage();
  const ms = Date.now() - startedAt;
  console.log("CRAWL_RESULT " + JSON.stringify(result));
  console.log("CRAWL_SEEDED " + added);
  console.log("CRAWL_MS " + ms);
  process.exit(result.ok ? 0 : 1);
}

main().catch((error) => {
  console.error("CRAWL_ERROR", error);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED", err);
  process.exit(1);
});