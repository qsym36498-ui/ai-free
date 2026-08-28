import type { Metadata } from "next";
import Link from "next/link";
import LessonFinder from "@/components/LessonFinder";
import { BUILTIN_DOCS } from "@/lib/luau/corpus";
import type { LessonLevel } from "@/lib/luau/types";

export const metadata: Metadata = {
  title: "الدروس — عقل لواو",
  description: "منهاج لواو كامل من الصفر: دروس مكتوبة يدوياً بالتفاصيل الكبيرة والصغيرة.",
};

const LEVELS: { level: LessonLevel; description: string }[] = [
  { level: "مبتدئ", description: "من الصفر تماماً: المتغيرات، الشروط، الحلقات، الجداول، وأساسيات روبلوكس." },
  { level: "متوسط", description: "الدوال المتقدمة، الأحداث، الريموتات، الداتا ستور، التوين، والواجهات." },
  { level: "متقدم", description: "الميتا تيبل، الأنواع، المسارات الذكية، الأمان ضد المخترقين، والوسوم." },
];

const LEVEL_COLORS: Record<LessonLevel, string> = {
  مبتدئ: "border-mint/40 bg-mint/10 text-mint",
  متوسط: "border-amber/40 bg-amber/10 text-amber",
  متقدم: "border-danger/40 bg-danger/10 text-danger",
};

export default function LessonsPage() {
  const lessons = BUILTIN_DOCS.filter((doc) => doc.kind === "lesson");
  const references = BUILTIN_DOCS.filter((doc) => doc.kind === "reference");

  return (
    <div className="bg-grid min-h-screen">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-10">
          <h1 className="mb-2 text-3xl font-bold text-fog">منهاج لواو الكامل</h1>
          <p className="max-w-2xl leading-8 text-dim">
            {lessons.length} درساً و {references.length} مراجع، كلها مكتوبة يدوياً بتفاصيلها
            الكبيرة والصغيرة — مع كود جاهز للتجربة في كل درس. ابدأ من المبتدئ وتدرّج، أو
            ابحث مباشرة عن أي موضوع.
          </p>
        </div>

        <LessonFinder
          items={BUILTIN_DOCS.map((doc) => ({
            id: doc.id,
            title: doc.title,
            summary: doc.summary,
            level: doc.level,
            kind: doc.kind,
            tags: doc.tags,
          }))}
        />

        {LEVELS.map(({ level, description }) => {
          const levelLessons = lessons.filter((lesson) => lesson.level === level);
          return (
            <section key={level} className="mb-10">
              <div className="mb-4 flex items-center gap-3">
                <span className={"rounded-full border px-3 py-1 text-xs font-bold " + LEVEL_COLORS[level]}>
                  مستوى {level}
                </span>
                <p className="text-sm text-dim">{description}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {levelLessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={"/lessons/" + lesson.id}
                    className="group rounded-xl border border-line bg-panel p-4 transition hover:-translate-y-0.5 hover:border-mint/50"
                  >
                    <h3 className="mb-1.5 font-bold text-fog group-hover:text-mint">{lesson.title}</h3>
                    <p className="line-clamp-2 text-xs leading-6 text-dim">{lesson.summary}</p>
                    <p className="mt-2 font-mono text-[10px] text-faint">
                      {lesson.code ? "✓ فيه كود جاهز" : "شرح نظري"} · {lesson.tags.length} كلمة مفتاحية
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full border border-line bg-panel2 px-3 py-1 text-xs font-bold text-fog">
              مراجع سريعة
            </span>
            <p className="text-sm text-dim">بطاقات مرجعية للقيم والدوال التي تحتاجها باستمرار.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {references.map((reference) => (
              <Link
                key={reference.id}
                href={"/lessons/" + reference.id}
                className="group rounded-xl border border-line bg-panel p-4 transition hover:border-amber/50"
              >
                <h3 className="mb-1 text-sm font-bold text-fog group-hover:text-amber">{reference.title}</h3>
                <p className="line-clamp-2 text-xs leading-6 text-dim">{reference.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
