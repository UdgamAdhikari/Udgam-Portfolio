import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { env } from "@/server/env";
import * as schema from "./schema";

/**
 * The app talks to PostgreSQL through node-postgres in every environment.
 * (It never pipelines queries on a connection, which keeps it compatible
 * with poolers and with the local PGlite server from `npm run db:local`.)
 * Tests swap in an in-process PGlite with `setDbForTests`.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as unknown as { __db?: Db; __pool?: Pool };

export function db(): Db {
  if (globalForDb.__db) return globalForDb.__db;
  const { DATABASE_URL, DATABASE_POOL_MAX } = env();
  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: DATABASE_POOL_MAX,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });
  // An idle client erroring (e.g. the server restarted) must not crash the process.
  pool.on("error", () => {});
  globalForDb.__pool = pool;
  globalForDb.__db = drizzle(pool, { schema }) as unknown as Db;
  return globalForDb.__db;
}

export function setDbForTests(instance: Db | undefined) {
  globalForDb.__db = instance;
}

export { schema };
