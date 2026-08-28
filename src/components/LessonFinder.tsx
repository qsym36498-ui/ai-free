"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { normalizeArabic } from "@/lib/luau/text";

export interface FinderItem {
  id: string;
  title: string;
  summary: string;
  level: string;
  kind: string;
  tags: string[];
}

export default function LessonFinder({ items }: { items: FinderItem[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalizedQuery = normalizeArabic(query.trim());
    if (normalizedQuery.length < 2) return [];
    const parts = normalizedQuery.split(/\s+/).filter(Boolean);
    return items
      .map((item) => {
        const haystack = normalizeArabic(
          item.title + " " + item.summary + " " + item.tags.join(" ")
        );
        let hits = 0;
        for (const part of parts) {
          if (haystack.includes(part)) hits++;
        }
        return { item, hits };
      })
      .filter((entry) => entry.hits === parts.length || (parts.length === 1 && entry.hits > 0))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 12)
      .map((entry) => entry.item);
  }, [query, items]);

  return (
    <div className="mb-10 rounded-xl border border-mint/30 bg-panel p-5">
      <label className="mb-2 block text-sm font-bold text-fog">
        🔍 بحث سريع في كل الدروس والمراجع
      </label>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder='اكتب أي كلمة: "ريموت"، "داتا ستور"، "ميتا"، "واجهة"...'
        className="w-full rounded-lg border border-line bg-panel2 px-4 py-2.5 text-sm text-fog outline-none transition placeholder:text-faint focus:border-mint/60"
      />

      {query.trim().length >= 2 && (
        <div className="mt-3">
          {results.length === 0 ? (
            <p className="text-sm text-dim">
              ما لقيت شي بهذا الاسم — جرب كلمة ثانية، أو اسأل المساعد الذكي مباشرة.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {results.map((item) => (
                <Link
                  key={item.id}
                  href={"/lessons/" + item.id}
                  className="rounded-lg border border-linesoft bg-panel2 p-3 transition hover:border-mint/50"
                >
                  <p className="mb-0.5 text-sm font-bold text-fog">{item.title}</p>
                  <p className="line-clamp-1 text-xs text-dim">{item.summary}</p>
                  <p className="mt-1 text-[10px] text-faint">
                    {item.kind === "lesson" ? "درس" : "مرجع"} · مستوى {item.level}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
