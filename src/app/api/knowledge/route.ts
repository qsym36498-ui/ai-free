import { and, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { knowledgeEntries, knowledgeVotes } from "@/db/schema";
import { buildSearchText } from "@/lib/luau/text";
import { enforceRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/** أحدث المعارف التي علمها اللاعبون للنموذج — مع صوت الجهاز الحالي إن أرسل معرفه */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 30), 100);
    const deviceId = url.searchParams.get("device") ?? "";

    const rows = await db
      .select()
      .from(knowledgeEntries)
      .orderBy(desc(knowledgeEntries.createdAt))
      .limit(limit);

    let myVotes = new Map<number, string>();
    if (deviceId.length >= 8 && rows.length > 0) {
      const votes = await db
        .select({ entryId: knowledgeVotes.entryId, vote: knowledgeVotes.vote })
        .from(knowledgeVotes)
        .where(
          and(
            eq(knowledgeVotes.deviceId, deviceId),
            inArray(knowledgeVotes.entryId, rows.map((r) => r.id))
          )
        );
      myVotes = new Map(votes.map((v) => [v.entryId, v.vote]));
    }

    const entries = rows.map((row) => ({
      ...row,
      myVote: myVotes.get(row.id) ?? null,
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("knowledge GET error", error);
    return NextResponse.json({ entries: [] });
  }
}

/** إضافة معرفة جديدة — تدخل فوراً في فهرس بحث النموذج */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "knowledge", 10, 60_000);
  if (limited) return limited;

  try {
    const body = (await request.json()) as {
      title?: unknown;
      content?: unknown;
      code?: unknown;
      tags?: unknown;
      sourceUrl?: unknown;
      sourceType?: unknown;
      authorName?: unknown;
    };

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const tags = typeof body.tags === "string" ? body.tags.trim() : "";
    const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim().slice(0, 500) : "";
    const authorName = typeof body.authorName === "string" ? body.authorName.trim().slice(0, 40) : "";
    const sourceTypeRaw = typeof body.sourceType === "string" ? body.sourceType : "";
    const sourceType = ["كتاب", "موقع", "فيديو", "تجربة"].includes(sourceTypeRaw) ? sourceTypeRaw : "موقع";

    if (title.length < 4) {
      return NextResponse.json({ ok: false, error: "العنوان قصير جداً — اكتب 4 أحرف على الأقل." }, { status: 400 });
    }
    if (content.length < 20) {
      return NextResponse.json({ ok: false, error: "الشرح قصير جداً — اكتب 20 حرفاً على الأقل حتى يتعلم النموذج شيئاً مفيداً." }, { status: 400 });
    }

    const inserted = await db
      .insert(knowledgeEntries)
      .values({
        title: title.slice(0, 200),
        content: content.slice(0, 6000),
        code: code ? code.slice(0, 8000) : null,
        tags: tags.slice(0, 400),
        sourceUrl: sourceUrl || null,
        sourceType,
        authorName: authorName || "زائر",
        searchText: buildSearchText(title, content, code, tags),
      })
      .returning();

    return NextResponse.json({ ok: true, entry: inserted[0] });
  } catch (error) {
    console.error("knowledge POST error", error);
    return NextResponse.json({ ok: false, error: "تعذر الحفظ — حاول مرة أخرى." }, { status: 500 });
  }
}
