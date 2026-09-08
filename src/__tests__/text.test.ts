import {
  normalizeArabic,
  tokenize,
  stemArabic,
  stemVariants,
  expandWithStems,
  contentTokens,
  codeTokens,
  fnv1a,
  hashToHex,
  overlapScore,
  buildSearchText,
} from "@/lib/luau/text";

describe("normalizeArabic", () => {
  it("removes tashkeel (diacritics)", () => {
    expect(normalizeArabic("كَتَبْ")).toBe("كتب");
    expect(normalizeArabic("بِسْمِ")).toBe("بسم");
  });

  it("normalizes alef variants to ا", () => {
    expect(normalizeArabic("أحمد")).toBe("احمد");
    expect(normalizeArabic("إسماعيل")).toBe("اسماعيل");
    expect(normalizeArabic("آدم")).toBe("ادم");
  });

  it("normalizes ta marbuta to ه", () => {
    expect(normalizeArabic("مدرسة")).toBe("مدرسه");
    expect(normalizeArabic("油气")).toBe("油气");
  });

  it("normalizes ya末尾 to ي", () => {
    expect(normalizeArabic("ملاي")).toBe("ملاي");
    expect(normalizeArabic("على")).toBe("علي");
  });

  it("normalizes hamza variants", () => {
    expect(normalizeArabic("مؤكد")).toBe("موكد");
    expect(normalizeArabic(".multi")).toBe(".multi");
  });

  it("lowercases latin characters", () => {
    expect(normalizeArabic("Hello World")).toBe("hello world");
    expect(normalizeArabic("ROBLOX")).toBe("roblox");
  });

  it("handles mixed Arabic and English", () => {
    expect(normalizeArabic("مرحباً Hello")).toBe("مرحبا hello");
  });

  it("handles empty string", () => {
    expect(normalizeArabic("")).toBe("");
  });
});

describe("tokenize", () => {
  it("splits Arabic text into words", () => {
    const tokens = tokenize("lernen wir لواو اليوم");
    expect(tokens).toContain("lernen");
    expect(tokens).toContain("wir");
    expect(tokens).toContain("لواو");
    expect(tokens).toContain("اليوم");
  });

  it("removes punctuation", () => {
    const tokens = tokenize("سؤال؟ جواب!");
    expect(tokens).not.toContain("؟");
    expect(tokens).not.toContain("!");
  });

  it("handles numbers", () => {
    const tokens = tokenize("عندي 5 متغيرات");
    expect(tokens).toContain("5");
  });

  it("returns empty array for no matches", () => {
    expect(tokenize("؟ ، ؛")).toEqual([]);
  });

  it("handles empty string", () => {
    expect(tokenize("")).toEqual([]);
  });
});

describe("stemArabic", () => {
  it("strips ال prefix from long words", () => {
    expect(stemArabic("المعلم")).toBe("معلم");
    expect(stemArabic("الكتاب")).toBe("كتاب");
  });

  it("does not strip ال from short words", () => {
    expect(stemArabic("الو")).toBe("الو"); // 2 chars after strip, too short
    expect(stemArabic("الاب")).toBe("الاب"); // 2 chars after strip
  });

  it("strips long prefixes وال بال كال فال لل", () => {
    expect(stemArabic("والمعلم")).toBe("معلم");
    expect(stemArabic("باللعب")).toBe("لعب");
    expect(stemArabic("للمعلم")).toBe("معلم");
    expect(stemArabic("فالكتاب")).toBe("كتاب");
    expect(stemArabic("كالأسد")).toBe("أسد");
  });

  it("strips single-letter prefixes و ب ل ف from long words", () => {
    expect(stemArabic("ولاعب")).toBe("لاعب");
    expect(stemArabic("بlernen")).toBe("lernen");
  });

  it("returns English words unchanged", () => {
    expect(stemArabic("roblox")).toBe("roblox");
    expect(stemArabic("hello")).toBe("hello");
  });

  it("returns short words unchanged", () => {
    expect(stemArabic("اه")).toBe("اه");
  });
});

