import "server-only";
import { and, eq, lt } from "drizzle-orm";
import { purgeAnalytics } from "@/server/analytics";
import { purgeExpiredSessions } from "@/server/auth/session";
import { retryFailedNotifications } from "@/server/contact/submit";
import type { Db } from "@/server/db/client";
import { inquiries } from "@/server/db/schema";
import type { Mailer } from "@/server/email/mailer";
import { purgeRateLimits } from "@/server/security/rate-limit";

/**
 * Housekeeping and retention, run daily by cron:
 *  - retry owner notifications that failed;
 *  - delete expired sessions and stale rate-limit windows;
 *  - delete analytics older than ANALYTICS_RETENTION_DAYS;
 *  - delete *archived* inquiries older than INQUIRY_RETENTION_DAYS.
 */
export async function runMaintenance(
  db: Db,
  opts: { mailer: Mailer; ownerEmail?: string; siteUrl: string; inquiryRetentionDays: number; analyticsRetentionDays: number },
  now = new Date(),
) {
  const notifications = await retryFailedNotifications({ db, mailer: opts.mailer, ownerEmail: opts.ownerEmail, siteUrl: opts.siteUrl });
  await purgeExpiredSessions(db, now);
  await purgeRateLimits(db, new Date(now.getTime() - 2 * 86_400_000));
  await purgeAnalytics(db, opts.analyticsRetentionDays, now);
  const cutoff = new Date(now.getTime() - opts.inquiryRetentionDays * 86_400_000);
  const purged = await db
    .delete(inquiries)
    .where(and(eq(inquiries.status, "archived"), lt(inquiries.updatedAt, cutoff)))
    .returning({ id: inquiries.id });
  return { notifications, purgedInquiries: purged.length };
}
