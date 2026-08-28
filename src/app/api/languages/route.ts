import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { languageBooks } from "@/db/schema";
import { bookTokens } from "@/lib/luau/langbooks";
import { enforceRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_CONTENT = 600_000; // حرفاً — كتب ضخمة مرحب بها

/** قائمة اللغات المضافة */
export async function GET() {
  try {
    const rows = await db.select().from(languageBooks).orderBy(desc(languageBooks.createdAt));
    return NextResponse.json({
      languages: rows.map((row) => ({
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
    console.error("languages GET error", error);
    return NextResponse.json({ languages: [] });
  }
}

/**
 * إضافة لغة برمجة: النص يُستخرج على جهاز اللاعب (PDF أو ملف نصي)
 * ويصل هنا نصاً نظيفاً — السيرفر يحفظ ويفهرس فقط.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "languages", 3, 300_000);
  if (limited) return limited;

  try {
    const body = (await request.json()) as {
      name?: unknown;
      description?: unknown;
      tags?: unknown;
      authorName?: unknown;
      content?: unknown;
    };

    const name = (typeof body.name === "string" ? body.name : "").trim().slice(0, 60);
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 400) : "";
    const tags = typeof body.tags === "string" ? body.tags.trim().slice(0, 300) : "";
    const authorName = typeof body.authorName === "string" ? body.authorName.trim().slice(0, 40) : "";
    let content = typeof body.content === "string" ? body.content.trim().replace(/\s{3,}/g, "  ") : "";

    if (name.length < 2) {
      return NextResponse.json({ ok: false, error: "اكتب اسم اللغة (مثلاً: بايثون)." }, { status: 400 });
    }
    if (content.length < 200) {
      return NextResponse.json(
        { ok: false, error: "المحتوى قصير جداً — أضف الشرح كاملاً (200 حرف على الأقل)." },
        { status: 400 }
      );
    }
    if (content.length > MAX_CONTENT) {
      content = content.slice(0, MAX_CONTENT);
    }

    const tokens = bookTokens(content);

    const inserted = await db
      .insert(languageBooks)
      .values({ name, description, tags, authorName: authorName || "زائر", content, tokens })
      .returning({ id: languageBooks.id, name: languageBooks.name, tokens: languageBooks.tokens });

    return NextResponse.json({
      ok: true,
      language: inserted[0],
      message:
        "أُضيفت لغة " +
        name +
        " (" +
        tokens.toLocaleString("en") +
        " توكن) — النموذج يفهرسها الآن وأجهزة اللاعبين ستتدرب عليها.",
    });
  } catch (error) {
    console.error("languages POST error", error);
    return NextResponse.json({ ok: false, error: "تعذر الحفظ — حاول مرة أخرى." }, { status: 500 });
  }
}
