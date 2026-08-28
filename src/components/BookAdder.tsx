"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fileToText } from "@/lib/clientFiles";

interface BookRow {
  id: number;
  name: string;
  description: string;
  tokens: number;
  authorName: string;
  chars: number;
}

/** قسم كتب المعارف العامة — غير البرمجة: ذكاء اصطناعي، علوم، تاريخ، أي شيء */
export default function BookAdder() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [pasted, setPasted] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileContent, setFileContent] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [books, setBooks] = useState<BookRow[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/books");
      const data = (await response.json()) as { books: BookRow[] };
      setBooks(data.books);
    } catch {
      /* نتجاهل */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- جلب أولي عند التحميل
    void refresh();
  }, [refresh]);

  async function onFilePicked(file: File | null) {
    if (!file) return;
    setFileName(file.name);
    setFileSize(file.size);
    setStatus(null);
    setFileContent("");
    setExtracting(true);
    try {
      const text = await fileToText(file);
      setFileContent(text);
      setStatus({ kind: "ok", text: "استُخرج " + text.length.toLocaleString("en") + " حرف من ملفك على جهازك ✓" });
    } catch {
      setStatus({
        kind: "error",
        text: "تعذر استخراج الـ PDF على جهازك (قد يكون صوراً بدون نص) — الصق النص يدوياً بالأسفل.",
      });
    } finally {
      setExtracting(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          tags,
          authorName,
          content: pasted.trim() ? pasted : fileContent,
        }),
      });
      const data = (await response.json()) as { ok: boolean; message?: string; error?: string };
      if (!data.ok) {
        setStatus({ kind: "error", text: data.error ?? "تعذر الإضافة" });
      } else {
        setStatus({ kind: "ok", text: data.message ?? "تمت الإضافة!" });
        setName("");
        setDescription("");
        setTags("");
        setPasted("");
        if (fileRef.current) fileRef.current.value = "";
        setFileName("");
        setFileContent("");
        void refresh();
      }
    } catch {
      setStatus({ kind: "error", text: "انقطع الاتصال — حاول مجدداً." });
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-fog outline-none transition placeholder:text-faint focus:border-amber/60";

  return (
    <div className="rounded-xl border border-amber/30 bg-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber/15 font-mono text-lg text-amber">📚</span>
          <div>
            <h3 className="text-lg font-bold text-fog">كتب المعارف: أي كتاب يطور الموقع</h3>
            <p className="text-xs text-dim">ذكاء اصطناعي، علوم، تاريخ، فلسفة... أي معرفة تجعله أذكى</p>
          </div>
        </div>
        <button
          onClick={() => setOpen((value) => !value)}
          className={
            "rounded-lg px-5 py-2.5 text-sm font-bold transition " +
            (open
              ? "border border-line bg-panel2 text-fog hover:border-danger/50"
              : "bg-amber text-ink hover:bg-embersoft")
          }
        >
          {open ? "إغلاق" : "＋ ضيف أي كتاب أو معلومة جديدة"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="rise-in mt-5 space-y-3 border-t border-linesoft pt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="اسم الكتاب أو الموضوع (مثلاً: أساسيات الذكاء الاصطناعي)"
              className={inputClass}
              required
              minLength={2}
            />
            <input
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder="اسمك (اختياري)"
              className={inputClass}
            />
          </div>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="عن ماذا يتحدث الكتاب؟ (سطر واحد)"
            className={inputClass}
          />

          <div className="rounded-lg border border-dashed border-line bg-panel2 p-4 text-center">
            <p className="mb-2 text-sm font-bold text-fog">ارفع الكتاب أو المعلومة</p>
            <p className="mb-3 text-xs text-dim">
              PDF أو TXT أو MD — كتاب كامل أو حتى معلومة واحدة طويلة
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md,.text,application/pdf,text/plain"
              onChange={(event) => void onFilePicked(event.target.files?.[0] ?? null)}
              className="mx-auto block text-xs text-dim file:ml-3 file:rounded-lg file:border-0 file:bg-amber file:px-4 file:py-2 file:text-xs file:font-bold file:text-ink"
            />
            {fileName && (
              <p className="mt-2 font-mono text-[11px] text-amber" dir="ltr">
                {fileName} · {(fileSize / 1024).toFixed(0)} KB
              </p>
            )}
            <p className="mt-2 text-[11px] text-faint">— أو —</p>
            <textarea
              value={pasted}
              onChange={(event) => setPasted(event.target.value)}
              placeholder="أو الصق نص الكتاب / المعلومة الكاملة هنا..."
              rows={6}
              className={inputClass + " mt-2 text-xs"}
            />
          </div>

          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="وسوم: ذكاء اصطناعي, تعلم آلة, شبكات عصبية"
            className={inputClass}
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy || extracting}
              className="rounded-lg bg-amber px-6 py-2.5 text-sm font-bold text-ink transition hover:bg-embersoft disabled:opacity-40"
            >
              {busy ? "يُعالج الكتاب ويدخله الدماغ..." : "أضف الكتاب ودرّب النموذج عليه"}
            </button>
            {status && (
              <p className={"text-sm " + (status.kind === "ok" ? "text-mint" : "text-danger")}>
                {status.kind === "ok" ? "✓ " : ""}
                {status.text}
              </p>
            )}
          </div>
        </form>
      )}

      <div className="mt-5">
        <p className="mb-2 text-xs font-bold text-amber">كتب المعرفة اللي صارت بداخله ({books.length})</p>
        {books.length === 0 ? (
          <p className="text-sm text-dim">
            لا كتب معرفة بعد — كتابك عن الذكاء الاصطناعي ينتظر مكانه هنا!
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {books.map((book) => (
              <li key={book.id} className="rounded-lg border border-linesoft bg-panel2 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-amber">{book.name}</p>
                  <span className="font-mono text-[10px] text-dim">
                    {book.tokens.toLocaleString("en")} توكن
                  </span>
                </div>
                {book.description && (
                  <p className="mt-1 line-clamp-1 text-xs text-dim">{book.description}</p>
                )}
                <p className="mt-1 text-[10px] text-faint">
                  أضافه {book.authorName} · {(book.chars / 1000).toFixed(0)} ألف حرف · يتدرب عليه ✓
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
