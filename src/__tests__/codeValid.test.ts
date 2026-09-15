/**
 * اختبارات بوابة صحة الكود — تمنع دخول دروس بكود لواو معطوب للدماغ.
 */
import { detectLang, hasInvalidCode, sanitizeLuauCode, stripStringsAndComments } from "@/lib/luau/codeValid";

describe("stripStringsAndComments", () => {
  it("يزيل السلاسل النصية والتعليقات ويبقي المعرّفات", () => {
    const out = stripStringsAndComments('-- تعليق\nlocal name = "مرحبا"\nprint(name)');
    expect(out).not.toContain("مرحبا");
    expect(out).not.toContain("تعليق");
    expect(out).toContain("name");
  });
});

describe("hasInvalidCode", () => {
  it("يرفض معرّفات عربية", () => {
    expect(hasInvalidCode("local العمر = 25")).toBeTruthy();
    expect(hasInvalidCode("local function حسابالمعدل(x) return x end")).toBeTruthy();
    expect(hasInvalidCode("local درجات أحمد = {85, 90}")).toBeTruthy();
  });

  it("يرفض عوامل غير مدعومة مثل جمع مختصر", () => {
    expect(hasInvalidCode("local sum = 0\nsum += 5")).toBeTruthy();
  });

  it("يقبل كوداً سليماً بنصوص عربية داخل السلاسل والتعليقات", () => {
    const good = [
      'local name = "أحمد"\nlocal function getAge() return 25 end',
      'local person = { name = "محمد", age = 30 }\n-- تعليق عربي\nprint(person.name)',
      "local t = {85, 90}\nlocal sum = 0\nfor _, v in ipairs(t) do sum = sum + v end",
    ];
    for (const code of good) {
      expect(hasInvalidCode(code)).toBeNull();
    }
  });
});

describe("sanitizeLuauCode", () => {
  it("يعيد تسمية المعرّفات العربية باستمرار ويصلح += ليُمرَّر الفحص", () => {
    const dirty =
      'local العمر = 25\nlocal الاسم = "أحمد"\nprint(الاسم .. " عمره " .. العمر)\nlocal مجموع = 0\nfor i = 1, العمر do مجموع += i end';
    const clean = sanitizeLuauCode(dirty);
    expect(hasInvalidCode(clean)).toBeNull();
    expect(stripStringsAndComments(clean)).not.toMatch(/[\u0600-\u06FF]/);
    expect(clean).toContain('"أحمد"');
    expect(clean).toContain("ar1"); // العمر
    expect(clean).toContain("ar2"); // الاسم
    expect(clean).toContain("= ar3 + "); // ناتج إصلاح +=
    expect(clean).toMatch(/print\(ar2 \.\. /); // نفس الاسم العربي أُعيدت تسميته باستمرار
  });

  it("يترك السلاسل والتعليقات بكل لغاتها كما هي", () => {
    const dirty = 'local x = 1 -- تعليق عربي\n-- حساب\nprint(x)';
    const clean = sanitizeLuauCode(dirty);
    expect(hasInvalidCode(clean)).toBeNull();
    expect(clean).toContain("-- تعليق عربي");
    expect(clean).toContain("-- حساب");
  });

  it("يصلح many عربي مزدوج في local (مثل درجات أحمد)", () => {
    const clean = sanitizeLuauCode("local درجات أحمد = {85, 90}");
    expect(hasInvalidCode(clean)).toBeNull();
    expect(clean).toMatch(/^\s*local\s+ar\d+\s*=/);
  });

  it("يصلح العوامل على عناصر الجداول", () => {
    const clean = sanitizeLuauCode("local t = {0}\nt[1] += 2");
    expect(hasInvalidCode(clean)).toBeNull();
    expect(clean).toContain("t[1] = t[1] + 2");
  });

  it("يعامل # طولَ جدول في لواو لا تعليقاً — يعيد تسمية ما بعده", () => {
    const clean = sanitizeLuauCode("local الأصدقاء = {}\nprint(#الأصدقاء)");
    expect(hasInvalidCode(clean)).toBeNull();
    expect(clean).toContain("print(#ar1)");
  });

  it("لغة بايثون: يحفظ تعليقات # والعامل += الصالح", () => {
    const code = "# حساب العمر\nage = 18\nage += 1";
    const lang = "python";
    expect(hasInvalidCode(code, lang)).toBeNull();
    expect(hasInvalidCode(sanitizeLuauCode(code, lang), lang)).toBeNull();
  });

  it("لغة جافاسكريبت: يحفظ تعليقات // والعامل +=", () => {
    const code = "// مجموع\nlet sum = 0\nsum += 5";
    const lang = "js";
    expect(hasInvalidCode(code, lang)).toBeNull();
    expect(hasInvalidCode(sanitizeLuauCode(code, lang), lang)).toBeNull();
  });

  it("detectLang يفرز اللغات من أسماء المواضيع", () => {
    expect(detectLang("المتغيرات في بايثون")).toBe("python");
    expect(detectLang("الحلقات في جافاسكريبت")).toBe("js");
    expect(detectLang("أساسيات TypeScript")).toBe("js");
    expect(detectLang("المتغيرات في C++")).toBe("cpp");
    expect(detectLang("المتغيرات في لوا")).toBe("lua");
  });

  it("يكتشف العربية الصامتة (ZWNJ) في الأسماء العربية", () => {
    const clean = sanitizeLuauCode("local درجات\u200Cأحمد = {5}");
    expect(hasInvalidCode(clean)).toBeNull();
    expect(clean).toMatch(/^\s*local ar\d+ = \{5\}/);
  });
});