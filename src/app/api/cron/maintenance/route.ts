import { NextResponse } from "next/server";
import { readSettings } from "@/server/content/repo";
import { db } from "@/server/db/client";
import { defaultMailer } from "@/server/email/mailer";
import { env } from "@/server/env";
import { log } from "@/server/log";
import { runMaintenance } from "@/server/maintenance/run";
import { safeEqual } from "@/server/security/crypto";

export const dynamic = "force-dynamic";

/** Called by Vercel Cron (or any scheduler) with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: Request) {
  const config = env();
  const auth = request.headers.get("authorization") ?? "";
  if (!config.CRON_SECRET || !safeEqual(auth, `Bearer ${config.CRON_SECRET}`)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const settings = await readSettings(db());
  const result = await runMaintenance(db(), {
    mailer: defaultMailer(),
    ownerEmail: config.CONTACT_TO_EMAIL,
    siteUrl: settings.profile.website.replace(/\/$/, ""),
    inquiryRetentionDays: config.INQUIRY_RETENTION_DAYS,
    analyticsRetentionDays: config.ANALYTICS_RETENTION_DAYS,
  });
  log.info("maintenance.done", result);
  return NextResponse.json(result);
}
