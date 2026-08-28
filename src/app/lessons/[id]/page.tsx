import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CodeBlock from "@/components/CodeBlock";
import { BUILTIN_DOCS } from "@/lib/luau/corpus";

export function generateStaticParams() {
  return BUILTIN_DOCS.map((doc) => ({ id: doc.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const doc = BUILTIN_DOCS.find((d) => d.id === id);
  return {
    title: doc ? doc.title + " — عقل لواو" : "درس غير موجود",
    description: doc?.summary,
  };
}

const LEVEL_BADGE: Record<string, string> = {
  مبتدئ: "border-mint/40 bg-mint/10 text-mint",
  متوسط: "border-amber/40 bg-amber/10 text-amber",
  متقدم: "border-danger/40 bg-danger/10 text-danger",
};

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = BUILTIN_DOCS.find((d) => d.id === id);
  if (!doc) notFound();

  const index = BUILTIN_DOCS.indexOf(doc);
  const previous = index > 0 ? BUILTIN_DOCS[index - 1] : null;
  const next = index < BUILTIN_DOCS.length - 1 ? BUILTIN_DOCS[index + 1] : null;

  return (
    <div className="bg-grid min-h-screen">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <nav className="mb-6 flex items-center gap-2 text-xs text-dim">
          <Link href="/lessons" className="hover:text-mint">الدروس</Link>
          <span>←</span>
          <span className="text-fog">{doc.title}</span>
        </nav>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={"rounded-full border px-3 py-1 text-xs font-bold " + (LEVEL_BADGE[doc.level] ?? LEVEL_BADGE["مبتدئ"])}>
            مستوى {doc.level}
          </span>
          <span className="rounded-full border border-line bg-panel px-3 py-1 text-xs text-dim">
            {doc.kind === "lesson" ? "درس" : "مرجع سريع"}
          </span>
        </div>

        <h1 className="mb-3 text-3xl font-bold leading-snug text-fog">{doc.title}</h1>
        <p className="mb-8 text-sm leading-7 text-mintsoft">{doc.summary}</p>

        <article className="space-y-5">
          {doc.content.map((paragraph, paragraphIndex) => (
            <div
              key={paragraphIndex}
              className="rounded-xl border border-line bg-panel p-5 text-[15px] leading-8 text-fog/90"
            >
              <span className="ml-2 font-mono text-xs text-mint/70">{paragraphIndex + 1}.</span>
              {paragraph}
            </div>
          ))}

          {doc.code && (
            <div>
              <h2 className="mb-2 text-lg font-bold text-amber">الكود الجاهز للتجربة</h2>
              <CodeBlock code={doc.code} title={doc.id + ".luau"} />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {doc.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-line bg-panel2 px-3 py-1 text-xs text-dim">
                {tag}
              </span>
            ))}
          </div>
        </article>

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-6">
          {previous ? (
            <Link href={"/lessons/" + previous.id} className="group max-w-[45%] text-sm">
              <span className="block text-[11px] text-dim">السابق</span>
              <span className="font-bold text-fog group-hover:text-mint">{previous.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={"/lessons/" + next.id} className="group max-w-[45%] text-left text-sm">
              <span className="block text-[11px] text-dim">التالي</span>
              <span className="font-bold text-fog group-hover:text-mint">{next.title}</span>
            </Link>
          ) : (
            <Link href="/chat" className="text-sm font-bold text-amber">
              أنهيت المنهاج — جرب المساعد ←
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
