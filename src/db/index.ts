import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

// Neon/supabase تشترط SSL — نخلي الصلابة تلقائية حسب ما يجي في الربط (sslmode=require)
const parsedDbUrl = new URL(databaseUrl);
const dbSslRequired = parsedDbUrl.searchParams.get("sslmode") === "require";
const dbIsCloud = parsedDbUrl.hostname.includes("neon.tech");
const dbSSL = dbSslRequired || dbIsCloud ? { rejectUnauthorized: false } : false;

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: dbSSL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
