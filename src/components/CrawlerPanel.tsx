"use client";

import { useCallback, useEffect, useState } from "react";
import { readFlag, setFlag } from "@/lib/clientTrainer";

interface CrawlPage {
  id: number;
  url: string;
  origin: string;
  title: string;
  status: string;
  tokens: number;
}

interface CrawlState {
  pages: CrawlPage[];
  doneCount: number;
  totalTokens: number;
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  pending: { text: "بالانتظار", cls: "border-line text-dim" },
  reading: { text: "يقرأ الآن...", cls: "border-amber/50 text-amber" },
  done: { text: "تمت القراءة ✓", cls: "border-mint/50 text-mint" },
  failed: { text: "تعذر الوصول", cls: "border-danger/40 text-danger" },
};

export default function CrawlerPanel() {
  const [state, setState] = useState<CrawlState | null>(null);
  const [auto, setAuto] = useState(false);
  const [nodeOn, setNodeOn] = useState(false);
  const [lastRead, setLastRead] = useState<string | null>(null);

  const refreshFlags = useCallback(() => {
    setAuto(readFlag("crawl"));
    setNodeOn(readFlag("node"));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/crawl");
      setState((await response.json()) as CrawlState);
    } catch {
      /* نتجاهل */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- مزامنة أولية للأعلام والحالة
    refreshFlags();
    void refresh();
    window.addEventListener("luau-flags-changed", refreshFlags);
    const timer = setInterval(() => void refresh(), 6000);
    return () => {
      window.removeEventListener("luau-flags-changed", refreshFlags);
      clearInterval(timer);
    };
  }, [refresh, refreshFlags]);

  const tick = useCallback(async () => {
    try {
      const response = await fetch("/api/crawl/tick", { method: "POST" });
      const result = (await response.json()) as {
        ok: boolean;
        done: boolean;
        title?: string;
        tokens?: number;
      };
      if (result.title) {
        setLastRead("قرأ للتو: " + result.title + " (+" + (result.tokens ?? 0) + " توكن)");
      }
      await refresh();
      return result;
    } catch {
      return { ok: false, done: false } as const;
    }
  }, [refresh]);

  const active = auto || nodeOn;

  return (
    <div className="space-y-6">
      <FreeSearchBox />

      <div className="rounded-xl border border-line bg-panel p-6">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint/15 font-mono text-mint">🕮</span>
            <h3 className="text-lg font-bold text-fog">الزاحف الذاتي: يقرأ الكتب والمراجع من الإنترنت</h3>
          </div>
          {active && (
            <span className="flex items-center gap-1.5 text-xs text-mint">
              <span className="h-1.5 w-1.5 rounded-full bg-mint pulse-dot" />
              يبحث ويقرأ بكل الصفحات
            </span>
          )}
        </div>
        <p className="mb-4 text-sm leading-7 text-dim">
          النموذج يجلب صفحات كتب مجانية ومنصات تعلم (مرجع Lua الرسمي، فصول Programming in
          Lua، ويكي الكتب، موقع لواو...)، يستخرج النص ويدخله في دماغه — بدون أي API.
          شغّله هنا ويستمر بالعمل حتى تطلع من هالصفحة — عامل الخلفية يتابع عنه.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setFlag("crawl", !auto)}
            className={
              "rounded-lg px-5 py-2 text-sm font-bold transition " +
              (active
                ? "bg-danger/90 text-ink hover:bg-danger"
                : "bg-mint text-ink hover:bg-mintsoft")
            }
          >
            {auto ? "⏹ أوقف البحث الذاتي" : "▶ شغّل البحث الذاتي الدائم"}
          </button>
          <button
            onClick={() => void tick()}
            className="rounded-lg border border-line bg-panel2 px-5 py-2 text-sm text-fog transition hover:border-mint/50"
          >
            اقرأ صفحة واحدة الآن
          </button>
          {lastRead && <span className="text-xs text-mintsoft">{lastRead}</span>}
        </div>

        {state && (
          <>
            <p className="mb-3 font-mono text-xs text-dim">
              قرأ {state.doneCount} من {state.pages.length} صفحة · تعلّم{" "}
              {state.totalTokens.toLocaleString("en")} توكن من الإنترنت
            </p>
            <ul className="max-h-72 space-y-1.5 overflow-y-auto pl-1">
              {state.pages.map((page) => {
                const status = STATUS_LABEL[page.status] ?? STATUS_LABEL["pending"];
                return (
                  <li
                    key={page.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-linesoft bg-panel2 px-3 py-2 text-xs"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-fog">{page.origin}</span>
                      {page.title && page.status === "done" && (
                        <span className="block truncate text-[10px] text-dim" dir="ltr">
                          {page.title}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {page.tokens > 0 && (
                        <span className="font-mono text-mint">{page.tokens.toLocaleString("en")}</span>
                      )}
                      <span className={"rounded border px-2 py-0.5 text-[10px] font-bold " + status.cls}>
                        {status.text}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

/** بحث حر: اكتب أي موضوع والنموذج يبحث عنه بالإنترنت ويتعلمه فوراً */
function FreeSearchBox() {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function search() {
    const trimmed = query.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setResult("يبحث بالإنترنت ويقرأ...");
    try {
      const response = await fetch("/api/websearch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = (await response.json()) as {
        message?: string;
        learned?: { title: string; origin: string }[];
      };
      setResult(
        (data.message ?? "") +
          ((data.learned ?? []).length > 0
            ? " — " + (data.learned ?? []).map((l) => l.title).join(" · ")
            : "")
      );
    } catch {
      setResult("تعذر البحث — حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-amber/30 bg-panel p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/15 font-mono text-amber">🔎</span>
        <h3 className="text-lg font-bold text-fog">بحث حر: علّمه أي موضوع من الإنترنت</h3>
      </div>
      <p className="mb-4 text-sm leading-7 text-dim">
        اكتب أي شيء — حتى خارج برمجة روبلوكس — والنموذج يسأل ويكيبيديا (عربي وإنجليزي)
        ويقرأ أول نتائج DuckDuckGo، ثم يحفظ ما تعلمه ويجيبك عنه في المساعد. كل هذا من
        سيرفر Node.js مباشرة، بدون أي مفتاح API.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="مثلاً: المقلوبة، الذكاء الاصطناعي، تاريخ القدس..."
          className="min-w-52 flex-1 rounded-lg border border-line bg-panel2 px-4 py-2 text-sm text-fog outline-none placeholder:text-faint focus:border-amber/60"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-amber px-5 py-2 text-sm font-bold text-ink transition hover:bg-embersoft disabled:opacity-40"
        >
          {busy ? "يبحث ويقرأ..." : "ابحث وتعلم"}
        </button>
      </form>
      {result && <p className="mt-3 text-xs leading-6 text-embersoft">{result}</p>}
    </div>
  );
}
