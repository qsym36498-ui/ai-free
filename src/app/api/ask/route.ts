import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/luau/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: unknown; offline?: unknown };
    const question = typeof body.question === "string" ? body.question.slice(0, 600) : "";
    const answer = await answerQuestion(question, { offline: body.offline === true });
    return NextResponse.json(answer);
  } catch (error) {
    console.error("ask error", error);
    return NextResponse.json(
      {
        kind: "fallback",
        intro: "حدث خطأ مؤقت في المعالجة — أعد المحاولة.",
        sections: [],
        tips: [],
        sources: [],
        followUps: [],
      },
      { status: 200 }
    );
  }
}
