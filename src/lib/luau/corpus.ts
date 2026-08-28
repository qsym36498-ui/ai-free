import { LANGUAGE_LESSONS } from "./lessons-core";
import { PRO_LESSONS } from "./lessons-pro";
import { QUICK_REFERENCES, ROBLOX_LESSONS } from "./lessons-roblox";
import type { KnowledgeDoc } from "./types";

/** كل المعرفة المبنية يدوياً داخل النموذج */
export const BUILTIN_DOCS: KnowledgeDoc[] = [
  ...LANGUAGE_LESSONS,
  ...ROBLOX_LESSONS,
  ...PRO_LESSONS,
  ...QUICK_REFERENCES,
];

export function getLesson(id: string): KnowledgeDoc | undefined {
  return BUILTIN_DOCS.find((d) => d.id === id);
}

export function lessonsByLevel(level: KnowledgeDoc["level"]): KnowledgeDoc[] {
  return BUILTIN_DOCS.filter((d) => d.kind === "lesson" && d.level === level);
}

/** نص كامل للوثيقة — يستخدم في التدريب على الأجهزة وفي الفهرسة */
export function docToTrainingText(doc: KnowledgeDoc): string {
  const parts = [doc.title, doc.summary, ...doc.content, doc.tags.join(" ")];
  if (doc.code) parts.push(doc.code);
  return parts.join("\n");
}

export const CORPUS_TEXT = BUILTIN_DOCS.map(docToTrainingText).join("\n\n");
