"use client";

import { useMemo, useState, type ReactNode } from "react";

const KEYWORDS = new Set([
  "local", "function", "end", "if", "then", "else", "elseif", "return",
  "for", "while", "do", "repeat", "until", "in", "and", "or", "not",
  "true", "false", "nil", "break", "continue", "type", "export", "self",
]);

const BUILTINS = new Set([
  "game", "workspace", "script", "print", "warn", "error", "assert",
  "pcall", "xpcall", "require", "pairs", "ipairs", "next", "select",
  "tostring", "tonumber", "typeof", "task", "wait", "table", "string",
  "math", "os", "Instance", "Enum", "Vector3", "Vector2", "CFrame",
  "Color3", "UDim2", "UDim", "TweenInfo", "Ray", "Random",
]);

const MASTER =
  /(--[^\n]*)|("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_][A-Za-z0-9_]*\b)|(\s+|.)/g;

function highlightLine(line: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let match: RegExpExecArray | null;
  let key = 0;
  MASTER.lastIndex = 0;
  while ((match = MASTER.exec(line)) !== null) {
    const [, comment, str, num, word, other] = match;
    if (comment !== undefined) {
      nodes.push(
        <span key={key++} className="tok-cm">
          {comment}
        </span>
      );
    } else if (str !== undefined) {
      nodes.push(
        <span key={key++} className="tok-str">
          {str}
        </span>
      );
    } else if (num !== undefined) {
      nodes.push(
        <span key={key++} className="tok-num">
          {num}
        </span>
      );
    } else if (word !== undefined) {
      if (KEYWORDS.has(word)) {
        nodes.push(
          <span key={key++} className="tok-kw">
            {word}
          </span>
        );
      } else if (BUILTINS.has(word)) {
        nodes.push(
          <span key={key++} className="tok-bi">
            {word}
          </span>
        );
      } else {
        // لو بعده قوس افتتاح = استدعاء دالة
        const rest = line.slice(MASTER.lastIndex);
        if (/^\s*\(/.test(rest)) {
          nodes.push(
            <span key={key++} className="tok-fn">
              {word}
            </span>
          );
        } else {
          nodes.push(<span key={key++}>{word}</span>);
        }
      }
    } else if (other !== undefined) {
      nodes.push(<span key={key++}>{other}</span>);
    }
    if (match.index === MASTER.lastIndex) MASTER.lastIndex++;
  }
  return nodes;
}

export default function CodeBlock({
  code,
  title,
}: {
  code: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => code.replace(/\t/g, "  ").split("\n"), [code]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-[#0c1310]">
      <div className="flex items-center justify-between border-b border-linesoft bg-panel px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5">
            <i className="h-2.5 w-2.5 rounded-full bg-danger/70" />
            <i className="h-2.5 w-2.5 rounded-full bg-amber/70" />
            <i className="h-2.5 w-2.5 rounded-full bg-mint/70" />
          </span>
          <span className="font-mono text-[11px] text-dim" dir="ltr">
            {title ?? "script.luau"}
          </span>
        </div>
        <button
          onClick={copy}
          className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-dim transition hover:border-mint/50 hover:text-mint"
        >
          {copied ? "✓ نُسخ" : "نسخ الكود"}
        </button>
      </div>
      <pre className="code-ltr max-h-[460px] overflow-auto p-4 font-mono text-[12.5px] leading-6 text-fog">
        {lines.map((line, index) => (
          <div key={index} className="flex">
            <span className="w-8 shrink-0 select-none pr-3 text-left text-faint">
              {index + 1}
            </span>
            <span className="whitespace-pre">{highlightLine(line)}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}
