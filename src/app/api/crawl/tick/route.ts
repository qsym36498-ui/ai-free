import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { crawledPages } from "@/db/schema";
import { countTokens, extractReadableText } from "@/lib/luau/crawler";
import { enforceRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * خطوة زحف واحدة: يقرأ السيرفر الصفحة التالية بالطابور من الإنترنت
 * ويضيف نصها لقاعدة المعرفة. يستدعيها جهاز العقدة دورياً فيتحول
 * لسيرفر يجعل النموذج يبحث ويتعلم باستمرار.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "crawltick", 15, 60_000);
  if (limited) return limited;

  try {
    const pending = await db
      .select()
      .from(crawledPages)
      .where(eq(crawledPages.status, "pending"))
      .orderBy(asc(crawledPages.id))
      .limit(1);

    if (pending.length === 0) {
      return NextResponse.json({ ok: true, done: true, message: "انتهى طابور القراءة الحالي" });
    }

    const page = pending[0];

    // احجز الصفحة لتفادي القراءات المتزامنة المكررة
    await db.update(crawledPages).set({ status: "reading" }).where(eq(crawledPages.id, page.id));

    try {
      const response = await fetch(page.url, {
        signal: AbortSignal.timeout(9000),
        headers: { "User-Agent": "LuauMind-learner/1.0 (educational reader)" },
      });
      if (!response.ok) throw new Error("HTTP " + response.status);

      const html = await response.text();
      const { title, text } = extractReadableText(html);

      if (text.length < 200) throw new Error("نص غير كافٍ");

      const content = text.slice(0, 24000);
      const tokens = countTokens(content);

      await db
        .update(crawledPages)
        .set({ status: "done", title, content, tokens, fetchedAt: new Date() })
        .where(eq(crawledPages.id, page.id));

      return NextResponse.json({
        ok: true,
        done: false,
        title,
        origin: page.origin,
        tokens,
      });
    } catch (error) {
      await db.update(crawledPages).set({ status: "failed" }).where(eq(crawledPages.id, page.id));
      return NextResponse.json({ ok: false, done: false, failed: page.url, error: String(error) });
    }
  } catch (error) {
    console.error("crawl tick error", error);
    return NextResponse.json({ ok: false, done: false, error: String(error) }, { status: 500 });
  }
}
