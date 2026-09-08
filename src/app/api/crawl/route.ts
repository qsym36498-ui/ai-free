import { asc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { crawledPages } from "@/db/schema";
import { seedCrawlQueue } from "@/lib/luau/crawler-runner";

export const dynamic = "force-dynamic";

/** حالة الزاحف الذاتي: يضيف الروابط الجديدة للطابور ثم يقرأ حالته */
export async function GET() {
  try {
    await seedCrawlQueue();
    const pages = await db.select().from(crawledPages).orderBy(asc(crawledPages.id));
    const [totals] = await db
      .select({
        done: sql<number>`count(*) filter (where ${crawledPages.status} = 'done')::int`,
        tokens: sql<number>`coalesce(sum(${crawledPages.tokens}) filter (where ${crawledPages.status} = 'done'), 0)::int`,
      })
      .from(crawledPages);

    return NextResponse.json({
      pages: pages.map((p) => ({
        id: p.id,
        url: p.url,
        origin: p.origin,
        title: p.title,
        status: p.status,
        tokens: p.tokens,
      })),
      doneCount: Number(totals?.done ?? 0),
      totalTokens: Number(totals?.tokens ?? 0),
    });
  } catch (error) {
    console.error("crawl GET error", error);
    return NextResponse.json({ pages: [], doneCount: 0, totalTokens: 0 });
  }
}
