"use client";

import CodeBlock from "./CodeBlock";
import type { EngineAnswer } from "@/lib/luau/types";

export default function AnswerView({ answer }: { answer: EngineAnswer }) {
  return (
    <div className="space-y-4">
      <p className="whitespace-pre-wrap leading-8 text-fog">{answer.intro}</p>

      {answer.sections.map((section, index) => (
        <div key={index} className="space-y-2">
          {section.heading && (
            <h4 className="flex items-center gap-2 text-sm font-bold text-amber">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber" />
              {section.heading}
            </h4>
          )}
          {section.text && (
            <p className="whitespace-pre-wrap text-sm leading-7 text-fog/90">{section.text}</p>
          )}
          {section.code && <CodeBlock code={section.code} title={section.fileName} />}
        </div>
      ))}

      {answer.tips.length > 0 && (
        <div className="rounded-lg border border-mint/20 bg-mint/5 p-3">
          <p className="mb-1.5 text-xs font-bold text-mint">نصائح عقل لواو</p>
          <ul className="space-y-1 text-sm leading-6 text-fog/85">
            {answer.tips.map((tip, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-mint">◆</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {answer.sources.length > 0 && (
        <p className="text-[11px] text-faint">
          المصادر: {answer.sources.join(" · ")}
        </p>
      )}

      {answer.followUps.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {answer.followUps.map((followUp, index) => (
            <span
              key={index}
              className="rounded-full border border-line bg-panel px-3 py-1 text-xs text-dim"
            >
              جرّب: {followUp}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
