"use client";

import { useEffect, useState } from "react";

interface Stats {
  level: number;
  levelName: string;
  xp: number;
  nextLevelXp: number;
  contributions: number;
  deviceTokens: number;
  userEntries: number;
  nodes: number;
  networkTokens: number;
  builtinDocs: number;
  builtinTokens: number;
  crawledDocs: number;
  crawledTokens: number;
  languages: number;
  knowledgeBookCount: number;
  bookTokens: number;
  templates: number;
}

export default function StatsBar({ detailed = false }: { detailed?: boolean }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/stats")
      .then((response) => {
        if (!response.ok) throw new Error("bad status");
        return response.json();
      })
      .then((data: Stats) => {
        if (alive) setStats(data);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!stats) {
    return (
      <div
        role="status"
        className={
          "rounded-xl border bg-panel p-4 font-mono text-xs " +
          (failed ? "border-danger/40 text-danger" : "border-line text-faint")
        }
      >
        {failed
          ? "تعذر تحميل إحصاءات النموذج — تحقق من الاتصال وحدّث الصفحة."
          : "يحمّل إحصاءات النموذج..."}
      </div>
    );
  }

  const items = detailed
    ? [
        { label: "مستوى النموذج", value: `${stats.level} — ${stats.levelName}`, accent: true },
        { label: "نقاط الخبرة", value: `${stats.xp} / ${stats.nextLevelXp} XP` },
        { label: "دروس ومرجعيات مدمجة", value: String(stats.builtinDocs) },
        { label: "قوالب أنظمة كاملة", value: String(stats.templates) },
        { label: "معارف من اللاعبين", value: String(stats.userEntries) },
        { label: "مساهمات تدريب الأجهزة", value: String(stats.contributions) },
        { label: "عقد تدريب في الشبكة", value: String(stats.nodes) },
        { label: "توكن عالجتها الشبكة", value: stats.networkTokens.toLocaleString("en") },
        { label: "توكن معالج إجمالاً", value: stats.deviceTokens.toLocaleString("en") },
        { label: "صفحات قرأها من الإنترنت", value: String(stats.crawledDocs) },
        { label: "توكن تعلمها من الويب", value: stats.crawledTokens.toLocaleString("en") },
        { label: "لغات أضافها اللاعبون", value: String(stats.languages) },
        { label: "كتب معرفة أضافوها", value: String(stats.knowledgeBookCount) },
        { label: "توكن كل الكتب", value: stats.bookTokens.toLocaleString("en") },
        { label: "حجم المعرفة المدمجة", value: stats.builtinTokens.toLocaleString("en") + " توكن" },
      ]
    : [
        { label: "مستوى النموذج", value: `${stats.level} · ${stats.levelName}`, accent: true },
        { label: "درس ومرجع", value: String(stats.builtinDocs) },
        { label: "نظام جاهز للتوليد", value: String(stats.templates) },
        { label: "عقدة تدريب بالشبكة", value: String(stats.nodes) },
      ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={
            "rounded-xl border p-4 " +
            (item.accent ? "border-mint/40 bg-mint/5" : "border-line bg-panel")
          }
        >
          <p className={"font-mono text-sm font-bold " + (item.accent ? "text-mint" : "text-fog")}>
            {item.value}
          </p>
          <p className="mt-1 text-[11px] text-dim">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
