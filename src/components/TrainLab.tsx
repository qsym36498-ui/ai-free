"use client";

import { useCallback, useEffect, useState } from "react";
import CrawlerPanel from "./CrawlerPanel";
import {
  loadMaterialCached,
  readFlag,
  readNodeCounters,
  runLocalTraining,
  sendContribution,
  setFlag,
} from "@/lib/clientTrainer";
import { getDeviceId } from "@/lib/device";

type Phase = "idle" | "loading" | "running" | "sending" | "done" | "error";

export default function TrainLab() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [lastResult, setLastResult] = useState<{ tokens: number; ms: number } | null>(null);
  const [alias, setAlias] = useState("");
  const [joined, setJoined] = useState(false);
  const [nodeOn, setNodeOn] = useState(false);
  const [counters, setCounters] = useState(readNodeCounters);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- مزامنة أولية من localStorage
    setJoined(!!localStorage.getItem("luau-node-joined"));
    const savedAlias = localStorage.getItem("luau-node-alias");
    if (savedAlias) setAlias(savedAlias);
    setNodeOn(readFlag("node"));

    const onFlags = () => setNodeOn(readFlag("node"));
    const onStats = (event: Event) =>
      setCounters((event as CustomEvent<{ sessions: number; tokens: number }>).detail);
    window.addEventListener("luau-flags-changed", onFlags);
    window.addEventListener("luau-node-stats", onStats);
    return () => {
      window.removeEventListener("luau-flags-changed", onFlags);
      window.removeEventListener("luau-node-stats", onStats);
    };
  }, []);

  const startSession = useCallback(
    async (mode: "manual" | "auto", maxTokens: number, epochs: number, silent = false) => {
      try {
        if (!silent) {
          setPhase("loading");
          setProgress(0);
        }
        const material = await loadMaterialCached();
        if (!silent) setPhase("running");

        const startedAt = performance.now();
        const result = await runLocalTraining(material, maxTokens, epochs, (ratio) => {
          setProgress(ratio);
        });
        const durationMs = Math.round(performance.now() - startedAt);

        if (!silent) setPhase("sending");
        const ok = await sendContribution(mode, result.tokensProcessed, result.checksum, durationMs);
        if (!ok) throw new Error("رفض الخادم المساهمة");

        if (!silent) {
          setLastResult({ tokens: result.tokensProcessed, ms: durationMs });
          setPhase("done");
        }
      } catch {
        if (!silent) setPhase("error");
      }
    },
    []
  );

  // لا جلسة تلقائية: جهاز الزائر ما يشتغل إلا بعد ما يضغط زر بنفسه

  async function joinNetwork() {
    try {
      const name = alias.trim() || "عقدة بلا اسم";
      const response = await fetch("/api/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: getDeviceId(), alias: name }),
      });
      const json = (await response.json()) as { ok: boolean };
      if (json.ok) {
        setJoined(true);
        localStorage.setItem("luau-node-joined", "1");
        localStorage.setItem("luau-node-alias", name);
      }
    } catch {
      /* نتجاهل */
    }
  }

  function toggleNodeMode() {
    setFlag("node", !nodeOn);
    setNodeOn(!nodeOn);
  }

  const percent = Math.round(progress * 100);
  const busy = phase === "running" || phase === "loading" || phase === "sending";

  return (
    <div className="space-y-6">
      {/* جلسة التدريب اليدوية */}
      <div className="rounded-xl border border-line bg-panel p-6">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint/15 font-mono text-mint">⚙</span>
          <h3 className="text-lg font-bold text-fog">درّب النموذج من جهازك</h3>
        </div>
        <p className="mb-5 text-sm leading-7 text-dim">
          جهازك يقطّع مادة المعرفة ويبني خريطة تكرارات وبصمة تجزئة، ثم يتبرع بالنتيجة.
          معالجة خفيفة ومجانية — وكل جلسة ترفع نقاط النموذج.
        </p>

        {busy && (
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between font-mono text-xs text-dim">
              <span>يعالج جهازك الآن...</span>
              <span>{percent}%</span>
            </div>
            <div className="relative h-2.5 overflow-hidden rounded-full border border-line bg-ink">
              <div className="h-full bg-mint transition-all duration-200" style={{ width: percent + "%" }} />
              <div className="scan-bar absolute top-0 h-full w-1/4 bg-gradient-to-l from-transparent via-white/20 to-transparent" />
            </div>
          </div>
        )}

        {phase === "done" && lastResult && (
          <div className="mb-4 rounded-lg border border-mint/30 bg-mint/10 p-3 text-sm leading-6 text-mintsoft">
            ✓ شكراً! ساهم جهازك بمعالجة{" "}
            <span className="font-mono font-bold">{lastResult.tokens.toLocaleString("en")}</span> توكن خلال{" "}
            <span className="font-mono">{(lastResult.ms / 1000).toFixed(1)}</span> ثانية.
          </div>
        )}

        {phase === "error" && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            تعذر إتمام الجلسة — تأكد من الاتصال وأعد المحاولة.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => startSession("manual", 20000, 2)}
            disabled={busy}
            className="rounded-lg bg-mint px-5 py-2 text-sm font-bold text-ink transition hover:bg-mintsoft disabled:opacity-40"
          >
            جلسة كاملة (~40 ألف توكن)
          </button>
          <button
            onClick={() => startSession("manual", 6000, 1)}
            disabled={busy}
            className="rounded-lg border border-line bg-panel2 px-5 py-2 text-sm text-fog transition hover:border-mint/50 disabled:opacity-40"
          >
            جلسة سريعة (~6 آلاف)
          </button>
        </div>
      </div>

      {/* وضع العقدة — يعيش بكل صفحات الموقع */}
      <div className="rounded-xl border border-amber/30 bg-panel p-6">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/15 font-mono text-amber">⇄</span>
          <h3 className="text-lg font-bold text-fog">حوّل جهازك إلى عقدة تدريب دائمة</h3>
        </div>
        <p className="mb-5 text-sm leading-7 text-dim">
          بمجرد التشغيل، يصير جهازك سيرفر تدريب صغير <b className="text-embersoft">يعمل في كل صفحات
          الموقع</b>: بالدردشة، بالدروس، بأي مكان — يدرّب النموذج ويخليه يقرأ من الإنترنت
          باستمرار، وما بوقف إلا إذا أوقفته. تقدر تطلع من صفحة التدريب وتكمل تصفح عادي.
        </p>

        {!joined ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={alias}
              onChange={(event) => setAlias(event.target.value)}
              placeholder="اسم عقدتك (مثلاً: جهاز زيد)"
              className="w-56 rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-fog outline-none placeholder:text-faint focus:border-amber/60"
            />
            <button
              onClick={() => void joinNetwork()}
              className="rounded-lg bg-amber px-5 py-2 text-sm font-bold text-ink transition hover:bg-embersoft"
            >
              انضم لشبكة التدريب
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={toggleNodeMode}
                className={
                  "rounded-lg px-5 py-2 text-sm font-bold transition " +
                  (nodeOn
                    ? "bg-danger/90 text-ink hover:bg-danger"
                    : "bg-amber text-ink hover:bg-embersoft")
                }
              >
                {nodeOn ? "⏹ أوقف عقدتك" : "▶ شغّل وضع العقدة الدائم"}
              </button>
              <span className="flex items-center gap-2 text-xs text-dim">
                {nodeOn && <span className="h-2 w-2 rounded-full bg-mint pulse-dot" />}
                {nodeOn
                  ? "شغالة بكل الصفحات — تابع تصفحك براحتك"
                  : "العقدة متوقفة"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
              <div className="rounded-lg border border-linesoft bg-panel2 p-3">
                <p className="font-mono text-lg font-bold text-amber">{counters.sessions}</p>
                <p className="text-[11px] text-dim">جلسات عقدتك</p>
              </div>
              <div className="rounded-lg border border-linesoft bg-panel2 p-3">
                <p className="font-mono text-lg font-bold text-amber">{counters.tokens.toLocaleString("en")}</p>
                <p className="text-[11px] text-dim">توكن عالجته</p>
              </div>
              <div className="rounded-lg border border-linesoft bg-panel2 p-3">
                <p className="truncate font-mono text-lg font-bold text-mint">
                  {alias || "عقدتك"}
                </p>
                <p className="text-[11px] text-dim">اسم عقدتك بالشبكة</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* الزاحف الذاتي */}
      <CrawlerPanel />
    </div>
  );
}
