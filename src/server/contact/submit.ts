import "server-only";
import { and, eq, gt, sql } from "drizzle-orm";
import {
  contactSchema,
  DETAIL_FIELDS,
  fieldErrors,
  submissionEnvelope,
  subjectFor,
  type ContactData,
} from "@/lib/contact-schema";
import type { Db } from "@/server/db/client";
import { inquiries, type Inquiry } from "@/server/db/schema";
import type { Mailer } from "@/server/email/mailer";
import { ownerNotification, visitorConfirmation } from "@/server/email/templates";
import { log } from "@/server/log";
import { checkFormToken } from "@/server/security/bot";
import { hmac, sha256 } from "@/server/security/crypto";
import { rateLimit, rateLimitAll } from "@/server/security/rate-limit";

export type SubmitDeps = {
  db: Db;
  mailer: Mailer;
  ownerEmail: string | undefined;
  ownerName: string;
  replyWithin: string;
  siteUrl: string;
  sendConfirmation: boolean;
  verifyHuman: (token: string | undefined) => Promise<boolean>;
  now?: () => Date;
};

export type SubmitResult =
  | { status: 201 | 200; body: { ok: true; reference: string; duplicate?: boolean } }
  | {
      status: 400 | 403 | 409 | 422 | 429 | 503;
      body: { ok: false; error: string; message: string; fields?: Record<string, string> };
      retryAfter?: number;
    };

const fail = (
  status: 400 | 403 | 409 | 422 | 429 | 503,
  error: string,
  message: string,
  extra: { fields?: Record<string, string>; retryAfter?: number } = {},
): SubmitResult => ({
  status,
  body: { ok: false, error, message, ...(extra.fields ? { fields: extra.fields } : {}) },
  ...(extra.retryAfter ? { retryAfter: extra.retryAfter } : {}),
});

const reference = (id: string) => id.slice(0, 8).toUpperCase();

/** Hash of what the visitor wrote, so the same message sent twice is caught. */
function contentHashOf(data: ContactData) {
  return sha256(JSON.stringify([data.type, data.email, data.message.replace(/\s+/g, " ").toLowerCase()]));
}

const DUPLICATE_WINDOW_MS = 15 * 60 * 1000;

/**
 * The whole contact pipeline. Order matters:
 *  envelope → idempotent replay → bot checks → rate limit → validation →
 *  duplicate check → save → notify.
 * The visitor is told "received" only after the row is committed. A failed
 * notification never loses the message: it stays in the database, marked
 * `failed`, and can be retried from the dashboard or by the cron job.
 */
