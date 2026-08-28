import { and, count, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { knowledgeEntries, knowledgeVotes } from "@/db/schema";
import { enforceRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * تصويت لاعب على معلومة: تأكيد أو اعتراض أو إزالة صوت.
 * صوت واحد لكل جهاز على كل معلومة، وإعادة حساب التوثيق تلقائياً.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "vote", 30, 60_000);
  if (limited) return limited;

  try {
    const body = (await request.json()) as {
      entryId?: unknown;
      deviceId?: unknown;
      vote?: unknown;
    };

    const entryId = typeof body.entryId === "number" ? body.entryId : -1;
    const deviceId =
      typeof body.deviceId === "string" && body.deviceId.length >= 8 ? body.deviceId.slice(0, 64) : "";
    const vote = body.vote === "confirm" || body.vote === "dispute" || body.vote === "remove" ? body.vote : "";

    if (entryId < 0 || !deviceId || !vote) {
      return NextResponse.json({ ok: false, error: "طلب غير صالح." }, { status: 400 });
    }

    const existing = await db
      .select({ id: knowledgeEntries.id })
      .from(knowledgeEntries)
      .where(eq(knowledgeEntries.id, entryId))
      .limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ ok: false, error: "المعلومة غير موجودة." }, { status: 404 });
    }

    await db.transaction(async (tx) => {
      // استبدل صوت هذا الجهاز على هذه المعلومة
      await tx
        .delete(knowledgeVotes)
        .where(and(eq(knowledgeVotes.entryId, entryId), eq(knowledgeVotes.deviceId, deviceId)));

      if (vote !== "remove") {
        await tx.insert(knowledgeVotes).values({ entryId, deviceId, vote });
      }

      // إعادة حساب العدّادات
      const tally = await tx
        .select({ vote: knowledgeVotes.vote, n: count() })
        .from(knowledgeVotes)
        .where(eq(knowledgeVotes.entryId, entryId))
        .groupBy(knowledgeVotes.vote);

      let confirmCount = 0;
      let disputeCount = 0;
      for (const row of tally) {
        if (row.vote === "confirm") confirmCount = row.n;
        if (row.vote === "dispute") disputeCount = row.n;
      }

      // التوثيق: تأييدان على الأقل وأكثر من الاعتراضات
      const verified = confirmCount >= 2 && confirmCount > disputeCount;

      await tx
        .update(knowledgeEntries)
        .set({ confirmCount, disputeCount, verified })
        .where(eq(knowledgeEntries.id, entryId));

      void sql`select 1`; // إبقاء استيراد sql مستخدماً
    });

    const updated = await db
      .select()
      .from(knowledgeEntries)
      .where(eq(knowledgeEntries.id, entryId))
      .limit(1);

    return NextResponse.json({
      ok: true,
      confirmCount: updated[0]?.confirmCount ?? 0,
      disputeCount: updated[0]?.disputeCount ?? 0,
      verified: updated[0]?.verified ?? false,
    });
  } catch (error) {
    console.error("vote error", error);
    return NextResponse.json({ ok: false, error: "تعذر تسجيل الصوت." }, { status: 500 });
  }
}
