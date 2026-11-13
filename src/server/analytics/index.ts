import "server-only";
import { and, count, countDistinct, desc, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/server/db/client";
import { analyticsEvents, inquiries } from "@/server/db/schema";
import { hmac } from "@/server/security/crypto";

/**
 * First-party, cookieless analytics. Nothing is stored that identifies a
 * person: no IP, no cookie, no full referrer. A visitor id is an HMAC of
 * IP + user agent keyed by the date, so it counts unique visitors per day
 * and can't be linked across days. Visitors sending Global Privacy Control
 * or Do Not Track are not recorded at all (checked by the route).
 */

export const eventSchema = z.object({
  type: z.enum(["pageview", "project_view", "cv_download", "outbound", "contact_start"]),
  path: z
    .string()
    .max(300)
    .regex(/^\/[^\s]*$/)
    .transform((p) => p.split(/[?#]/)[0]!),
  referrer: z.string().max(500).optional(),
  target: z.string().max(300).optional(),
});

const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|preview|monitor|curl|wget|python|httpclient/i;

export const isBot = (ua: string) => !ua || BOT_UA.test(ua);

export function deviceOf(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

/** Keep only the host of an external referrer; same-site referrers are dropped. */
export function referrerHost(referrer: string | undefined, ownHost: string | null) {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return ownHost && host === ownHost.replace(/^www\./, "").split(":")[0] ? null : host.slice(0, 100);
  } catch {
    return null;
  }
}

export async function recordEvent(
  db: Db,
  event: z.output<typeof eventSchema>,
  ctx: { ip: string; userAgent: string; host: string | null; now?: Date },
) {
  const now = ctx.now ?? new Date();
  const day = now.toISOString().slice(0, 10);
  await db.insert(analyticsEvents).values({
    type: event.type,
    path: event.path,
    referrer: referrerHost(event.referrer, ctx.host),
    target: event.target?.slice(0, 300) ?? null,
    device: deviceOf(ctx.userAgent),
    visitor: hmac(`${day}|${ctx.ip}|${ctx.userAgent}`, "visitor").slice(0, 22),
    day,
    createdAt: now,
  });
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export async function analyticsSummary(db: Db, days: number, now = new Date()) {
  const since = new Date(now.getTime() - (days - 1) * 86_400_000);
  const sinceDay = dayKey(since);
  const inRange = gte(analyticsEvents.day, sinceDay);
  const views = and(inRange, eq(analyticsEvents.type, "pageview"));

  const [totals] = await db
    .select({ pageviews: count(), dailyVisitors: sql<number>`count(distinct (${analyticsEvents.day}, ${analyticsEvents.visitor}))` })
    .from(analyticsEvents)
    .where(views);

  const perDay = await db
    .select({ day: analyticsEvents.day, pageviews: count(), visitors: countDistinct(analyticsEvents.visitor) })
    .from(analyticsEvents)
    .where(views)
    .groupBy(analyticsEvents.day)
    .orderBy(analyticsEvents.day);

  const topPages = await db
    .select({ path: analyticsEvents.path, views: count() })
    .from(analyticsEvents)
    .where(views)
    .groupBy(analyticsEvents.path)
    .orderBy(desc(count()))
    .limit(10);

  const topProjects = await db
    .select({ slug: analyticsEvents.target, views: count(), visitors: countDistinct(analyticsEvents.visitor) })
    .from(analyticsEvents)
    .where(and(inRange, eq(analyticsEvents.type, "project_view")))
    .groupBy(analyticsEvents.target)
    .orderBy(desc(count()))
    .limit(10);

  const referrers = await db
    .select({ host: analyticsEvents.referrer, views: count() })
    .from(analyticsEvents)
    .where(and(views, sql`${analyticsEvents.referrer} is not null`))
    .groupBy(analyticsEvents.referrer)
    .orderBy(desc(count()))
    .limit(10);

  const devices = await db
    .select({ device: analyticsEvents.device, views: count() })
    .from(analyticsEvents)
    .where(views)
    .groupBy(analyticsEvents.device);

  const interactions = await db
    .select({ type: analyticsEvents.type, target: analyticsEvents.target, total: count() })
    .from(analyticsEvents)
    .where(and(inRange, sql`${analyticsEvents.type} in ('cv_download','outbound','contact_start')`))
    .groupBy(analyticsEvents.type, analyticsEvents.target)
    .orderBy(desc(count()))
    .limit(15);

  const submissions = await db
    .select({ day: sql<string>`to_char(${inquiries.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`, total: count() })
    .from(inquiries)
    .where(gte(inquiries.createdAt, new Date(`${sinceDay}T00:00:00Z`)))
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  // Fill gaps so charts show real zeros rather than skipping days.
  const series = Array.from({ length: days }, (_, i) => {
    const day = dayKey(new Date(since.getTime() + i * 86_400_000));
    const v = perDay.find((r) => r.day === day);
    const s = submissions.find((r) => r.day === day);
    return { day, pageviews: Number(v?.pageviews ?? 0), visitors: Number(v?.visitors ?? 0), submissions: Number(s?.total ?? 0) };
  });

  const contactStarts = interactions.filter((i) => i.type === "contact_start").reduce((n, i) => n + Number(i.total), 0);

  return {
    days,
    pageviews: Number(totals?.pageviews ?? 0),
    dailyVisitors: Number(totals?.dailyVisitors ?? 0),
    submissions: series.reduce((n, d) => n + d.submissions, 0),
    contactStarts,
    series,
    topPages: topPages.map((r) => ({ path: r.path, views: Number(r.views) })),
    topProjects: topProjects.map((r) => ({ slug: r.slug ?? "", views: Number(r.views), visitors: Number(r.visitors) })),
    referrers: referrers.map((r) => ({ host: r.host ?? "", views: Number(r.views) })),
    devices: devices.map((r) => ({ device: r.device ?? "desktop", views: Number(r.views) })),
    interactions: interactions
      .filter((i) => i.type !== "contact_start")
      .map((r) => ({ type: r.type, target: r.target ?? "", total: Number(r.total) })),
  };
}

export async function purgeAnalytics(db: Db, olderThanDays: number, now = new Date()) {
  const cutoff = dayKey(new Date(now.getTime() - olderThanDays * 86_400_000));
  await db.delete(analyticsEvents).where(lt(analyticsEvents.day, cutoff));
}
