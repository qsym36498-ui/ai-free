import { asc, count, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { crawledPages } from "@/db/schema";
import { CRAWL_QUEUE } from "@/lib/luau/crawler";

export const dynamic = "force-dynamic";

/** يبذر طابور القراءة إذا كان فارغاً */
async function seedQueue() {
  const [row] = await db.select({ n: count() }).from(crawledPages);
  if ((row?.n ?? 0) > 0) return;
  await db.insert(crawledPages).values(
    CRAWL_QUEUE.map((item) => ({
      url: item.url,
      origin: item.origin,
      tags: item.tags,
    }))
  );
}

/** حالة الزاحف الذاتي: الطابور وما تمت قراءته */
export async function GET() {
  try {
    await seedQueue();
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
