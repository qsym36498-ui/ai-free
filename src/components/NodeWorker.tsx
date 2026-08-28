"use client";

import { useEffect, useRef, useState } from "react";
import {
  bumpNodeCounters,
  loadMaterialCached,
  readFlag,
  readNodeCounters,
  runLocalTraining,
  sendContribution,
  setFlag,
} from "@/lib/clientTrainer";

interface WorkerStats {
  sessions: number;
  tokens: number;
  lastRead: string | null;
}

/**
 * عامل الخلفية العالمي: يعيش في كل صفحات الموقع (تخطيط الجذر).
 * ما دام وضع العقدة أو الزاحف شغالاً، يستمر التدريب والقراءة من
 * الإنترنت حتى وأنت تدردش أو تتصفح الدروس — لا يتوقف إلا بإيقافه.
 */
export default function NodeWorker() {
  const [stats, setStats] = useState<WorkerStats>(() => ({
    ...readNodeCounters(),
    lastRead: null,
  }));
  const [active, setActive] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    const refreshActive = () => setActive(readFlag("node") || readFlag("crawl"));
    refreshActive();
    window.addEventListener("luau-flags-changed", refreshActive);
    const statsHandler = (event: Event) => {
      const detail = (event as CustomEvent<{ sessions: number; tokens: number }>).detail;
      setStats((prev) => ({ ...prev, sessions: detail.sessions, tokens: detail.tokens }));
    };
    window.addEventListener("luau-node-stats", statsHandler);

    let cancelled = false;

    const cycle = async () => {
      if (busyRef.current) return;
      const nodeOn = readFlag("node");
      const crawlOn = readFlag("crawl");
      if (!nodeOn && !crawlOn) return;
      busyRef.current = true;
      try {
        // 1) جهازك يتدرب محلياً ويتبرع بالنتيجة
        if (nodeOn) {
          const material = await loadMaterialCached();
          const startedAt = performance.now();
          const result = await runLocalTraining(material, 5000, 1);
          const ok = await sendContribution(
            "auto",
            result.tokensProcessed,
            result.checksum,
            Math.round(performance.now() - startedAt)
          );
          if (ok) {
            const counters = bumpNodeCounters(result.tokensProcessed);
            setStats((prev) => ({ ...prev, ...counters }));
          }
        }

        // 2) النموذج يقرأ من الإنترنت باستمرار
        if (nodeOn || crawlOn) {
          const response = await fetch("/api/crawl/tick", { method: "POST" });
          const data = (await response.json()) as { title?: string };
          if (data.title) {
            setStats((prev) => ({ ...prev, lastRead: data.title ?? null }));
          }
        }
      } catch {
        /* دورة فاشلة — نتابع بالدورة القادمة */
      } finally {
        busyRef.current = false;
      }
    };

    const timer = setInterval(() => {
      if (!cancelled) void cycle();
    }, 6000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("luau-flags-changed", refreshActive);
      window.removeEventListener("luau-node-stats", statsHandler);
    };
  }, []);

  if (!active) return null;

  return (
    <div className="rise-in fixed bottom-24 left-4 z-50 w-[calc(100vw-2rem)] max-w-72 rounded-xl border border-mint/40 bg-panel p-4 shadow-lg shadow-mint/10 sm:bottom-5 sm:left-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-bold text-mint">
          <span className="h-2 w-2 rounded-full bg-mint pulse-dot" />
          عقدة التدريب شغالة — بكل الصفحات
        </p>
        <button
          onClick={() => {
            setFlag("node", false);
            setFlag("crawl", false);
            setActive(false);
          }}
          className="rounded border border-line px-2 py-0.5 text-[10px] text-dim transition hover:border-danger/50 hover:text-danger"
        >
          إيقاف
        </button>
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg border border-linesoft bg-panel2 p-2">
          <p className="font-mono text-sm font-bold text-amber">{stats.sessions}</p>
          <p className="text-[9px] text-dim">جلسة تدريب</p>
        </div>
        <div className="rounded-lg border border-linesoft bg-panel2 p-2">
          <p className="font-mono text-sm font-bold text-amber">
            {stats.tokens.toLocaleString("en")}
          </p>
          <p className="text-[9px] text-dim">توكن عالجته</p>
        </div>
      </div>
      {stats.lastRead && (
        <p className="truncate text-[10px] leading-5 text-mintsoft" title={stats.lastRead}>
          يقرأ الآن من الويب: {stats.lastRead}
        </p>
      )}
    </div>
  );
}
