import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pingPool, withQueryRetry, type Queryable } from "./wake";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

// Neon/supabase تشترط SSL — نخلي الصلابة تلقائية حسب ما يجي في الربط (sslmode=require)
const parsedDbUrl = new URL(databaseUrl);
const dbSslRequired = parsedDbUrl.searchParams.get("sslmode") === "require";
const dbIsCloud = parsedDbUrl.hostname.includes("neon.tech");
const dbSSL = dbSslRequired || dbIsCloud ? { rejectUnauthorized: false } : false;

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: dbSSL,
    // خطط Scale-to-Zero: لا تجوِّل بلا نهاية — مهلة معقولة ثم فشل واضح
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 30_000,
    query_timeout: 60_000,
    max: 5,
  });

// مهم جداً لمنصات النوم: خدمة Neon تقطع الاتصالات الخاملة عند Scale-to-Zero
// فيرمي pg خطأً على pool — بلا معالجٍ هنا تنهار العملية كلها (unhandled error).
pool.on("error", (err) => {
  console.error("[pg-pool] أُنهي اتصال خامل من السيرفر (دوّام/نوم؟):", err?.message ?? err);
});

// كل دقيقة نتأكد من سلامة اتصال الخامل — يمنع اتصالاً ميتاً يعلق الطلبات
const health = setInterval(() => {
  void pool.query("SELECT 1").catch(() => {});
}, 60_000);
if (typeof health.unref === "function") health.unref();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);

/** توقظ قاعدة السحاب النائمة قبل أي عمل حقيقي */
export function pingDatabase(attempts = 6): Promise<boolean> {
  return pingPool(pool as Queryable, attempts);
}

/** ينفذ عملية ذات قاعدة مع إعادة محاولة على أخطاء النوم/الاتصال */
export { withQueryRetry };