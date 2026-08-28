import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { trainingContributions, trainingNodes } from "@/db/schema";
import { enforceRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/** استقبال مساهمة تدريب من جهاز الزائر + تحديث عقدته إن كان عضواً في الشبكة */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "train", 20, 60_000);
  if (limited) return limited;

  try {
    const body = (await request.json()) as {
      deviceId?: unknown;
      mode?: unknown;
      tokensProcessed?: unknown;
      checksum?: unknown;
      durationMs?: unknown;
    };

    const deviceId =
      typeof body.deviceId === "string" && body.deviceId.length >= 8 ? body.deviceId.slice(0, 64) : "unknown";
    const mode = body.mode === "auto" ? "auto" : "manual";
    const tokensProcessed =
      typeof body.tokensProcessed === "number" && Number.isFinite(body.tokensProcessed)
        ? Math.max(0, Math.min(Math.floor(body.tokensProcessed), 2_000_000))
        : 0;
    const checksum = typeof body.checksum === "string" ? body.checksum.slice(0, 32) : "";
    const durationMs =
      typeof body.durationMs === "number" && Number.isFinite(body.durationMs)
        ? Math.max(0, Math.min(Math.floor(body.durationMs), 10 * 60_000))
        : 0;

    if (tokensProcessed === 0) {
      return NextResponse.json({ ok: false, error: "لا توجد معالجة مسجلة." }, { status: 400 });
    }

    await db.insert(trainingContributions).values({
      deviceId,
      mode,
      tokensProcessed,
      checksum,
      durationMs,
    });

    // إن كان الجهاز عقدة في الشبكة، حدّث عداداتها
    if (deviceId !== "unknown") {
      try {
        await db
          .update(trainingNodes)
          .set({
            totalTokens: sql`${trainingNodes.totalTokens} + ${tokensProcessed}`,
            sessions: sql`${trainingNodes.sessions} + 1`,
            lastSeen: new Date(),
          })
          .where(eq(trainingNodes.deviceId, deviceId));
      } catch {
        /* الجهاز غير مسجل كعقدة — لا مشكلة */
      }
    }

    return NextResponse.json({ ok: true, tokensProcessed });
  } catch (error) {
    console.error("train POST error", error);
    return NextResponse.json({ ok: false, error: "تعذر تسجيل المساهمة." }, { status: 500 });
  }
}
