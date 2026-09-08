import { LuauSearchIndex, buildSearchIndex, SearchDoc } from "@/lib/luau/search";

const sampleDocs: SearchDoc[] = [
  {
    id: "doc1",
    source: "builtin",
    title: "المتغيرات في لواو",
    tags: ["لواو", "متغيرات", "مبتدئ"],
    paragraphs: ["المتغيرات هي حاويات لتخزين القيم. تُعرَّف بـ local في لواو."],
    code: 'local x = 10\nprint(x)',
    level: "مبتدئ",
  },
  {
    id: "doc2",
    source: "builtin",
    title: "الدوال في لواو",
    tags: ["لواو", "دوال", "متوسط"],
    paragraphs: ["الدوال تسمح بتنظيم الكود وإعادة الاستخدام. تُعرَّف بـ function."],
    code: 'local function greet(name)\n  return "Hello " .. name\nend',
    level: "متوسط",
  },
  {
    id: "doc3",
    source: "user",
    title: "نظام نقاط في روبلوكس",
    tags: ["روبلوكس", "نقاط", "نظام"],
    paragraphs: ["نظام نقاط للعبة روبلوكس. يستخدم leaderstats لعرض النقاط."],
    code: 'local points = Instance.new("IntValue")\npoints.Name = "Points"',
    level: "متوسط",
  },
  {
    id: "doc4",
    source: "builtin",
    title: "الجداول في لواو",
    tags: ["لواو", "جداول", "مصفوفات", "قواميس"],
    paragraphs: ["الجداول هي هياكل بيانات أساسية في لواو. تشمل المصفوفات والقواميس."],
    level: "مبتدئ",
  },
];

describe("LuauSearchIndex", () => {
  let index: LuauSearchIndex;

  beforeEach(() => {
    index = new LuauSearchIndex(sampleDocs);
  });

  it("builds index without errors", () => {
    expect(index).toBeDefined();
  });

  it("finds relevant docs for Arabic query", () => {
    const results = index.search("متغيرات لواو");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].doc.id).toBe("doc1");
  });

  it("finds docs by tags", () => {
    const results = index.search("روبلوكس");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.doc.id === "doc3")).toBe(true);
  });

  it("ranks exact title matches higher", () => {
    const results = index.search("الدوال في لواو");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].doc.id).toBe("doc2");
  });

  it("returns empty for no-match query", () => {
    const results = index.search("فلاسفونigeria");
    expect(results).toEqual([]);
  });

  it("respects limit parameter", () => {
    const results = index.search("لواو", 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("scores are positive and sorted descending", () => {
    const results = index.search("لواو");
    for (const r of results) {
      expect(r.score).toBeGreaterThan(0);
    }
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("handles empty index", () => {
    const emptyIndex = new LuauSearchIndex([]);
    const results = emptyIndex.search("أي شيء");
    expect(results).toEqual([]);
  });

  it("handles queries with stopwords", () => {
    const results = index.search("كيف اسوي متغيرات في لواو");
    expect(results.length).toBeGreaterThan(0);
  });

  it("finds code-related docs", () => {
    const results = index.search("local function");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.doc.code?.includes("function"))).toBe(true);
  });
});

describe("buildSearchIndex", () => {
  it("returns LuauSearchIndex instance", () => {
    const idx = buildSearchIndex(sampleDocs);
    expect(idx).toBeInstanceOf(LuauSearchIndex);
  });
});
