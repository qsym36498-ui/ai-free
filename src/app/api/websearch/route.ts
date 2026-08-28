import { NextResponse } from "next/server";
import { learnFromWeb } from "@/lib/luau/websearch";
import { enforceRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

/** بحث حر بالإنترنت: يتعلم النموذج الموضوع فوراً ثم يمكن سؤاله عنه */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "websearch", 5, 60_000);
  if (limited) return limited;

  try {
    const body = (await request.json()) as { query?: unknown };
    const query = typeof body.query === "string" ? body.query.trim().slice(0, 200) : "";

    if (query.length < 3) {
      return NextResponse.json({ ok: false, error: "اكتب موضوعاً للبحث عنه." }, { status: 400 });
    }

    const learned = await learnFromWeb(query);

    return NextResponse.json({
      ok: true,
      learnedCount: learned.length,
      learned,
      message:
        learned.length > 0
          ? "تعلمت " + learned.length + " مصدر جديد عن: " + query
          : "بحثت لكن ما لقيت مصادر جديدة كافية — جرب صياغة أوضح.",
    });
  } catch (error) {
    console.error("websearch error", error);
    return NextResponse.json({ ok: false, error: "تعذر البحث مؤقتاً." }, { status: 500 });
  }
}
