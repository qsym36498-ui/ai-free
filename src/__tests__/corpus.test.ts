/**
 * اختبارات المعرفة المدمجة — الدروس المكتوبة يدوياً في دماغ النموذج.
 * نتحقق أن كل درس سليم البنية: معرف فريد، عناوين/محتوى غير فارغ،
 * مستويات صالحة، ووسوم — حتى لا تدخل وثيقة مكسورة في فهرس البحث.
 */
import { BUILTIN_DOCS } from "@/lib/luau/corpus";
import type { KnowledgeDoc, LessonLevel } from "@/lib/luau/types";

const VALID_LEVELS: LessonLevel[] = ["مبتدئ", "متوسط", "متقدم"];

describe("BUILTIN_DOCS — المعرفة المدمجة", () => {
  it("كل معرف معرف فريد عبر جميع الدروس", () => {
    const ids = BUILTIN_DOCS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("يدخل درس جديد على الأقل في فهرس البناء (أساسيات اللغة العميقة)", () => {
    const deepIds = ["logic-truthy", "tables-references", "multireturn-varargs", "colon-self", "type-coercion", "bitwise", "ternary-if-expr", "deep-equality", "os-time", "nil-safety", "table-sort-custom", "operator-precedence", "metatable-pitfalls"];
    for (const id of deepIds) {
      expect(BUILTIN_DOCS.find((d) => d.id === id)).toBeDefined();
    }
  });

  it("كل درس له حقول إلزامية صحيحة", () => {
    for (const doc of BUILTIN_DOCS) {
      expect(typeof doc.id).toBe("string");
      expect(doc.id.length).toBeGreaterThan(0);
      expect(["lesson", "reference"]).toContain(doc.kind);
      expect(VALID_LEVELS).toContain(doc.level);
      expect(doc.title.length).toBeGreaterThan(3);
      expect(doc.summary.length).toBeGreaterThan(5);
      expect(doc.content.length).toBeGreaterThan(0);
      expect(doc.tags.length).toBeGreaterThan(0);
    }
  });

  it("محتوى كل درس ليس نقاطاً فارغة", () => {
    for (const doc of BUILTIN_DOCS) {
      for (const paragraph of doc.content) {
        expect(paragraph.trim().length).toBeGreaterThan(10);
      }
    }
  });

  it("الكود إن وُجد فهو نص غير فارغ", () => {
    for (const doc of BUILTIN_DOCS) {
      if (doc.code !== undefined) {
        expect(doc.code.trim().length).toBeGreaterThan(10);
      }
    }
  });
});