/**
 * اختبارات نظام الموافقة — نختبر فقط القيم والثوابت لأن الدوال
 * تحتاج window/localStorage (غير متوفر في Node).
 */
import {
  CONSENT_KEY,
  CONSENT_EVENT,
  type ConsentState,
} from "@/lib/consent";

describe("consent constants", () => {
  it("has correct localStorage key", () => {
    expect(CONSENT_KEY).toBe("luau-compute-consent");
  });

  it("has correct event name", () => {
    expect(CONSENT_EVENT).toBe("luau-consent-changed");
  });
});

describe("ConsentState type", () => {
  it("accepts valid states", () => {
    const valid: ConsentState[] = ["granted", "denied", "unset"];
    expect(valid).toHaveLength(3);
    expect(valid).toContain("granted");
    expect(valid).toContain("denied");
    expect(valid).toContain("unset");
  });
});
