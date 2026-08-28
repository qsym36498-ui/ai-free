"use client";

import { useState } from "react";
import CodeBlock from "./CodeBlock";
import type { CodeTemplate } from "@/lib/luau/types";

export default function TemplateCard({ template }: { template: CodeTemplate }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel transition hover:border-mint/40">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-3 p-5 text-right"
      >
        <div>
          <h3 className="mb-1 font-bold text-fog">{template.title}</h3>
          <p className="text-sm leading-6 text-dim">{template.description}</p>
        </div>
        <span
          className={
            "mt-1 shrink-0 rounded-full border px-3 py-1 font-mono text-xs transition " +
            (open
              ? "border-mint/50 bg-mint/10 text-mint"
              : "border-line bg-panel2 text-dim")
          }
        >
          {open ? "إخفاء الكود" : "عرض الكود"}
        </span>
      </button>

      {open && (
        <div className="rise-in space-y-4 border-t border-linesoft p-5">
          <p className="rounded-lg border border-amber/25 bg-amber/10 px-3 py-2 text-xs leading-6 text-embersoft">
            📍 {template.placement}
          </p>

          {template.scripts.map((script, index) => (
            <div key={index} className="space-y-1.5">
              <p className="text-xs font-bold text-mint">
                {script.scriptType} — {script.name}
                <span className="mr-2 font-normal text-dim">({script.location})</span>
              </p>
              <CodeBlock code={script.code} title={script.name + ".luau"} />
            </div>
          ))}

          <div className="rounded-lg border border-linesoft bg-panel2 p-3">
            <p className="mb-1.5 text-xs font-bold text-amber">ملاحظات مهمة</p>
            <ul className="space-y-1 text-xs leading-6 text-dim">
              {template.notes.map((note, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-amber">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
