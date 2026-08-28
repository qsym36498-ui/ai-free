export type LessonLevel = "مبتدئ" | "متوسط" | "متقدم";

export interface KnowledgeDoc {
  id: string;
  kind: "lesson" | "reference";
  level: LessonLevel;
  title: string;
  summary: string;
  content: string[]; // فقرات ونقاط
  code?: string;
  tags: string[];
}

export interface TemplateScript {
  name: string;
  location: string; // أين يوضع داخل روبلوكس ستوديو
  scriptType: "Script" | "LocalScript" | "ModuleScript";
  code: string;
}

export interface CodeTemplate {
  id: string;
  title: string;
  description: string;
  keywords: string[]; // كلمات مفتاحية عربية وإنجليزية (مطبّعة)
  placement: string;
  scripts: TemplateScript[];
  notes: string[];
}

export interface AnswerSection {
  heading?: string;
  text?: string;
  code?: string;
  fileName?: string;
}

export interface EngineAnswer {
  kind: "generator" | "knowledge" | "greeting" | "capabilities" | "fallback";
  intro: string;
  sections: AnswerSection[];
  tips: string[];
  sources: string[];
  followUps: string[];
}
