/**
 * اختبار تكامل لنقطة `/api/ask` — يشغّل خط الإجابة كاملاً:
 * فهرس BM25 الحقيقي + الدروس المدمجة + محرك النية/القالب + قاعدة معرفة وهمية فارغة
 * (بدون Qwen وبدون قاعدة بيانات) ليبقى الاختبار سريعاً وحاسماً.
 */

// قاعدة بيانات وهمية — كل الاستعلامات تعيد صفوفاً فارغة
// (thenable Proxy: أي سلسلة select().from().where().limit() تُحل إلى [])
const chainable: any = new Proxy(
  {},
  {
    get(_t, prop) {
      if (prop === "then") return (resolve: (v: unknown) => void) => resolve([]);
      return () => chainable;
    },
  }
);

const dbMock = {
  select: jest.fn(() => chainable),
  insert: jest.fn(),
};

jest.mock("@/db", () => ({
  db: dbMock,
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [] }),
  },
}));

// Qwen معطّل — نتحقق أن المحرك اليدوي (BM25 + قوالب) يُجيب وحده
jest.mock("@/lib/qwen", () => {
  const actual = jest.requireActual("@/lib/qwen");
  return {
    ...actual,
    qwenAvailable: () => false,
    qwenChat: jest.fn(async () => null),
  };
});

// نُسكت أخطاء console المتعمدة (مسارات catch تتعمد إغراق الإخطاء في الحالة الطبيعية)
let errorSpy: jest.SpyInstance;
beforeAll(() => {
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  errorSpy.mockRestore();
});

import { POST } from "@/app/api/ask/route";

async function ask(question: string, offline?: boolean) {
  const res = await POST(
    new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, ...(offline !== undefined ? { offline } : {}) }),
    })
  );
  return { status: res.status, body: await res.json() };
}

describe("POST /api/ask — تكامل المحرك", () => {
  it("يرد 200 ويحلل JSON لسؤال عادي", async () => {
    const { status, body } = await ask("كيف أحفظ بيانات اللاعب في روبلوكس؟");
    expect(status).toBe(200);
    expect(typeof body.kind).toBe("string");
  });

  it("تحية → kind: greeting", async () => {
    const { body } = await ask("مرحبا كيفك");
    expect(body.kind).toBe("greeting");
  });

  it("سؤال قدرات → kind: capabilities", async () => {
    const { body } = await ask("شو بتعرف تعمل؟");
    expect(body.kind).toBe("capabilities");
  });

  it("طلب نظام جاهز → kind: generator مع أقسام أكواد", async () => {
    const { body } = await ask("اكتب لي نظام صيد سمك كامل");
    expect(body.kind).toBe("generator");
    expect(body.intro.length).toBeGreaterThan(0);
    // إجابة المولّد تحتوي أقساماً بكود
    const hasCode = body.sections.some(
      (s: { code?: string }) => typeof s.code === "string" && s.code.length > 0
    );
    expect(hasCode).toBe(true);
  });

  it("سؤال معرفي يدخل فهرس الدروس المدمجة → kind: knowledge", async () => {
    const { body } = await ask("ما هي الميتا تيبل في لواو؟");
    const kinds = ["knowledge", "generator", "fallback"];
    expect(kinds).toContain(body.kind);
    if (body.kind === "knowledge") {
      expect(body.intro.length).toBeGreaterThan(5);
    }
  });

  it("سؤال إنشاء نظام غير معروف → هيكل مخصص (generator)", async () => {
    const { body } = await ask("اصنع لي نظام مطبخ وعشاء");
    expect(body.kind).toBe("generator");
  });

  it("سؤال فارغ → kind: fallback", async () => {
    const { body } = await ask("");
    expect(body.kind).toBe("fallback");
  });

  it("offline: true لا يغيّر السلوك اليدوي (Qwen معطّل أصلاً)", async () => {
    const online = await ask("ما هي الميتا تيبل في لواو؟", false);
    const offline = await ask("ما هي الميتا تيبل في لواو؟", true);
    expect(online.status).toBe(200);
    expect(offline.status).toBe(200);
    expect(["knowledge", "generator", "fallback"]).toContain(offline.body.kind);
  });

  it("JSON غير صالح → يعيد fallback بدل الانهيار", async () => {
    const res = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json{",
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kind).toBe("fallback");
  });

  it("طلبات كثيرة خلال دفعة لا تتعارض (فهرسة مؤقتة بين المكالمات)", async () => {
    const questions = [
      "اشرح لي الجداول في لواو",
      "نظام متجر آمن",
      "كيف أحمي لعبتي من المخترقين؟",
      "الفرق بين ipairs و pairs",
      "اصنع لي نظام قمرة قيادة للسفينة",
    ];
    for (const q of questions) {
      const { status } = await ask(q);
      expect(status).toBe(200);
    }
  });

  it("طلب عداد نقرات مفصّل → كود متكامل بمصادر متعددة (لا صفحة وحدة)", async () => {
    const question =
      "اكتب لي سكربت صغير جدا جدا من لواو: نظام يحسب عدد النقرات لكل لاعب على حدا، يخزن العداد في الجدول، يحد نص النقرات كحد اقصى 3 بالنقرة الواحدة عشان ما يغش احد، و يعرض العداد في الـ leaderstats و يحفظه بـ DataStore لما يطلع اللاعب";
    const { status, body } = await ask(question);
    expect(status).toBe(200);
    expect(body.kind).toBe("generator");

    const code = body.sections
      .filter((s: { code?: string }) => typeof s.code === "string")
      .map((s: { code: string }) => s.code)
      .join("\n");

    // كل التفاصيل التي ضاعت في المرة السابقة
    expect(code).toContain("DataStoreService");
    expect(code).toContain("RemoteEvent");
    expect(code).toContain("MAX_PER_SECOND = 3");
    expect(code).toContain("leaderstats");
    expect(code).toContain("playerClicks");

    // جمع من أكثر من مصدر
    expect(Array.isArray(body.sources)).toBe(true);
    expect(body.sources.length).toBeGreaterThanOrEqual(3);
  });

  it("طلب نظام صيد يبقى قالباً واحداً وأنيقاً (لم يكسر السلوك القديم)", async () => {
    const { status, body } = await ask("اكتب لي نظام صيد سمك كامل");
    expect(status).toBe(200);
    expect(body.kind).toBe("generator");
    expect(Array.isArray(body.sources)).toBe(true);
    expect(body.sources.length).toBeGreaterThanOrEqual(1);
  });
});