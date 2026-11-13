import "server-only";
import { db } from "@/server/db/client";
import { readSettings } from "@/server/content/repo";
import { defaultMailer } from "@/server/email/mailer";
import { env } from "@/server/env";
import { verifyTurnstile } from "@/server/security/bot";
import type { SubmitDeps } from "./submit";

export async function contactDeps(ip: string): Promise<SubmitDeps> {
  const config = env();
  const settings = await readSettings(db());
  return {
    db: db(),
    mailer: defaultMailer(),
    ownerEmail: config.CONTACT_TO_EMAIL,
    ownerName: settings.profile.name,
    replyWithin: settings.contact.replyWithin,
    siteUrl: settings.profile.website.replace(/\/$/, ""),
    sendConfirmation: config.CONTACT_SEND_CONFIRMATION,
    verifyHuman: (token) => verifyTurnstile(token, ip),
  };
}
