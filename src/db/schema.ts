import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * معرفة يضيفها اللاعبون من الإنترنت والكتب — تدخل مباشرة في فهرس
 * بحث المحرك، ويمكن للاعبين الآخرين تأكيدها أو نقضها.
 */
export const knowledgeEntries = pgTable("knowledge_entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  code: text("code"),
  tags: text("tags").notNull().default(""),
  sourceUrl: text("source_url"),
  sourceType: text("source_type").notNull().default("موقع"), // كتاب | موقع | فيديو | تجربة
  authorName: text("author_name").notNull().default("زائر"),
  verified: boolean("verified").notNull().default(false),
  confirmCount: integer("confirm_count").notNull().default(0),
  disputeCount: integer("dispute_count").notNull().default(0),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** أصوات التأكيد والنقض على المعرفة — صوت واحد لكل جهاز على كل معلومة */
export const knowledgeVotes = pgTable("knowledge_votes", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").notNull(),
  deviceId: text("device_id").notNull(),
  vote: text("vote").notNull(), // confirm | dispute
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * عقد شبكة التدريب الموزعة — أجهزة اللاعبين التي تعمل كسيرفرات
 * تدريب صغيرة وتشغل جلسات متواصلة.
 */
export const trainingNodes = pgTable("training_nodes", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull().unique(),
  alias: text("alias").notNull().default("عقدة تدريب"),
  totalTokens: integer("total_tokens").notNull().default(0),
  sessions: integer("sessions").notNull().default(0),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** كتب المعارف العامة التي يضيفها اللاعبون (أي موضوع: ذكاء اصطناعي، علوم، تاريخ...) */
export const knowledgeBooks = pgTable("knowledge_books", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  tags: text("tags").notNull().default(""),
  content: text("content").notNull(),
  tokens: integer("tokens").notNull().default(0),
  authorName: text("author_name").notNull().default("زائر"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** كتب لغات البرمجة التي يضيفها اللاعبون (PDF أو نص) — يتدرب النموذج عليها */
export const languageBooks = pgTable("language_books", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  tags: text("tags").notNull().default(""),
  content: text("content").notNull(),
  tokens: integer("tokens").notNull().default(0),
  authorName: text("author_name").notNull().default("زائر"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** صفحات قرأها الزاحف الذاتي من الإنترنت (كتب ومراجع مجانية) */
export const crawledPages = pgTable("crawled_pages", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
  origin: text("origin").notNull().default("كتاب مجاني"),
  tags: text("tags").notNull().default(""),
  title: text("title").notNull().default(""),
  content: text("content").notNull().default(""),
  tokens: integer("tokens").notNull().default(0),
  status: text("status").notNull().default("pending"), // pending | reading | done | failed
  fetchedAt: timestamp("fetched_at"),
});

/** مساهمات التدريب الفردية من أجهزة الزوار */
export const trainingContributions = pgTable("training_contributions", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull().default("unknown"),
  mode: text("mode").notNull().default("manual"), // auto | manual
  tokensProcessed: integer("tokens_processed").notNull().default(0),
  checksum: text("checksum").notNull().default(""),
  durationMs: integer("duration_ms").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
