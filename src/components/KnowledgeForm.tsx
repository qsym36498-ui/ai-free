"use client";

import { useCallback, useEffect, useState } from "react";
import { getDeviceId } from "@/lib/device";

interface KnowledgeRow {
  id: number;
  title: string;
  content: string;
  tags: string;
  authorName: string;
  sourceUrl: string | null;
  sourceType: string;
  verified: boolean;
  confirmCount: number;
  disputeCount: number;
  createdAt: string;
  myVote: string | null;
}

const SOURCE_STYLES: Record<string, string> = {
  كتاب: "border-amber/40 bg-amber/10 text-amber",
  موقع: "border-mint/40 bg-mint/10 text-mint",
  فيديو: "border-danger/40 bg-danger/10 text-danger",
  تجربة: "border-line bg-panel2 text-dim",
};

export default function KnowledgeForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [code, setCode] = useState("");
  const [tags, setTags] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceType, setSourceType] = useState("موقع");
  const [authorName, setAuthorName] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [entries, setEntries] = useState<KnowledgeRow[]>([]);
  const [voting, setVoting] = useState<number | null>(null);

  const refreshEntries = useCallback(async () => {
    try {
      const response = await fetch("/api/knowledge?limit=10&device=" + encodeURIComponent(getDeviceId()));
      const data = (await response.json()) as { entries: KnowledgeRow[] };
      setEntries(data.entries);
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- جلب أولي عند التحميل
    void refreshEntries();
  }, [refreshEntries]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage("");
    try {
      const response = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, code, tags, sourceUrl, sourceType, authorName }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "تعذر الحفظ");
        return;
      }
      setStatus("saved");
      setTitle("");
      setContent("");
      setCode("");
      setTags("");
      setSourceUrl("");
      void refreshEntries();
      setTimeout(() => setStatus("idle"), 4000);
    } catch {
      setStatus("error");
      setErrorMessage("انقطع الاتصال");
    }
  }

  async function vote(entryId: number, nextVote: "confirm" | "dispute") {
    setVoting(entryId);
    try {
      await fetch("/api/knowledge/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, deviceId: getDeviceId(), vote: nextVote }),
      });
      await refreshEntries();
    } finally {
      setVoting(null);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-fog outline-none transition placeholder:text-faint focus:border-mint/60";

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <form onSubmit={submit} className="rounded-xl border border-line bg-panel p-6 lg:col-span-3">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/15 font-mono text-amber">✚</span>
          <h3 className="text-lg font-bold text-fog">علّمني من الكتب والإنترنت</h3>
        </div>
        <p className="mb-5 text-sm leading-7 text-dim">
          اقرأ من مكتبة المصادر بالأسفل، خذ الخلاصة وأطعمني إياها. اللاعبون الثانيون
          يؤكدون أو يعترضون — والمعلومة الموثقة تصير أقوى في إجاباتي.
        </p>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="عنوان المعلومة (مثلاً: طريقة استعمال ProximityPrompt)"
              className={inputClass}
              required
              minLength={4}
            />
            <input
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder="اسمك (اختياري)"
              className={inputClass}
            />
          </div>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="الشرح الكامل — ماذا تعلمت؟ كيف تعمل الميزة؟ ما التفاصيل الصغيرة؟"
            rows={5}
            className={inputClass}
            required
            minLength={20}
          />
          <textarea
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="كود مثال (اختياري) — الصق كود لواو هنا"
            rows={4}
            dir="ltr"
            className={inputClass + " font-mono text-xs"}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value)}
              className={inputClass}
            >
              <option value="موقع">من موقع</option>
              <option value="كتاب">من كتاب</option>
              <option value="فيديو">من فيديو</option>
              <option value="تجربة">من تجربتي</option>
            </select>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="وسوم: برومبت, تفاعل, زر"
              className={inputClass}
            />
            <input
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="رابط المصدر (اختياري)"
              dir="ltr"
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={status === "saving"}
              className="rounded-lg bg-amber px-5 py-2 text-sm font-bold text-ink transition hover:bg-embersoft disabled:opacity-40"
            >
              {status === "saving" ? "يتعلم الآن..." : "أطعمني هذه المعرفة"}
            </button>
            {status === "saved" && (
              <span className="text-sm text-mint">✓ دخلت المعرفة في دماغي فوراً!</span>
            )}
            {status === "error" && <span className="text-sm text-danger">{errorMessage}</span>}
          </div>
        </div>
      </form>

      {/* قائمة المعارف مع التأكيد والنقض */}
      <div className="rounded-xl border border-line bg-panel p-6 lg:col-span-2">
        <h3 className="mb-1 text-lg font-bold text-fog">آخر ما تعلمته</h3>
        <p className="mb-4 text-xs leading-5 text-dim">
          أكد ✓ ما تراه صحيحاً واعترض على الخطأ — التوثيق يرفع وزن المعلومة في بحثي.
        </p>
        {entries.length === 0 ? (
          <p className="text-sm leading-7 text-dim">
            لم يعلمني أحد شيئاً بعد — كن أول من يضيف معرفة!
          </p>
        ) : (
          <ul className="max-h-[540px] space-y-3 overflow-y-auto pl-1">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-linesoft bg-panel2 p-3">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-bold text-fog">{entry.title}</p>
                  {entry.verified && (
                    <span className="rounded border border-mint/40 bg-mint/10 px-1.5 py-0.5 text-[9px] font-bold text-mint">
                      موثقة ✓
                    </span>
                  )}
                  <span className={"rounded border px-1.5 py-0.5 text-[9px] " + (SOURCE_STYLES[entry.sourceType] ?? SOURCE_STYLES["تجربة"])}>
                    {entry.sourceType}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs leading-6 text-dim">{entry.content}</p>
                <p className="mt-1.5 text-[10px] text-faint">
                  بواسطة {entry.authorName}
                  {entry.tags ? " · " + entry.tags : ""}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => vote(entry.id, "confirm")}
                    disabled={voting === entry.id}
                    className={
                      "rounded border px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-40 " +
                      (entry.myVote === "confirm"
                        ? "border-mint bg-mint/20 text-mint"
                        : "border-line text-dim hover:border-mint/50 hover:text-mint")
                    }
                  >
                    ✓ أؤكد ({entry.confirmCount})
                  </button>
                  <button
                    onClick={() => vote(entry.id, "dispute")}
                    disabled={voting === entry.id}
                    className={
                      "rounded border px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-40 " +
                      (entry.myVote === "dispute"
                        ? "border-danger bg-danger/20 text-danger"
                        : "border-line text-dim hover:border-danger/50 hover:text-danger")
                    }
                  >
                    ✗ أعترض ({entry.disputeCount})
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