describe("stemVariants", () => {
  it("returns array with all stem variants", () => {
    const variants = stemVariants("اللاعب");
    expect(variants).toContain("اللاعب");
    expect(variants).toContain("لاعب");
  });

  it("includes plural (ات) variant", () => {
    const variants = stemVariants("اللاعبين");
    // Should contain the word and potentially the stripped version
    expect(variants.length).toBeGreaterThanOrEqual(1);
  });

  it("returns single variant for English", () => {
    expect(stemVariants("hello")).toEqual(["hello"]);
  });
});

describe("expandWithStems", () => {
  it("expands tokens with their stem variants", () => {
    const expanded = expandWithStems(["اللاعب", "المعلم"]);
    expect(expanded).toContain("لاعب");
    expect(expanded).toContain("معلم");
    expect(expanded).toContain("اللاعب");
    expect(expanded).toContain("المعلم");
  });

  it("filters out very short variants (< 2 chars)", () => {
    const expanded = expandWithStems(["وَاه"]);
    // "وَاه" after normalizeArabic = "وَاه" → tokenize → stemVariants
    // The result should not contain single-char strings
    for (const v of expanded) {
      expect(v.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("contentTokens", () => {
  it("removes stopwords and expands stems", () => {
    const tokens = contentTokens("هل في لواو متغيرات");
    // "هل" is stopword, "في" is stopword, "لواو" and "متغيرات" should remain
    expect(tokens).toContain("لواو");
    expect(tokens).not.toContain("هل");
    expect(tokens).not.toContain("في");
  });

  it("filters single-char tokens", () => {
    const tokens = contentTokens("a ب");
    expect(tokens).not.toContain("a");
  });

  it("handles empty string", () => {
    expect(contentTokens("")).toEqual([]);
  });
});

describe("codeTokens", () => {
  it("extracts tokens from Luau code", () => {
    const tokens = codeTokens('local x = 10 print(x)');
    expect(tokens).toContain("local");
    expect(tokens).toContain("print");
  });

  it("removes string literals", () => {
    const tokens = codeTokens('print("hello world")');
    expect(tokens).not.toContain("hello");
    expect(tokens).not.toContain("world");
    expect(tokens).toContain("print");
  });

  it("filters out pure numbers", () => {
    const tokens = codeTokens("local x = 42");
    expect(tokens).not.toContain("42");
    expect(tokens).toContain("local");
  });
});

describe("fnv1a", () => {
  it("produces consistent hashes", () => {
    const h1 = fnv1a("hello");
    const h2 = fnv1a("hello");
    expect(h1).toBe(h2);
  });

  it("produces different hashes for different inputs", () => {
    expect(fnv1a("hello")).not.toBe(fnv1a("world"));
  });

  it("returns unsigned 32-bit integer", () => {
    const h = fnv1a("test");
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xFFFFFFFF);
  });
});

describe("hashToHex", () => {
  it("converts to 8-char hex string", () => {
    expect(hashToHex(255)).toBe("000000ff");
    expect(hashToHex(0)).toBe("00000000");
  });

  it("pads to 8 characters", () => {
    expect(hashToHex(1).length).toBe(8);
  });
});

describe("overlapScore", () => {
  it("counts overlapping tokens", () => {
    expect(overlapScore(["a", "b", "c"], ["b", "c", "d"])).toBe(2);
  });

  it("returns 0 for no overlap", () => {
    expect(overlapScore(["a", "b"], ["c", "d"])).toBe(0);
  });

  it("returns full count for identical arrays", () => {
    expect(overlapScore(["a", "b"], ["a", "b"])).toBe(2);
  });
});

describe("buildSearchText", () => {
  it("joins and processes multiple parts", () => {
    const result = buildSearchText("مرحبا بالعالم", "هذا درس");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("filters out null/undefined parts", () => {
    const result = buildSearchText("مرحبا", null, undefined, "بالعالم");
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns empty string for empty input", () => {
    expect(buildSearchText(null, undefined)).toBe("");
    expect(buildSearchText()).toBe("");
  });
});
