/**
 * تعامل مع خطط قواعد البيانات "المقياس إلى صفر" (Neon/Supabase Serverless):
 * القاعدة تنام بعد ~5 دقائق من الخمول، وأول اتصال يوقظها (Cold Start)
 * وقد يفشل مؤقتاً أو يقطع اتصالات خاملة. هنا دوال الإيقاظ وإعادة المحاولة.
 *
 * وحدة نقيّة بلا أي اعتماد على pg/البيئة — تُختبر مباشرة.
 */

/** واجهة مبسطة لما يكفي من pool لعملياتنا هنا */
export interface Queryable {
  query(sql: string): Promise<unknown>;
}

/** أخطاء مؤقتة (اتصال/نوم/إعادة تشغيل) تستحق إعادة المحاولة — غيرها يرمى فوراً */
const TRANSIENT =
  /ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|EPIPE|08P01|57P01|connection|terminat|postmaster|socket|timed ?out|timeout|closed the connection|server closed|relauth|could not|refused/i;

export function isTransientError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return TRANSIENT.test(msg);
}

/**
 * توقظ قاعدة البيانات بنقرات SELECT 1 مع تراجع تدريجي —
 * تمتص زمن الـ Cold Start قبل أي استعلام حقيقي.
 */
export async function pingPool(
  pool: Queryable,
  attempts = 6,
  baseDelayMs = 1200
): Promise<boolean> {
  for (let i = 1; i <= attempts; i++) {
    try {
      await pool.query("SELECT 1");
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[db-wake] إيقاظ قاعدة البيانات — محاولة ${i}/${attempts}: ${msg.slice(0, 140)}`);
      const delay = Math.min(baseDelayMs * i * 1.3, 8000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return false;
}

/**
 * ينفذ عملية على القاعدة ويعيد المحاولة للأخطاء العابرة فقط
 * (النوم/الاتصال/الإغلاق). الأخطاء المنطقية ترمى فوراً بلا إعادة.
 */
export async function withQueryRetry<T>(
  operation: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientError(error)) throw error;
      if (i < attempts) {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * i));
      }
    }
  }
  throw lastError;
}