/**
 * محرك بحث يدوي بالكامل — تنفيذ BM25 مكتوب من الصفر.
 * يفهرس الدروس المدمجة + المعرفة التي أضافها اللاعبون.
 */
import { codeTokens, contentTokens, expandWithStems, tokenize } from "./text";

export interface SearchDoc {
  id: string;
  source: "builtin" | "user" | "crawled" | "book";
  title: string;
  level?: string;
  tags: string[];
  paragraphs: string[];
  code?: string;
  authorName?: string;
  sourceUrl?: string;
  sourceType?: string;
  verified?: boolean;
  confirmCount?: number;
  disputeCount?: number;
  bookName?: string;
}

export interface ScoredDoc {
  doc: SearchDoc;
  score: number;
}

interface IndexedDoc {
  doc: SearchDoc;
  titleTokens: string[];
  tagTokens: string[];
  bodyTokens: string[];
  codeTokens: string[];
  length: number;
}

const K1 = 1.6;
const B = 0.72;
const TITLE_WEIGHT = 3.2;
const TAG_WEIGHT = 2.4;
const CODE_WEIGHT = 1.35;

export class LuauSearchIndex {
  private docs: IndexedDoc[] = [];
  private df = new Map<string, number>();
  private avgLength = 1;

  constructor(docs: SearchDoc[]) {
    this.docs = docs.map((doc) => {
      const titleTokens = contentTokens(doc.title);
      const tagTokens = contentTokens(doc.tags.join(" "));
      const bodyTokens = contentTokens(doc.paragraphs.join(" "));
      const codeToks = doc.code ? codeTokens(doc.code) : [];
      const length =
        titleTokens.length * TITLE_WEIGHT +
        tagTokens.length * TAG_WEIGHT +
        bodyTokens.length +
        codeToks.length * CODE_WEIGHT;
      return { doc, titleTokens, tagTokens, bodyTokens, codeTokens: codeToks, length };
    });

    const total = new Set<string>();
    for (const d of this.docs) {
      for (const t of d.titleTokens) total.add(t);
      for (const t of d.tagTokens) total.add(t);
      for (const t of d.bodyTokens) total.add(t);
      for (const t of d.codeTokens) total.add(t);
    }
    this.avgLength =
      this.docs.length > 0
        ? this.docs.reduce((sum, d) => sum + d.length, 0) / this.docs.length
        : 1;

    // تردد الوثائق لكل توكن
    for (const d of this.docs) {
      const seen = new Set<string>([
        ...d.titleTokens,
        ...d.tagTokens,
        ...d.bodyTokens,
        ...d.codeTokens,
      ]);
      for (const token of seen) {
        this.df.set(token, (this.df.get(token) ?? 0) + 1);
      }
    }
    void total;
  }

  private idf(token: string): number {
    const n = this.docs.length;
    const docFreq = this.df.get(token) ?? 0;
    if (docFreq === 0) return 0;
    return Math.log(1 + (n - docFreq + 0.5) / (docFreq + 0.5));
  }

  private termFrequency(tokens: string[], token: string): number {
    let count = 0;
    for (const t of tokens) if (t === token) count++;
    return count;
  }

  /** بحث مع توسيع جذوع الكلمات العربية (اللاعب ↔ لاعب) */
  search(query: string, limit = 4): ScoredDoc[] {
    const baseTokens = tokenize(query).filter((t) => t.length > 1);
    const queryTokens = Array.from(new Set(expandWithStems(baseTokens)));
    if (queryTokens.length === 0) return [];

    const results: ScoredDoc[] = [];
    for (const indexed of this.docs) {
      let score = 0;
      const lengthNorm =
        1 - B + B * (indexed.length / Math.max(this.avgLength, 1));

      for (const qt of queryTokens) {
        const idf = this.idf(qt);
        if (idf === 0) continue;

        const tfTitle = this.termFrequency(indexed.titleTokens, qt);
        const tfTags = this.termFrequency(indexed.tagTokens, qt);
        const tfBody = this.termFrequency(indexed.bodyTokens, qt);
        const tfCode = this.termFrequency(indexed.codeTokens, qt);

        const weighted =
          tfTitle * TITLE_WEIGHT +
          tfTags * TAG_WEIGHT +
          tfBody +
          tfCode * CODE_WEIGHT;

        score += idf * ((weighted * (K1 + 1)) / (weighted + K1 * lengthNorm));
      }

      // مكافأة صغيرة للتطابق الحرفي في العنوان
      if (indexed.doc.title.includes(query.trim()) && query.trim().length > 3) {
        score += 2;
      }

      if (score > 0) results.push({ doc: indexed.doc, score });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }
}

export function buildSearchIndex(docs: SearchDoc[]): LuauSearchIndex {
  return new LuauSearchIndex(docs);
}
