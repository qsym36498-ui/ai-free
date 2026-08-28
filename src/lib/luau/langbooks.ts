import { db } from "@/db";
import { knowledgeBooks, languageBooks } from "@/db/schema";
import type { SearchDoc } from "./search";
import { countTokens } from "./crawler";

export interface AnyBookRow {
  id: number;
  name: string;
  description: string;
  tags: string;
  content: string;
  tokens: number;
  authorName: string;
  createdAt: Date;
}

export type LanguageBookRow = AnyBookRow;

export async function fetchLanguageBooks(): Promise<AnyBookRow[]> {
  try {
    return await db.select().from(languageBooks);
  } catch {
    return [];
  }
}

export async function fetchKnowledgeBooks(): Promise<AnyBookRow[]> {
  try {
    return await db.select().from(knowledgeBooks);
  } catch {
    return [];
  }
}

const MAX_CHUNKS_PER_BOOK = 400;
const CHUNK_SIZE = 1200;

/** تقطيع كتاب ضخم إلى وثائق قابلة للبحث */
export function bookToSearchDocs(book: AnyBookRow, prefix: string): SearchDoc[] {
  const docs: SearchDoc[] = [];
  const lines = book.content.split(/\n+/);
  let current = "";
  let chunkIndex = 0;
  const baseTags = [book.name, ...book.tags.split(",").map((t) => t.trim()).filter(Boolean)];

  const push = () => {
    if (current.trim().length < 40) return;
    if (docs.length >= MAX_CHUNKS_PER_BOOK) return;
    docs.push({
      id: `${prefix}-${book.id}-${chunkIndex}`,
      source: "book",
      title: book.name + " — الجزء " + (chunkIndex + 1),
      tags: baseTags,
      paragraphs: [current.trim()],
      authorName: book.authorName,
      bookName: book.name,
    });
    chunkIndex++;
    current = "";
  };

  for (const rawLine of lines) {
    let line = rawLine;
    // نصوص PDF كثيراً ما تجي بسطر واحد ضخم بلا أسطر جديدة —
    // نقسمه بالطول حتى ما يصير الكتاب كله مقطع واحد عملاق يخرب ترتيب البحث
    while (line.length > CHUNK_SIZE) {
      current = (current.trim() + " " + line.slice(0, CHUNK_SIZE)).trim();
      push();
      current = "";
      line = line.slice(CHUNK_SIZE);
      if (docs.length >= MAX_CHUNKS_PER_BOOK) return docs;
    }
    if ((current + line).length > CHUNK_SIZE) push();
    current += line + "\n";
  }
  push();
  return docs;
}

export function bookTokens(content: string): number {
  return countTokens(content);
}
