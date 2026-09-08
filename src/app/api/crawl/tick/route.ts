import { NextResponse } from "next/server";
import { crawlNextPage } from "@/lib/luau/crawler-runner";
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
    const result = await crawlNextPage();
    return NextResponse.json(result);
  } catch (error) {
    console.error("crawl tick error", error);
    return NextResponse.json({ ok: false, done: false, error: String(error) }, { status: 500 });
  }
}