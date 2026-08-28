"use client";

import { useEffect, useRef, useState } from "react";
import AnswerView from "./AnswerView";
import type { EngineAnswer } from "@/lib/luau/types";

interface Message {
  role: "user" | "model";
  text?: string;
  answer?: EngineAnswer;
}

const STARTERS = [
  "اكتب لي نظام نقاط وذهب",
  "كيف أحفظ بيانات اللاعب بين الجلسات؟",
  "اصنع زومبي يلاحق أقرب لاعب",
  "اشرح لي الميتا تيبل بالتفصيل",
  "كيف أحمي لعبتي من المخترقين؟",
  "منصة متحركة ذهاباً وإياباً",
];

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [teaching, setTeaching] = useState(false);
  const [teachStatus, setTeachStatus] = useState<string | null>(null);
  const lastQuestionRef = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, teachStatus]);

  async function fetchAnswer(question: string): Promise<EngineAnswer> {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    return (await response.json()) as EngineAnswer;
  }

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || thinking || teaching) return;
    lastQuestionRef.current = trimmed;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setThinking(true);
    try {
      const answer = await fetchAnswer(trimmed);
      setMessages((prev) => [...prev, { role: "model", answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "انقطع الاتصال مؤقتاً — أعد المحاولة." },
      ]);
    } finally {
      setThinking(false);
    }
  }

  /** يبحث بالإنترنت عن آخر سؤال ويتعلمه ثم يجيب فوراً */
  async function teachFromWeb() {
    const question = lastQuestionRef.current;
    if (!question || teaching || thinking) return;
    setTeaching(true);
    setTeachStatus("يبحث بالإنترنت ويقرأ المصادر...");
    try {
      const searchResponse = await fetch("/api/websearch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question }),
      });
      const searchData = (await searchResponse.json()) as {
        learnedCount?: number;
        learned?: { title: string }[];
      };
      const count = searchData.learnedCount ?? 0;
      setTeachStatus(
        count > 0
          ? "✓ قرأ " + count + " مصدر: " + (searchData.learned ?? []).map((l) => l.title).join(" · ") + " — يجيبك الآن..."
          : "ما وجد مصادر جديدة كافية — جرب صياغة أخرى."
      );
      if (count > 0) {
        const answer = await fetchAnswer(question);
        setMessages((prev) => [...prev, { role: "model", answer }]);
      }
    } catch {
      setTeachStatus("تعذر البحث مؤقتاً — حاول مرة أخرى.");
    } finally {
      setTeaching(false);
      setTimeout(() => setTeachStatus(null), 9000);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-4xl flex-col px-4">
      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto py-6">
        {messages.length === 0 && (
          <div className="rise-in rounded-xl border border-line bg-panel p-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-mint pulse-dot" />
              <p className="text-sm font-bold text-mint">عقل لواو جاهز — اسألني أي شيء عن برمجة روبلوكس</p>
            </div>
            <p className="mb-4 text-sm leading-7 text-dim">
              أفهم العربية والإنجليزية، أولّد أنظمة كاملة جاهزة للنسخ، وأشرح الدروس من المستوى
              المبتدئ حتى المتقدم. كل معرفتي مكتوبة يدوياً وتتوسع بمساهمات اللاعبين.
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  onClick={() => ask(starter)}
                  className="rounded-full border border-line bg-panel2 px-3.5 py-1.5 text-xs text-fog/85 transition hover:border-mint/50 hover:text-mint"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) =>
          message.role === "user" ? (
            <div key={index} className="flex justify-start">
              <div className="max-w-[85%] rounded-xl rounded-tr-sm border border-amber/25 bg-amber/10 px-4 py-2.5 text-sm leading-7 text-fog">
                {message.text}
              </div>
            </div>
          ) : (
            <div key={index} className="rise-in flex justify-end">
              <div className="w-full max-w-[95%] rounded-xl rounded-tl-sm border border-line bg-panel p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-mint">
                  <span className="font-mono font-bold">عقل لواو</span>
                  <span className="rounded border border-mint/30 px-1.5 py-0.5 font-mono text-[9px]">
                    {message.answer ? message.answer.kind : "رد"}
                  </span>
                </div>
                {message.answer ? (
                  <AnswerView answer={message.answer} />
                ) : (
                  <p className="text-sm leading-7 text-fog">{message.text}</p>
                )}
                {message.answer?.kind === "fallback" && index === messages.length - 1 && (
                  <button
                    onClick={() => void teachFromWeb()}
                    disabled={teaching || thinking}
                    className="mt-3 rounded-lg bg-amber px-4 py-2 text-xs font-bold text-ink transition hover:bg-embersoft disabled:opacity-40"
                  >
                    {teaching ? "يبحث ويقرأ الآن..." : "علّمه من الإنترنت: ابحث عن سؤالي وتعلم"}
                  </button>
                )}
              </div>
            </div>
          )
        )}

        {teachStatus && (
          <div className="flex justify-end">
            <p className="rise-in rounded-lg border border-amber/30 bg-amber/10 px-4 py-2 text-xs leading-6 text-embersoft">
              {teachStatus}
            </p>
          </div>
        )}

        {thinking && (
          <div className="flex justify-end">
            <div className="rounded-xl rounded-tl-sm border border-line bg-panel px-5 py-3">
              <div className="flex items-center gap-2 text-xs text-dim">
                <span className="h-1.5 w-1.5 rounded-full bg-mint pulse-dot" />
                <span className="h-1.5 w-1.5 rounded-full bg-mint pulse-dot" style={{ animationDelay: "0.2s" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-mint pulse-dot" style={{ animationDelay: "0.4s" }} />
                <span className="mr-1 font-mono">يعالج طلبك...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask(input);
        }}
        className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-panel p-2"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder='اسأل عن أي شيء بلواو... مثال: "اكتب لي متجراً آمناً"'
          className="flex-1 bg-transparent px-3 py-2 text-sm text-fog outline-none placeholder:text-faint"
        />
        <button
          type="submit"
          disabled={thinking || !input.trim()}
          className="rounded-lg bg-mint px-5 py-2 text-sm font-bold text-ink transition hover:bg-mintsoft disabled:opacity-40"
        >
          إرسال
        </button>
      </form>
    </div>
  );
}
