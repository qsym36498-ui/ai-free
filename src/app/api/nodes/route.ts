import { count, desc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { trainingNodes } from "@/db/schema";
import { enforceRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/** لوحة شبكة التدريب الموزعة: عدد العقد وحجم المعالجة وأقوى العقد */
export async function GET() {
  try {
    const [summary] = await db
      .select({
        nodes: count(),
        networkTokens: sql<number>`coalesce(sum(${trainingNodes.totalTokens}), 0)::bigint`,
        sessions: sql<number>`coalesce(sum(${trainingNodes.sessions}), 0)::int`,
      })
      .from(trainingNodes);

    const top = await db
      .select({
        alias: trainingNodes.alias,
        totalTokens: trainingNodes.totalTokens,
        sessions: trainingNodes.sessions,
        lastSeen: trainingNodes.lastSeen,
      })
      .from(trainingNodes)
      .orderBy(desc(trainingNodes.totalTokens))
      .limit(8);

    return NextResponse.json({
      nodes: summary?.nodes ?? 0,
      networkTokens: Number(summary?.networkTokens ?? 0),
      sessions: Number(summary?.sessions ?? 0),
      top,
    });
  } catch (error) {
    console.error("nodes GET error", error);
    return NextResponse.json({ nodes: 0, networkTokens: 0, sessions: 0, top: [] });
  }
}

/** انضمام جهاز جديد كعقدة تدريب (أو تحديث اسمها) */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "nodes", 5, 60_000);
  if (limited) return limited;

  try {
    const body = (await request.json()) as { deviceId?: unknown; alias?: unknown };
    const deviceId =
      typeof body.deviceId === "string" && body.deviceId.length >= 8 ? body.deviceId.slice(0, 64) : "";
    const alias = typeof body.alias === "string" && body.alias.trim().length > 0 ? body.alias.trim().slice(0, 30) : "عقدة تدريب";

    if (!deviceId) {
      return NextResponse.json({ ok: false, error: "معرف الجهاز مطلوب." }, { status: 400 });
    }

    await db
      .insert(trainingNodes)
      .values({ deviceId, alias })
      .onConflictDoUpdate({
        target: trainingNodes.deviceId,
        set: { alias, lastSeen: new Date() },
      });

    return NextResponse.json({ ok: true, alias });
  } catch (error) {
    console.error("nodes POST error", error);
    return NextResponse.json({ ok: false, error: "تعذر الانضمام للشبكة." }, { status: 500 });
  }
}
