/**
 * موافقة الزائر قبل تشغيل أي معالجة على جهازه.
 * القرار محفوظ بالمتصفح، وقابل للتغيير في أي وقت.
 */

export const CONSENT_KEY = "luau-compute-consent";
export const CONSENT_EVENT = "luau-consent-changed";

export type ConsentState = "granted" | "denied" | "unset";

export function readConsent(): ConsentState {
  if (typeof window === "undefined") return "unset";
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    if (value === "granted" || value === "denied") return value;
    return "unset";
  } catch {
    return "unset";
  }
}

export function setConsent(state: "granted" | "denied"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_KEY, state);
  } catch {
    /* متصفح بلا تخزين — نكمل بالجلسة الحالية فقط */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
}

export function clearConsent(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* نتجاهل */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: "unset" }));
}
