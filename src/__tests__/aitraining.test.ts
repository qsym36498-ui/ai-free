/**
 * اختبارات منهج التدريب — التحقق من عدم التكرار والمنطق العام.
 * لا نختبر generateAILesson هنا لأنه يحتاج Qwen API + قاعدة بيانات.
 */

// معلومات تفادياً لاتصال قاعدة البيانات عند الاستيراد
jest.mock("@/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
  pool: { query: jest.fn(), end: jest.fn() },
}));

import { CORE_TOPICS, AI_TOPICS, EXTENDED_TOPICS } from "@/lib/luau/aitraining";

describe("curriculum structure", () => {
  it("CORE_TOPICS has 129 topics", () => {
    expect(CORE_TOPICS.length).toBe(129);
  });

  it("AI_TOPICS includes both core and extended", () => {
    expect(AI_TOPICS.length).toBe(CORE_TOPICS.length + EXTENDED_TOPICS.length);
  });

  it("AI_TOPICS has 475 total topics", () => {
    expect(AI_TOPICS.length).toBe(475);
  });

  it("no duplicate topic names across all topics", () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const t of AI_TOPICS) {
      if (seen.has(t.topic)) {
        dupes.push(t.topic);
      }
      seen.add(t.topic);
    }
    expect(dupes).toEqual([]);
  });

  it("every topic has required fields", () => {
    for (const t of AI_TOPICS) {
      expect(typeof t.topic).toBe("string");
      expect(t.topic.length).toBeGreaterThan(0);
      expect(["lesson", "system"]).toContain(t.kind);
      expect(typeof t.level).toBe("string");
      expect(typeof t.focus).toBe("string");
      expect(t.focus.length).toBeGreaterThan(0);
    }
  });

  it("levels are valid", () => {
    const validLevels = ["مبتدئ", "متوسط", "متقدم"];
    for (const t of AI_TOPICS) {
      expect(validLevels).toContain(t.level);
    }
  });

  it("CORE_TOPICS comes before EXTENDED_TOPICS in AI_TOPICS", () => {
    const coreTopics = new Set(CORE_TOPICS.map((t) => t.topic));
    let foundExtended = false;
    for (const t of AI_TOPICS) {
      if (!coreTopics.has(t.topic)) {
        foundExtended = true;
      }
      if (foundExtended) {
        expect(coreTopics.has(t.topic)).toBe(false);
      }
    }
  });

  it("has topics for all expected languages", () => {
    const langs = new Set(AI_TOPICS.map((t) => t.lang ?? "لواو"));
    expect(langs.has("لواو")).toBe(true);
    expect(langs.has("بايثون")).toBe(true);
    expect(langs.has("جافاسكريبت")).toBe(true);
    expect(langs.has("C++")).toBe(true);
  });

  it("has both lesson and system kinds", () => {
    const kinds = new Set(AI_TOPICS.map((t) => t.kind));
    expect(kinds.has("lesson")).toBe(true);
    expect(kinds.has("system")).toBe(true);
  });
});

describe("topic matching logic (extracted)", () => {
  // نختبر منطق topicMatches بشكل محاكي
  function topicMatches(topic: string, title: string): boolean {
    if (title === topic) return true;
    return title.includes(topic) || topic.includes(title);
  }

  it("exact match", () => {
    expect(topicMatches("المتغيرات", "المتغيرات")).toBe(true);
  });

  it("title contains topic", () => {
    expect(topicMatches("المتغيرات", "شرح المتغيرات في لواو")).toBe(true);
  });

  it("topic contains title", () => {
    expect(topicMatches("المتغيرات في لواو", "المتغيرات")).toBe(true);
  });

  it("no match", () => {
    expect(topicMatches("الدوال", "الجداول")).toBe(false);
  });
});
