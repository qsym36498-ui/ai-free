import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { knowledgeBooks } from "@/db/schema";
import { bookTokens } from "@/lib/luau/langbooks";
import { enforceRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_CONTENT = 600_000;

/** قائمة كتب المعارف المضافة */
export async function GET() {
  try {
    const rows = await db.select().from(knowledgeBooks).orderBy(desc(knowledgeBooks.createdAt));
    return NextResponse.json({
      books: rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        tokens: row.tokens,
        authorName: row.authorName,
        createdAt: row.createdAt,
        chars: row.content.length,
      })),
    });
  } catch (error) {
    console.error("books GET error", error);
    return NextResponse.json({ books: [] });
  }
}

/**
 * إضافة أي كتاب معرفة: النص يُستخرج على جهاز اللاعب ويصل نصاً نظيفاً —
 * السيرفر يحفظ ويفهرس فقط.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "books", 3, 300_000);
  if (limited) return limited;

  try {
    const body = (await request.json()) as {
      name?: unknown;
      description?: unknown;
      tags?: unknown;
      authorName?: unknown;
      content?: unknown;
    };

    const name = (typeof body.name === "string" ? body.name : "").trim().slice(0, 80);
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 400) : "";
    const tags = typeof body.tags === "string" ? body.tags.trim().slice(0, 300) : "";
    const authorName = typeof body.authorName === "string" ? body.authorName.trim().slice(0, 40) : "";
    let content = typeof body.content === "string" ? body.content.trim().replace(/\s{3,}/g, "  ") : "";

    if (name.length < 2) {
      return NextResponse.json({ ok: false, error: "اكتب اسم الكتاب أو الموضوع." }, { status: 400 });
    }
    if (content.length < 200) {
      return NextResponse.json(
        { ok: false, error: "المحتوى قصير جداً — أضف الكتاب أو المعلومة كاملة (200 حرف على الأقل)." },
        { status: 400 }
      );
    }
    if (content.length > MAX_CONTENT) {
      content = content.slice(0, MAX_CONTENT);
    }

    const tokens = bookTokens(content);

    const inserted = await db
      .insert(knowledgeBooks)
      .values({ name, description, tags, authorName: authorName || "زائر", content, tokens })
      .returning({ id: knowledgeBooks.id, name: knowledgeBooks.name, tokens: knowledgeBooks.tokens });

    return NextResponse.json({
      ok: true,
      book: inserted[0],
      message:
        "أُضيف كتاب \"" +
        name +
        "\" (" +
        tokens.toLocaleString("en") +
        " توكن) — دخل فهرس النموذج وأجهزة اللاعبين تتدرب عليه الآن.",
    });
  } catch (error) {
    console.error("books POST error", error);
    return NextResponse.json({ ok: false, error: "تعذر الحفظ — حاول مرة أخرى." }, { status: 500 });
  }
}
