/**
 * اختبارات الزاحف الذاتي: صلاحية الطابور وثوابت التعافي (بدون قاعدة بيانات).
 */
import {
  CRAWL_FAILED_COOLDOWN_SECONDS,
  CRAWL_MAX_ATTEMPTS,
  CRAWL_QUEUE,
  CRAWL_STALE_READING_SECONDS,
  extractReadableText,
} from "@/lib/luau/crawler";

describe("CRAWL_QUEUE — طابور الكتب", () => {
  it("لا يحتوي روابط مكررة", () => {
    const urls = CRAWL_QUEUE.map((q) => q.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("كل عنصر له وسوم وأصل", () => {
    for (const item of CRAWL_QUEUE) {
      expect(item.url.startsWith("https://")).toBe(true);
      expect(item.tags.trim().length).toBeGreaterThan(0);
      expect(item.origin.trim().length).toBeGreaterThan(0);
    }
  });

  it("يغطي الفصول الممتدة ويحوي صفحة الأداء المتعثرة", () => {
    expect(CRAWL_QUEUE.some((q) => q.url === "https://www.lua.org/pil/25.html")).toBe(true);
    expect(CRAWL_QUEUE.some((q) => q.url === "https://luau.org/performance")).toBe(true);
    expect(CRAWL_QUEUE.some((q) => q.url === "https://luau.org/library")).toBe(true);
  });
});

describe("ثوابت التعافي", () => {
  it("حدّ محاولات منطقي وفاصل شفاء مقبول", () => {
    expect(CRAWL_MAX_ATTEMPTS).toBeGreaterThanOrEqual(1);
    expect(CRAWL_STALE_READING_SECONDS).toBeGreaterThan(30);
    expect(CRAWL_FAILED_COOLDOWN_SECONDS).toBeGreaterThan(CRAWL_STALE_READING_SECONDS);
  });
});

describe("extractReadableText", () => {
  it("يزيل السكربت والستايل والوسوم", () => {
    const html =
      "<html><head><title>عنوان</title><script>var x=1;</script><style>body{}</style></head><body><p>مرحباً</p><div>لوا</div></body></html>";
    const { title, text } = extractReadableText(html);
    expect(title).toBe("عنوان");
    expect(text).toContain("مرحباً");
    expect(text).toContain("لوا");
    expect(text).not.toContain("<p>");
    expect(text).not.toContain("var x");
  });
});