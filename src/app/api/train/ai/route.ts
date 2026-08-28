import { NextResponse } from "next/server";
import { qwenAvailable } from "@/lib/qwen";
import { runAITraining, trainingStatus } from "@/lib/luau/aitraining";
import {
  autoTrainerStatus,
  autoTrainerScopeCount,
  startAutoTrainer,
} from "@/lib/luau/autoTrainer";
import { enforceRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/** الحالة الحالية للتدريب عبر Qwen — وأيضاً يفعّل المدرّب التلقائي إن لم يكن يعمل */
export async function GET() {
  try {
    startAutoTrainer();
    const [status, scope, auto] = await Promise.all([
      trainingStatus(),
      autoTrainerScopeCount(),
      Promise.resolve(autoTrainerStatus()),
    ]);
    return NextResponse.json({
      ok: true,
      enabled: qwenAvailable(),
      ...status,
      ...auto,
      curriculum: scope.curriculum,
    });
  } catch (error) {
    console.error("train/ai GET error", error);
    return NextResponse.json({ ok: false, error: "تعذر قراءة حالة التدريب." }, { status: 500 });
  }
}

/** تشغيل جلسة تدريب: batch مواضيع أو topic محدد */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "train-ai", 5, 60_000);
  if (limited) return limited;

  if (!qwenAvailable()) {
    return NextResponse.json(
      { ok: false, error: "Qwen غير مفعّل — عطّل QWEN_ENABLED والمفتاح في .env.local." },
      { status: 409 }
    );
  }

  try {
    const body = (await request.json()) as { batch?: unknown; topic?: unknown };
    const batch =
      typeof body.batch === "number" && Number.isFinite(body.batch)
        ? Math.max(1, Math.min(Math.floor(body.batch), 10))
        : 3;
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";

    const result = await runAITraining(batch, topic || undefined);
    const auto = autoTrainerStatus();
    return NextResponse.json({ ok: true, ...result, complete: auto.complete, phase: auto.phase });
  } catch (error) {
    console.error("train/ai POST error", error);
    return NextResponse.json({ ok: false, error: "تعذر إتمام جلسة التدريب." }, { status: 500 });
  }
}