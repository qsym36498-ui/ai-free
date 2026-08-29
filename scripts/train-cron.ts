/**
 * سكربت تدريب سحابي (يشتغل على GitHub Actions بدون أي سيرفر):
 * دورة واحدة من المدرّب التلقائي ثم يطبع التقرير ويخرج.
 * المفتاح والقاعدة كلهم من متغيرات البيئة (أسرار المستودع) — لا يوجد أي ملف محلي.
 *
 * التشغيل: npx tsx scripts/train-cron.ts
 */
import { runAutoTrainCycle } from "@/lib/luau/autoTrainer";
import { qwenAvailable } from "@/lib/qwen";

async function main(): Promise<void> {
  if (!qwenAvailable()) {
    console.log("CRON_RESULT QWEN_DISABLED treated=false");
    process.exit(0);
  }

  const startedAt = Date.now();
  const batch = Math.max(1, Math.min(Number(process.env.TRAIN_BATCH) || 10, 10));
  const result = await runAutoTrainCycle(batch);
  const seconds = Math.round((Date.now() - startedAt) / 1000);

  console.log(
    "CRON_RESULT " +
      JSON.stringify({
        seconds,
        phase: result.phase,
        complete: result.complete,
        trained: result.trained.length,
        skipped: result.skipped.length,
        failed: result.failed.length,
        remaining: result.remaining,
        libraryDone: result.libraryDone,
        libraryTotal: result.libraryTotal,
        trainedTitles: result.trained.map((t) => t.title ?? t.topic),
        failedTopics: result.failed.map((f) => f.topic),
      })
  );
  process.exit(0);
}

main().catch((error) => {
  console.error("CRON_ERROR", error);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED", err);
  process.exit(1);
});