/**
 * إعداد بحث Postgres النصي (FTS): ينشئ فهرسي GIN تعبيريين على `search_text`
 * لجدولي knowledge_entries و crawled_pages، ثم يعبّئ `search_text` رجعياً للصفوف
 * القديمة التي أُدخلت قبل إضافة العمود.
 *
 * عديم-التأثير وقابل لإعادة التشغيل: الفهارس بـ IF NOT EXISTS، والتعبئة تلمس فقط
 * الصفوف الفارغة (search_text = '') وتتقدّم بترقيم مفتاحي (id) فلا تعلق أبداً.
 *
 * التشغيل (يشغّله المستخدم على قاعدته — الأسرار غير متوفرة هنا):
 *   npx tsx scripts/setup-fts.ts
 *
 * أعد تشغيله بعد أي `npm run db:push` (فهو --force وقد يُسقط فهرساً لا يعرفه drizzle).
 */
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// وحدة نصوص خالصة (بلا اعتماد على قاعدة البيانات) — آمنة كاستيراد ثابت.
import { buildSearchText } from "@/lib/luau/text";

interface KnowledgeBackfillRow {
  id: number;
  title: string;
  content: string;
  code: string | null;
  tags: string;
}

interface CrawledBackfillRow {
  id: number;
  title: string;
  content: string;
  tags: string;
}

const BATCH = 500;

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error("SETUP_FTS_ERROR: DATABASE_URL غير موجود — ضعه في .env.local أو في بيئة التشغيل.");
    process.exit(1);
  }

  // استيراد ديناميكي بعد تحميل dotenv: وحدة @/db ترمي عند التقييم إن غاب DATABASE_URL.
  const { pool } = await import("@/db");

  // 1) فهرسا GIN التعبيريان — to_tsvector بصيغة الوسيطين (config ثابت) IMMUTABLE فتُقبل بالفهرس.
  await pool.query(
    `CREATE INDEX IF NOT EXISTS knowledge_entries_tsv_idx
       ON knowledge_entries USING gin (to_tsvector('simple', coalesce(search_text, '')))`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS crawled_pages_tsv_idx
       ON crawled_pages USING gin (to_tsvector('simple', coalesce(search_text, '')))`
  );
  console.log("FTS: فهرسا GIN جاهزان (knowledge_entries, crawled_pages)");

  // 2) تعبئة رجعية على دفعات بترقيم مفتاحي — يتقدّم دائماً ولو نتج نص فارغ لبعض الصفوف.
  let knowledgeUpdated = 0;
  let lastId = 0;
  for (;;) {
    const { rows } = await pool.query<KnowledgeBackfillRow>(
      `SELECT id, title, content, code, tags
         FROM knowledge_entries
        WHERE search_text = '' AND id > $1
        ORDER BY id
        LIMIT ${BATCH}`,
      [lastId]
    );
    if (rows.length === 0) break;
    for (const row of rows) {
      const searchText = buildSearchText(row.title, row.content, row.code, row.tags);
      await pool.query(`UPDATE knowledge_entries SET search_text = $1 WHERE id = $2`, [searchText, row.id]);
      lastId = row.id;
    }
    knowledgeUpdated += rows.length;
    console.log(`FTS backfill knowledge_entries: ${knowledgeUpdated}`);
  }

  let crawledUpdated = 0;
  lastId = 0;
  for (;;) {
    const { rows } = await pool.query<CrawledBackfillRow>(
      `SELECT id, title, content, tags
         FROM crawled_pages
        WHERE search_text = '' AND id > $1
        ORDER BY id
        LIMIT ${BATCH}`,
      [lastId]
    );
    if (rows.length === 0) break;
    for (const row of rows) {
      const searchText = buildSearchText(row.title, row.content, row.tags);
      await pool.query(`UPDATE crawled_pages SET search_text = $1 WHERE id = $2`, [searchText, row.id]);
      lastId = row.id;
    }
    crawledUpdated += rows.length;
    console.log(`FTS backfill crawled_pages: ${crawledUpdated}`);
  }

  console.log("SETUP_FTS_DONE " + JSON.stringify({ knowledgeUpdated, crawledUpdated }));
  await pool.end();
  process.exit(0);
}

main().catch((error) => {
  console.error("SETUP_FTS_ERROR", error);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED", err);
  process.exit(1);
});
