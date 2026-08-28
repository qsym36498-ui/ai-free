import { BOOK_SOURCES } from "@/lib/luau/books";

const KIND_STYLES: Record<string, string> = {
  كتاب: "border-amber/40 bg-amber/10 text-amber",
  موقع: "border-mint/40 bg-mint/10 text-mint",
  فيديو: "border-danger/40 bg-danger/10 text-danger",
  مرجع: "border-line bg-panel2 text-dim",
};

export default function BooksLibrary() {
  return (
    <div className="rounded-xl border border-line bg-panel p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/15 font-mono text-amber">📖</span>
        <h3 className="text-lg font-bold text-fog">مكتبة المصادر: من وين تجيب المعرفة؟</h3>
      </div>
      <p className="mb-5 text-sm leading-7 text-dim">
        هذه أفضل الكتب والمواقع والقنوات لتتعلم لواو وروبلوكس. اقرأ منها، خذ الخلاصة،
        وأطعمها للنموذج بالنموذج أعلاه — هيك بتكبر معرفته من مصادر موثوقة.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {BOOK_SOURCES.map((source) => (
          <a
            key={source.title}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg border border-linesoft bg-panel2 p-4 transition hover:border-amber/50"
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span className={"rounded border px-1.5 py-0.5 text-[9px] font-bold " + (KIND_STYLES[source.kind] ?? KIND_STYLES["مرجع"])}>
                {source.kind}
              </span>
              <h4 className="text-sm font-bold text-fog group-hover:text-amber">{source.title}</h4>
            </div>
            <p className="mb-2 text-xs leading-6 text-dim">{source.description}</p>
            <p className="text-[10px] text-faint">الأفضل لـ: {source.bestFor} ↗</p>
          </a>
        ))}
      </div>
    </div>
  );
}
