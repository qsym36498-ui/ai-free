import { NextResponse } from "next/server";
import { CORPUS_TEXT } from "@/lib/luau/corpus";
import { fetchKnowledgeBooks, fetchLanguageBooks } from "@/lib/luau/langbooks";

export const dynamic = "force-dynamic";

/**
 * مادة التدريب: قاعدة المعرفة + كتب اللغات التي أضافها اللاعبون.
 * يعالجها جهاز الزائر محلياً (تقطيع + تجزئة + إحصاء تكرارات)
 * ويتبرع بالنتيجة — فتتدرب الأجهزة على اللغات الجديدة أيضاً.
 */
export async function GET() {
  const [books, knowledgeBooks] = await Promise.all([
    fetchLanguageBooks(),
    fetchKnowledgeBooks(),
  ]);
  const booksText = [
    ...books.map((book) => "كتاب لغة " + book.name + "\n" + book.content),
    ...knowledgeBooks.map((book) => "كتاب معرفة: " + book.name + "\n" + book.content),
  ]
    .join("\n\n")
    .slice(0, 900_000);

  return NextResponse.json({
    material: CORPUS_TEXT + "\n\n" + booksText,
    seed: 0x811c9dc5,
    version: 2,
  });
}
