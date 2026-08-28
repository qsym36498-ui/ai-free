/**
 * حد بسيط للطلبات داخل الذاكرة — يمنع إغراق نقاط الكتابة
 * (إضافة معرفة، كتب، تصويت، مساهمات) من جهاز واحد.
 * ملاحظة: الذاكرة محلية لكل نسخة من الخادم، وهذا كافٍ للحجم الحالي.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 20_000;

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "local";
}

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
  if (buckets.size > MAX_BUCKETS) buckets.clear();
}

/** يرجع null إذا الطلب مسموح، أو ردّ 429 جاهز إذا تجاوز الحد */
export function enforceRateLimit(
  request: Request,
  name: string,
  limit: number,
  windowMs: number
): Response | null {
  const now = Date.now();
  const key = name + "|" + clientKey(request);
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 1000) prune(now);
    return null;
  }

  bucket.count += 1;
  if (bucket.count <= limit) return null;

  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return Response.json(
    {
      ok: false,
      error: "طلبات كثيرة بوقت قصير. جرّب مرة ثانية بعد " + retryAfter + " ثانية.",
    },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
