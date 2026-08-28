"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getDeviceId } from "@/lib/device";
import { CONSENT_EVENT, readConsent, setConsent } from "@/lib/consent";

/**
 * مساهمة اختيارية: نسأل الزائر أولاً، وما نشغّل أي شي على جهازه
 * إلا بعد ما يوافق. القرار محفوظ بالمتصفح وقابل للتغيير.
 */
export default function AutoTrainer() {
  const [ask, setAsk] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const contribute = useCallback(async () => {
    try {
      const materialResponse = await fetch("/api/train/material");
      const { material } = (await materialResponse.json()) as { material: string };
      const tokens = (material.match(/[ء-غف-يa-z0-9_]{2,}/gi) ?? []).slice(0, 900);

      let checksum = 0x811c9dc5;
      for (const token of tokens) {
        for (let i = 0; i < token.length; i++) {
          checksum ^= token.charCodeAt(i);
          checksum = Math.imul(checksum, 0x01000193) >>> 0;
        }
      }

      const response = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: getDeviceId(),
          mode: "auto",
          tokensProcessed: tokens.length,
          checksum: checksum.toString(16).padStart(8, "0"),
          durationMs: 1,
        }),
      });
      const result = (await response.json()) as { ok: boolean };
      if (result.ok) {
        setMessage("شكراً! جهازك عالج " + tokens.length + " كلمة من مكتبة المعرفة");
        setTimeout(() => setMessage(null), 6000);
      }
    } catch {
      /* مساهمة اختيارية — نتجاهل الفشل بهدوء */
    }
  }, []);

  useEffect(() => {
    function decide() {
      const state = readConsent();
      if (state === "granted") {
        setAsk(false);
        if (!sessionStorage.getItem("luau-home-trained")) {
          sessionStorage.setItem("luau-home-trained", "1");
          void contribute();
        }
        return;
      }
      setAsk(state === "unset");
    }

    decide();
    window.addEventListener(CONSENT_EVENT, decide);
    return () => window.removeEventListener(CONSENT_EVENT, decide);
  }, [contribute]);

  if (ask) {
    return (
      <div
        role="dialog"
        aria-label="طلب الموافقة على استخدام جهازك"
        className="rise-in fixed inset-x-4 bottom-4 z-50 rounded-xl border border-mint/40 bg-panel p-4 shadow-lg shadow-mint/10 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-80"
      >
        <p className="mb-1 flex items-center gap-2 text-sm font-bold text-fog">
          <span className="h-1.5 w-1.5 rounded-full bg-mint" />
          تسمح لجهازك يساهم؟
        </p>
        <p className="mb-3 text-xs leading-6 text-dim">
          رح يعالج شوية نصوص من مكتبة المعرفة لثانية أو ثانيتين، ويرسل عدد الكلمات
          وبصمة تحقّق فقط. ما منجمع أي شي شخصي، وفيك ترفض بدون ما يتأثر شي بالموقع.{" "}
          <Link href="/privacy" className="text-mint underline">
            التفاصيل
          </Link>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setConsent("granted")}
            className="flex-1 rounded-lg bg-mint px-3 py-2 text-xs font-bold text-ink transition hover:bg-mintsoft"
          >
            موافق، ساهم
          </button>
          <button
            onClick={() => setConsent("denied")}
            className="flex-1 rounded-lg border border-line bg-panel2 px-3 py-2 text-xs text-fog transition hover:border-mint/40"
          >
            لا، شكراً
          </button>
        </div>
      </div>
    );
  }

  if (!message) return null;

  return (
    <div
      role="status"
      className="rise-in fixed inset-x-4 bottom-4 z-50 flex items-center gap-2 rounded-lg border border-mint/40 bg-panel px-4 py-2.5 text-xs text-mintsoft shadow-lg shadow-mint/10 sm:inset-x-auto sm:right-5 sm:bottom-5"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-mint pulse-dot" />
      {message}
    </div>
  );
}
