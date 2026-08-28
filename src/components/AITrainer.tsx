"use client";

import { useCallback, useEffect, useState } from "react";

type TStatus = {
  ok: boolean;
  enabled: boolean;
  aiDocs: number;
  curriculum: number;
  totalTopics: number;
  lastTrainedAt: string | null;
  nextTopics: string[];
  phase?: "curriculum" | "library" | "idle";
  complete?: boolean;
  running?: boolean;
  libraryTotal?: number;
  libraryDone?: number;
};

type TResult = {
  status: "trained" | "skipped" | "failed";
  topic: string;
  title?: string;
  error?: string;
};

type DemoSection = { heading?: string; text?: string; code?: string; fileName?: string };
type DemoAnswer = {
  kind: string;
  intro: string;
  sections: DemoSection[];
  tips: string[];
  sources: string[];
  followUps: string[];
};

export default function AITrainer() {
  const [status, setStatus] = useState<TStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<TResult[]>([]);
  const [message, setMessage] = useState("");
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoQ, setDemoQ] = useState("");
  const [demoing, setDemoing] = useState(false);
  const [demoA, setDemoA] = useState<DemoAnswer | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/train/ai", { cache: "no-store" });
      const json = (await response.json()) as TStatus;
      setStatus(json);
    } catch {
      /* نتجاهل */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- جلب الحالة عند فتح الصفحة
    void refresh();
    const timer = setInterval(() => void refresh(), 20_000);
    return () => clearInterval(timer);
  }, [refresh]);

  async function runBatch(batch: number) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/train/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch }),
      });
      const json = (await response.json()) as {
        ok: boolean;
        trained?: TResult[];
        skipped?: TResult[];
        failed?: TResult[];
        complete?: boolean;
        error?: string;
      };
      if (!json.ok) {
        setMessage(json.error ?? "تعذرت الجلسة");
        setBusy(false);
        return;
      }
      const fresh: TResult[] = [
        ...(json.trained ?? []),
        ...(json.skipped ?? []),
        ...(json.failed ?? []),
        ...(json.error ? [{ status: "failed" as const, topic: "", error: json.error }] : []),
      ];
      setLog((prev) => [...fresh, ...prev].slice(0, 30));
    } catch {
      setMessage("تعذر الاتصال بالخادم");
    } finally {
      setBusy(false);
      void refresh();
    }
  }

  async function offlineTry() {
    if (!demoQ.trim() || demoing) return;
    setDemoing(true);
    setDemoA(null);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: demoQ, offline: true }),
      });
      const answer = (await response.json()) as DemoAnswer;
      setDemoA(answer);
    } catch {
      setMessage("تعذر تشغيل الاختبار");
    } finally {
      setDemoing(false);
    }
  }

  const complete = status?.complete === true;
  const phase = status?.phase ?? "curriculum";
  const running = status?.running === true;
  const done = status?.aiDocs ?? 0;
  const cur = status?.curriculum ?? status?.totalTopics ?? 0;
  const libTotal = status?.libraryTotal ?? 0;
  const libDone = status?.libraryDone ?? 0;
  const percent = cur > 0 ? Math.round((done / cur) * 100) : 0;

  return (
    <div className="rounded-xl border border-mint/30 bg-panel p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint/15 font-mono text-mint">◉</span>
        <h3 className="text-lg font-bold text-fog">تدريب الذكاء الاصطناعي (Qwen)</h3>
      </div>

      <p className="mb-4 text-sm leading-7 text-dim">
        التدريب يشتغل <span className="text-mint">تلقائياً على الخادم</span> — لا يطلب منك شيئاً ولا يلمس
        جهازك. Qwen يصرّف دروساً من المنهج ومن مكتبة الكتب ويحفظها في قاعدة المعرفة حتى يكتمل كل شيء،
        ثم يتحول النموذج للإجابة وحده بدون Qwen.
      </p>

      {!status?.enabled ? (
        <div className="mb-4 rounded-lg border border-amber/30 bg-amber/10 p-3 text-sm leading-6 text-amber">
          Qwen غير مفعّل بعد — شغّل <code className="font-mono">QWEN_ENABLED=true</code> مع المفتاح في{" "}
          <code className="font-mono">.env.local</code> ثم أعد تشغيل السيرفر. (التدريب التلقائي يبدأ وحده عند التفعيل.)
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
            <div className="rounded-lg border border-linesoft bg-panel2 p-3">
              <p className="font-mono text-lg font-bold text-mint">
                {done}/{cur}
              </p>
              <p className="text-[11px] text-dim">درس مدرب من المنهج</p>
            </div>
            <div className="rounded-lg border border-linesoft bg-panel2 p-3">
              <p className="font-mono text-lg font-bold text-fog">{percent}%</p>
              <p className="text-[11px] text-dim">اكتمال المنهج</p>
            </div>
            <div className="rounded-lg border border-linesoft bg-panel2 p-3">
              <p className="truncate font-mono text-sm font-bold text-amber">
                {status.lastTrainedAt ? new Date(status.lastTrainedAt).toLocaleString("ar") : "لم يبدأ بعد"}
              </p>
              <p className="text-[11px] text-dim">آخر تدريب</p>
            </div>
          </div>

          {libTotal > 0 && (
            <div className="mb-4 rounded-lg border border-linesoft bg-panel2 px-3 py-2 text-xs leading-6 text-dim">
              مرحلة المكتبة: {libDone}/{libTotal} كتاب مشمول بدرس
              {running && <span className="mr-1 text-mint">· شغال الآن…</span>}
            </div>
          )}

          {!complete && phase === "curriculum" && status.nextTopics.length > 0 && (
            <p className="mb-4 text-xs leading-6 text-faint">
              قادم في القائمة: {status.nextTopics.map((t) => "«" + t + "»").join(" · ")}
            </p>
          )}
        </>
      )}

      {complete ? (
        <div className="rounded-lg border border-mint bg-mint/10 p-4">
          <p className="mb-1 text-lg font-bold text-mint">تم تعليم النموذج الآن ✓</p>
          <p className="mb-3 text-sm leading-6 text-dim">
            Qwen اكتمل دوره التدريبي: المنهج والمكتبة مغطاة بالدروس، والنموذج صار يجاوب وحده.
            اختبره بمحاكاة «بدون Qwen» — السؤال يجاب من معرفة النموذج فقط وبال Fallback اليدوي:
          </p>
          {!demoOpen ? (
            <button
              onClick={() => setDemoOpen(true)}
              className="rounded-lg bg-mint px-5 py-2 text-sm font-bold text-ink transition hover:bg-mintsoft"
            >
              جرّب النموذج بدون Qwen
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  value={demoQ}
                  onChange={(e) => setDemoQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void offlineTry();
                  }}
                  placeholder="اسأل النموذج الآن... مثال: شو الفرق بين الجداول والقوائم"
                  className="flex-1 rounded-lg border border-linesoft bg-panel2 px-3 py-2 text-sm text-fog outline-none focus:border-mint"
                />
                <button
                  onClick={() => void offlineTry()}
                  disabled={demoing || !demoQ.trim()}
                  className="rounded-lg bg-mint px-5 py-2 text-sm font-bold text-ink transition hover:bg-mintsoft disabled:opacity-40"
                >
                  {demoing ? "يفكر..." : "جرّب"}
                </button>
              </div>
              {demoA && (
                <div className="rounded-lg border border-linesoft bg-panel2 p-4">
                  <p className="mb-1 text-[11px] font-bold text-mint">وضع بدون Qwen — إجابة النموذج نفسه:</p>
                  {demoA.intro && <p className="mb-2 text-sm leading-7 text-fog">{demoA.intro}</p>}
                  {demoA.sections.map((s, i) => (
                    <div key={i} className="mb-3">
                      {s.heading && <p className="mb-1 text-sm font-bold text-fog">{s.heading}</p>}
                      {s.text && <p className="text-sm leading-7 text-dim">{s.text}</p>}
                      {s.code && (
                        <pre className="mt-2 overflow-x-auto rounded-lg border border-linesoft bg-ink p-3 text-left font-mono text-xs leading-6 text-mint" dir="ltr">
                          {s.code}
                        </pre>
                      )}
                    </div>
                  ))}
                  {demoA.tips.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs leading-6 text-amber">
                      {demoA.tips.map((t, i) => (
                        <li key={i}>• {t}</li>
                      ))}
                    </ul>
                  )}
                  {demoA.sources.length > 0 && (
                    <p className="mt-3 text-[10px] text-faint">المصادر: {demoA.sources.join(" · ")}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void runBatch(3)}
            disabled={busy || !status?.enabled}
            className="rounded-lg bg-mint px-5 py-2 text-sm font-bold text-ink transition hover:bg-mintsoft disabled:opacity-40"
          >
            {busy ? "يتدرب الآن..." : "درّب دفعة الآن (يدوي)"}
          </button>
          <p className="self-center text-xs text-faint">التدريب التلقائي شغال — الزر للضغط الاستعجالي فقط.</p>
        </div>
      )}

      {message && <p className="mt-3 text-sm text-danger">{message}</p>}

      {log.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <p className="mb-1 text-xs font-bold text-mint">سجل الجلسة:</p>
          {log.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg border border-line bg-panel2 px-3 py-1.5 text-xs leading-6"
            >
              <span
                className={
                  item.status === "trained"
                    ? "text-mint"
                    : item.status === "skipped"
                      ? "text-faint"
                      : "text-danger"
                }
              >
                {item.status === "trained" ? "✓" : item.status === "skipped" ? "↺" : "✗"}
              </span>
              <span className="truncate text-fog">{item.title ?? item.topic ?? "—"}</span>
              {item.error && <span className="shrink-0 text-danger">{item.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}