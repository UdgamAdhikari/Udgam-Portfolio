import "server-only";
import { sql } from "drizzle-orm";
import type { Db } from "@/server/db/client";

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfter: number };

/**
 * Fixed-window counter in Postgres: one atomic upsert per check, so it holds
 * across serverless instances without Redis. The window resets once expired.
 */
export async function rateLimit(
  db: Db,
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number },
  now = new Date(),
): Promise<RateLimitResult> {
  const rows = await db.execute<{ count: number; window_start: string | Date }>(sql`
    insert into rate_limits (key, count, window_start)
    values (${key}, 1, ${now.toISOString()}::timestamptz)
    on conflict (key) do update set
      count = case when rate_limits.window_start <= ${now.toISOString()}::timestamptz - make_interval(secs => ${windowSeconds})
                   then 1 else rate_limits.count + 1 end,
      window_start = case when rate_limits.window_start <= ${now.toISOString()}::timestamptz - make_interval(secs => ${windowSeconds})
                   then ${now.toISOString()}::timestamptz else rate_limits.window_start end
    returning count, window_start
  `);
  const row = (Array.isArray(rows) ? rows[0] : (rows as unknown as { rows: unknown[] }).rows[0]) as
    | { count: number; window_start: string | Date }
    | undefined;
  const count = Number(row?.count ?? 1);
  const start = new Date(row?.window_start ?? now).getTime();
  const retryAfter = Math.max(1, Math.ceil((start + windowSeconds * 1000 - now.getTime()) / 1000));
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), retryAfter };
}

/** Check several limits; the first one exceeded wins. All are counted. */
export async function rateLimitAll(
  db: Db,
  checks: { key: string; limit: number; windowSeconds: number }[],
  now = new Date(),
): Promise<RateLimitResult> {
  let worst: RateLimitResult = { allowed: true, remaining: Infinity, retryAfter: 0 };
  for (const check of checks) {
    const result = await rateLimit(db, check.key, check, now);
    if (!result.allowed && (worst.allowed || result.retryAfter > worst.retryAfter)) worst = result;
    else if (worst.allowed && result.remaining < worst.remaining) worst = result;
  }
  return worst;
}

export async function purgeRateLimits(db: Db, olderThan: Date) {
  await db.execute(sql`delete from rate_limits where window_start < ${olderThan.toISOString()}::timestamptz`);
}