export async function submitInquiry(raw: unknown, ctx: { ipKey: string }, deps: SubmitDeps): Promise<SubmitResult> {
  const now = deps.now?.() ?? new Date();
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const envelope = submissionEnvelope.safeParse(input);
  if (!envelope.success) return fail(400, "bad_request", "Something went wrong with the form. Please reload the page.");
  const { idempotencyKey, formToken, website, turnstileToken } = envelope.data;

  try {
    // A retry of a submission that already went through: answer the same way.
    const [previous] = await deps.db
      .select({ id: inquiries.id, contentHash: inquiries.contentHash })
      .from(inquiries)
      .where(eq(inquiries.idempotencyKey, idempotencyKey))
      .limit(1);
    if (previous) {
      const parsed = contactSchema.safeParse(input);
      if (parsed.success && contentHashOf(parsed.data) !== previous.contentHash) {
        return fail(409, "conflict", "This form was already sent with different content. Reload the page to send a new message.");
      }
      return { status: 200, body: { ok: true, reference: reference(previous.id), duplicate: true } };
    }

    if (website.trim() !== "") {
      log.warn("contact.rejected", { reason: "honeypot" });
      return fail(400, "rejected", "Your message couldn't be accepted. Please email me directly instead.");
    }
    const token = checkFormToken(formToken, now.getTime());
    if (!token.ok) {
      log.warn("contact.rejected", { reason: token.reason });
      return token.reason === "too_fast"
        ? fail(429, "too_fast", "That was quicker than a person can type. Wait a moment and send again.", { retryAfter: 3 })
        : fail(400, "expired", "This form has been open a long time. Reload the page and send again — your text is kept.");
    }

    const limit = await rateLimitAll(
      deps.db,
      [
        { key: `contact:ip:${ctx.ipKey}`, limit: 5, windowSeconds: 10 * 60 },
        { key: `contact:ip-day:${ctx.ipKey}`, limit: 20, windowSeconds: 24 * 60 * 60 },
        { key: "contact:global", limit: 200, windowSeconds: 24 * 60 * 60 },
      ],
      now,
    );
    if (!limit.allowed) {
      log.warn("contact.rate_limited");
      return fail(429, "rate_limited", "You've sent several messages in a short time. Please try again later.", {
        retryAfter: limit.retryAfter,
      });
    }

    if (!(await deps.verifyHuman(turnstileToken))) {
      return fail(403, "challenge_failed", "The anti-spam check didn't pass. Please try again.");
    }

    const parsed = contactSchema.safeParse(input);
    if (!parsed.success) {
      return fail(422, "validation", "Some answers need another look.", { fields: fieldErrors(parsed.error) });
    }
    const data = parsed.data;
    const contentHash = contentHashOf(data);

    const [recent] = await deps.db
      .select({ id: inquiries.id })
      .from(inquiries)
      .where(and(eq(inquiries.contentHash, contentHash), gt(inquiries.createdAt, new Date(now.getTime() - DUPLICATE_WINDOW_MS))))
      .limit(1);
    if (recent) return { status: 200, body: { ok: true, reference: reference(recent.id), duplicate: true } };

    const details = Object.fromEntries(
      DETAIL_FIELDS[data.type].map((key) => [key, data[key]]).filter(([, v]) => v),
    ) as Record<string, string>;

    const inserted = await deps.db
      .insert(inquiries)
      .values({
        idempotencyKey,
        contentHash,
        type: data.type,
        name: data.name,
        email: data.email,
        company: data.company || null,
        subject: subjectFor(data),
        message: data.message,
        details,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({ target: inquiries.idempotencyKey })
      .returning();

    let inquiry = inserted[0];
    if (!inquiry) {
      // Lost a race with a concurrent request carrying the same key.
      const [existing] = await deps.db.select().from(inquiries).where(eq(inquiries.idempotencyKey, idempotencyKey)).limit(1);
      if (!existing) throw new Error("Insert conflicted but no row found");
      return { status: 200, body: { ok: true, reference: reference(existing.id), duplicate: true } };
    }
    log.info("contact.saved", { inquiryId: inquiry.id, type: inquiry.type });

    inquiry = await notifyOwner(deps, inquiry);
    if (deps.sendConfirmation) await sendConfirmation(deps, inquiry, now);

    return { status: 201, body: { ok: true, reference: reference(inquiry.id) } };
  } catch (error) {
    log.error("contact.store_failed", { error });
    return fail(503, "unavailable", "Your message couldn't be saved just now. Nothing was sent — please try again in a minute, or email me directly.");
  }
}

/** Send (or re-send) the owner notification and record the outcome. */
export async function notifyOwner(deps: Pick<SubmitDeps, "db" | "mailer" | "ownerEmail" | "siteUrl">, inquiry: Inquiry) {
  const attempts = inquiry.notificationAttempts + 1;
  try {
    if (!deps.ownerEmail) throw new Error("CONTACT_TO_EMAIL is not configured");
    const email = ownerNotification(inquiry, `${deps.siteUrl}/admin/inquiries/${inquiry.id}`);
    await deps.mailer.send({
      to: deps.ownerEmail,
      replyTo: inquiry.email,
      idempotencyKey: `inquiry-${inquiry.id}`,
      ...email,
    });
    const [row] = await deps.db
      .update(inquiries)
      .set({ notification: "sent", notificationError: null, notificationAttempts: attempts, notifiedAt: new Date() })
      .where(eq(inquiries.id, inquiry.id))
      .returning();
    log.info("contact.notified", { inquiryId: inquiry.id });
    return row ?? inquiry;
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 300) : "Unknown error";
    log.error("contact.notify_failed", { inquiryId: inquiry.id, error });
    try {
      const [row] = await deps.db
        .update(inquiries)
        .set({ notification: "failed", notificationError: reason, notificationAttempts: attempts })
        .where(eq(inquiries.id, inquiry.id))
        .returning();
      return row ?? inquiry;
    } catch (updateError) {
      // The inquiry itself is saved; only the status update failed.
      log.error("contact.notify_status_failed", { inquiryId: inquiry.id, error: updateError });
      return inquiry;
    }
  }
}

async function sendConfirmation(deps: SubmitDeps, inquiry: Inquiry, now: Date) {
  try {
    // At most one confirmation per address per day, whoever triggers it.
    const allowed = await rateLimit(deps.db, `confirm:${hmac(inquiry.email, "email")}`, { limit: 1, windowSeconds: 86_400 }, now);
    if (!allowed.allowed) return;
    await deps.mailer.send({
      to: inquiry.email,
      idempotencyKey: `confirm-${inquiry.id}`,
      ...visitorConfirmation(deps.ownerName, deps.replyWithin),
    });
  } catch (error) {
    log.warn("contact.confirmation_failed", { inquiryId: inquiry.id, error });
  }
}

/** Retry every failed notification (bounded), oldest first. */
export async function retryFailedNotifications(deps: Pick<SubmitDeps, "db" | "mailer" | "ownerEmail" | "siteUrl">) {
  const failed = await deps.db
    .select()
    .from(inquiries)
    .where(
      and(
        sql`${inquiries.notification} in ('failed','pending')`,
        sql`${inquiries.notificationAttempts} < 6`,
        // Leave very recent rows alone: their request may still be sending.
        sql`${inquiries.createdAt} < now() - interval '2 minutes'`,
      ),
    )
    .orderBy(inquiries.createdAt)
    .limit(20);
  let sent = 0;
  for (const inquiry of failed) {
    const result = await notifyOwner(deps, inquiry);
    if (result.notification === "sent") sent++;
  }
  return { attempted: failed.length, sent };
}
