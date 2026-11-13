"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/guard";
import { deleteInquiry, getInquiry, INQUIRY_STATUSES, setInquiryStatus } from "@/server/admin/inquiries";
import { notifyOwner } from "@/server/contact/submit";
import { readSettings } from "@/server/content/repo";
import { db } from "@/server/db/client";
import { defaultMailer } from "@/server/email/mailer";
import { env } from "@/server/env";
import { log } from "@/server/log";
import { isUuid, type ActionState } from "./shared";

const statusSchema = z.enum(INQUIRY_STATUSES);

export async function updateInquiryStatus(id: string, status: string): Promise<ActionState> {
  await requireAdmin();
  const parsed = statusSchema.safeParse(status);
  if (!isUuid(id) || !parsed.success) return { ok: false, message: "Invalid request." };
  const done = await setInquiryStatus(db(), id, parsed.data);
  revalidatePath("/admin/inquiries", "layout");
  revalidatePath("/admin");
  return done ? { ok: true, message: `Marked as ${parsed.data}.` } : { ok: false, message: "That inquiry no longer exists." };
}

export async function removeInquiry(id: string): Promise<ActionState> {
  await requireAdmin();
  if (!isUuid(id)) return { ok: false, message: "Invalid request." };
  await deleteInquiry(db(), id);
  log.info("inquiry.deleted", { inquiryId: id });
  revalidatePath("/admin/inquiries", "layout");
  revalidatePath("/admin");
  redirect("/admin/inquiries");
}

export async function retryInquiryNotification(id: string): Promise<ActionState> {
  await requireAdmin();
  if (!isUuid(id)) return { ok: false, message: "Invalid request." };
  const inquiry = await getInquiry(db(), id);
  if (!inquiry) return { ok: false, message: "That inquiry no longer exists." };
  const settings = await readSettings(db());
  const result = await notifyOwner(
    { db: db(), mailer: defaultMailer(), ownerEmail: env().CONTACT_TO_EMAIL, siteUrl: settings.profile.website.replace(/\/$/, "") },
    inquiry,
  );
  revalidatePath(`/admin/inquiries/${id}`);
  return result.notification === "sent"
    ? { ok: true, message: "Notification email sent." }
    : { ok: false, message: `Still failing: ${result.notificationError ?? "unknown error"}` };
}
