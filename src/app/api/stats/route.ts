import { count, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { knowledgeEntries, trainingContributions, trainingNodes } from "@/db/schema";
import { knowledgeStats } from "@/lib/luau/engine";
import { TEMPLATES } from "@/lib/luau/templates";

export const dynamic = "force-dynamic";

const LEVEL_NAMES = [
  "نواة تتشكل",
  "متدرب صغير",
  "طالب مجتهد",
  "مبرمج واعد",
  "خبير لواو",
  "أسطورة البرمجة",
];

export async function GET() {
  try {
    const [contributionRow, knowledgeRow, nodeRow, kb] = await Promise.all([
      db
        .select({
          contributions: count(),
          tokens: sql<number>`coalesce(sum(${trainingContributions.tokensProcessed}), 0)::bigint`,
        })
        .from(trainingContributions),
      db.select({ entries: count() }).from(knowledgeEntries),
      db
        .select({
          nodes: count(),
          networkTokens: sql<number>`coalesce(sum(${trainingNodes.totalTokens}), 0)::bigint`,
        })
        .from(trainingNodes),
      knowledgeStats(),
    ]);

    const contributions = contributionRow[0]?.contributions ?? 0;
    const deviceTokens = Number(contributionRow[0]?.tokens ?? 0);
    const userEntries = knowledgeRow[0]?.entries ?? 0;
    const nodes = nodeRow[0]?.nodes ?? 0;
    const networkTokens = Number(nodeRow[0]?.networkTokens ?? 0);

    // نقاط الخبرة: كل 1000 توكن معالج = 1 نقطة، وكل معرفة مضافة = 40 نقطة
    const xp = Math.floor(deviceTokens / 1000) + userEntries * 40;
    const level = Math.min(Math.floor(Math.sqrt(xp / 8)) + 1, LEVEL_NAMES.length);
    const levelName = LEVEL_NAMES[level - 1];
    const nextLevelXp = Math.pow(level, 2) * 8;

    return NextResponse.json({
      level,
      levelName,
      xp,
      nextLevelXp,
      contributions,
      deviceTokens,
      userEntries,
      nodes,
      networkTokens,
      builtinDocs: kb.builtinDocs,
      builtinTokens: kb.builtinTokens,
      userTokens: kb.userTokens,
      crawledDocs: kb.crawledDocs,
      crawledTokens: kb.crawledTokens,
      languages: kb.languages,
      knowledgeBookCount: kb.knowledgeBookCount,
      bookTokens: kb.bookTokens,
      templates: TEMPLATES.length,
    });
  } catch (error) {
    console.error("stats error", error);
    const kb = await knowledgeStats();
    return NextResponse.json({
      level: 1,
      levelName: LEVEL_NAMES[0],
      xp: 0,
      nextLevelXp: 8,
      contributions: 0,
      deviceTokens: 0,
      userEntries: 0,
      nodes: 0,
      networkTokens: 0,
      builtinDocs: kb.builtinDocs,
      builtinTokens: kb.builtinTokens,
      userTokens: kb.userTokens,
      crawledDocs: kb.crawledDocs,
      crawledTokens: kb.crawledTokens,
      languages: kb.languages,
      knowledgeBookCount: kb.knowledgeBookCount,
      bookTokens: kb.bookTokens,
      templates: TEMPLATES.length,
    });
  }
}
