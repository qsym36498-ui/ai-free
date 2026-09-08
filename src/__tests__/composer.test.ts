/**
 * اختبارات المولّف متعدد المصادر — الطبقة التي تجمع جواباً من أكثر من قالب/درس
 * بدل نسخ قالب واحد، وتطبق تفاصيل طلب اللاعب (حد أقصى، حفظ، لكل لاعب).
 */
import { extractClickLimit, multiSourceAnswer } from "@/lib/luau/composer";
import { scoreTemplates } from "@/lib/luau/templates";

const CLICK_QUESTION =
  "اكتب لي سكربت صغير جدا جدا من لواو: نظام يحسب عدد النقرات لكل لاعب على حدا، يخزن العداد في الجدول، يحد نص النقرات كحد اقصى 3 بالنقرة الواحدة عشان ما يغش احد، و يعرض العداد في الـ leaderstats و يحفظه بـ DataStore لما يطلع اللاعب";

describe("scoreTemplates — ترجيح القوالب", () => {
  it("سؤال عداد النقرات التفصيلي يرجّح القالب المتكامل أولاً", () => {
    const scored = scoreTemplates(CLICK_QUESTION);
    expect(scored.length).toBeGreaterThan(0);
    expect(scored[0].template.id).toBe("click-counter-advanced");
  });

  it("سؤال وحيد النظام (صيد) يرجّح قالباً واحداً فقط بقوة", () => {
    const scored = scoreTemplates("اكتب لي نظام صيد سمك كامل");
    expect(scored[0].template.id).toBe("fishing");
    expect(scored[0].hits).toBeGreaterThanOrEqual(2);
  });
});

describe("extractClickLimit — استخراج الحد الأقصى", () => {
  it("يستخرج 3 من «حد اقصى 3»", () => {
    expect(extractClickLimit("حد اقصى 3 نقرات في الثانية")).toBe(3);
  });

  it("يستخرج العدد من «3 بالنقرة الواحدة»", () => {
    expect(extractClickLimit("حد 3 بالنقرة الواحدة")).toBe(3);
  });

  it("يستخرج العدد من «بحد 10»", () => {
    expect(extractClickLimit("بحد 10 وخلاص")).toBe(10);
  });

  it("يعيد null بلا حد مذكور", () => {
    expect(extractClickLimit("اكتب لي عداد نقرات جميل")).toBeNull();
  });
});

describe("multiSourceAnswer — الدمج متعدد المصادر", () => {
  it("سؤال عداد تفصيلي → كود متكامل فيه كل المتطلبات", () => {
    const answer = multiSourceAnswer(CLICK_QUESTION);
    expect(answer).not.toBeNull();
    expect(answer!.kind).toBe("generator");

    const code = answer!.sections
      .filter((s) => s.code)
      .map((s) => s.code!)
      .join("\n");

    // كل التفاصيل التي ضاعت سابقاً أصبحت موجودة الآن
    expect(code).toContain("DataStoreService");
    expect(code).toContain("RemoteEvent");
    expect(code).toContain("MAX_PER_SECOND = 3");
    expect(code).toContain("leaderstats");
    expect(code).toContain("playerClicks");
    expect(code).toContain("blocked"); // ضد الغش
  });

  it("سؤال عداد → مصادر متعددة لا مصدر واحد", () => {
    const answer = multiSourceAnswer(CLICK_QUESTION);
    expect(answer!.sources.length).toBeGreaterThanOrEqual(3);
    expect(answer!.intro).toContain("جمعت");
  });

  it("سؤال متعدد الأنظمة (زومبي + نقاط) → تجميع مع مصادر متعددة", () => {
    const answer = multiSourceAnswer("زومبي يلاحق اللاعب وجمع نقاط");
    expect(answer).not.toBeNull();
    expect(answer!.sources.length).toBeGreaterThanOrEqual(2);
  });

  it("سؤال نظام واحد (صيد) → لا دمج، يعيد null ليأخذ القالب وحده", () => {
    expect(multiSourceAnswer("اكتب لي نظام صيد سمك كامل")).toBeNull();
  });
});