import "server-only";
import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { availableSlots, BOOKING, bookingRequest, isBookableSlot } from "@/lib/booking";
import type { Db } from "@/server/db/client";
import { bookings, type Booking } from "@/server/db/schema";
import type { Mailer } from "@/server/email/mailer";
import { escapeHtml } from "@/server/email/templates";
import { log } from "@/server/log";
import { rateLimitAll } from "@/server/security/rate-limit";

export interface BookingDeps {
  db: Db;
  mailer: Mailer;
  ownerEmail: string | undefined;
  ownerName: string;
  siteUrl: string;
  sendConfirmation: boolean;
}

type Result =
  | { status: 201; body: { ok: true; ref: string; start: string } }
  | { status: number; body: { ok: false; error: string; message: string; fields?: Record<string, string> }; retryAfter?: number };

const fail = (status: number, error: string, message: string, extra: { fields?: Record<string, string>; retryAfter?: number } = {}): Result => ({
  status,
  body: { ok: false, error, message, ...(extra.fields ? { fields: extra.fields } : {}) },
  retryAfter: extra.retryAfter,
});

/** Starts of confirmed bookings inside the bookable window, as ISO strings. */
export async function takenSlots(db: Db, now = new Date()): Promise<string[]> {
  const until = new Date(now.getTime() + (BOOKING.horizonDays + 2) * 86_400_000);
  const rows = await db
    .select({ startsAt: bookings.startsAt })
    .from(bookings)
    .where(and(eq(bookings.status, "confirmed"), gte(bookings.startsAt, now), lt(bookings.startsAt, until)));
  return rows.map((r) => r.startsAt.toISOString());
}

export async function openSlots(db: Db, now = new Date()) {
  return availableSlots(now, await takenSlots(db, now)).map((d) => d.toISOString());
}

const isUniqueViolation = (error: unknown) =>
  typeof error === "object" && error !== null && ((error as { code?: string }).code === "23505" || String((error as { cause?: { code?: string } }).cause?.code) === "23505");

/** Validate → rate limit → check the slot → insert (the unique index settles races) → notify. */
export async function createBooking(raw: unknown, ctx: { ipKey: string }, deps: BookingDeps, now = new Date()): Promise<Result> {
  const parsed = bookingRequest.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return fail(422, "invalid", "Please check the highlighted fields.", { fields });
  }
  const data = parsed.data;
  if (data.website) return fail(400, "rejected", "Your booking couldn't be accepted. Please email me directly instead.");

  const limit = await rateLimitAll(
    deps.db,
    [
      { key: `booking:ip:${ctx.ipKey}`, limit: 5, windowSeconds: 3600 },
      { key: `booking:email:${data.email.toLowerCase()}`, limit: 3, windowSeconds: 86_400 },
    ],
    now,
  );
  if (!limit.allowed) {
    return fail(429, "rate_limited", "That's a lot of bookings in a short time. Please try again later or email me.", { retryAfter: limit.retryAfter });
  }

  if (!isBookableSlot(data.start, now)) {
    return fail(409, "slot_unavailable", "That time isn't available any more. Please pick another slot.");
  }

  const start = new Date(data.start);
  let booking: Booking;
  try {
    const [row] = await deps.db
      .insert(bookings)
      .values({
        startsAt: start,
        endsAt: new Date(start.getTime() + BOOKING.minutes * 60_000),
        name: data.name,
        email: data.email,
        notes: data.notes,
      })
      .returning();
    booking = row!;
  } catch (error) {
    if (isUniqueViolation(error)) return fail(409, "slot_taken", "Someone booked that time a moment ago. Please pick another slot.");
    log.error("booking.save_failed", { error });
    return fail(503, "unavailable", "Your booking couldn't be saved just now. Nothing was booked — please try again, or email me.");
  }

  log.info("booking.created", { bookingId: booking.id });
  await notify(deps, booking);
  return { status: 201, body: { ok: true, ref: booking.id.slice(0, 8), start: booking.startsAt.toISOString() } };
}

const kathmanduTime = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: BOOKING.timezone, dateStyle: "full", timeStyle: "short" }).format(d);

async function notify(deps: BookingDeps, booking: Booking) {
  const when = `${kathmanduTime(booking.startsAt)} (Kathmandu time)`;
  try {
    if (!deps.ownerEmail) throw new Error("CONTACT_TO_EMAIL is not configured");
    const rows: [string, string][] = [
      ["When", when],
      ["Name", booking.name],
      ["Email", booking.email],
      ...(booking.notes ? ([["Notes", booking.notes]] as [string, string][]) : []),
    ];
    await deps.mailer.send({
      to: deps.ownerEmail,
      replyTo: booking.email,
      subject: `New call booked: ${booking.name}, ${kathmanduTime(booking.startsAt)}`,
      idempotencyKey: `booking-owner-${booking.id}`,
      text: [`New ${BOOKING.title} booked.`, "", ...rows.map(([k, v]) => `${k}: ${v}`), "", `Dashboard: ${deps.siteUrl}/admin/bookings`, "Send them the meeting link by replying to this email."].join("\n"),
      html: `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#161615;max-width:620px">
<p style="font:12px monospace;text-transform:uppercase;color:#6b6a66">New call booked</p>
<table style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#6b6a66">${escapeHtml(k)}</td><td style="padding:4px 0">${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>
<p><a href="${escapeHtml(deps.siteUrl)}/admin/bookings">Open bookings</a> · reply to send the meeting link.</p></body></html>`,
    });
    if (deps.sendConfirmation) {
      await deps.mailer.send({
        to: booking.email,
        subject: `Your call with ${deps.ownerName} is booked`,
        idempotencyKey: `booking-visitor-${booking.id}`,
        text: `Hi ${booking.name},\n\nYour ${BOOKING.title} with ${deps.ownerName} is booked for ${when}.\n${BOOKING.where}.\n\n— ${deps.ownerName}`,
        html: `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#161615;max-width:620px"><p>Hi ${escapeHtml(booking.name)},</p><p>Your ${escapeHtml(BOOKING.title)} with ${escapeHtml(deps.ownerName)} is booked for <strong>${escapeHtml(when)}</strong>.</p><p>${escapeHtml(BOOKING.where)}.</p><p>— ${escapeHtml(deps.ownerName)}</p></body></html>`,
      });
    }
    await deps.db.update(bookings).set({ notification: "sent", notificationError: null }).where(eq(bookings.id, booking.id));
  } catch (error) {
    // The booking stands either way; the dashboard shows that no email went out.
    const message = error instanceof Error ? error.message : String(error);
    log.warn("booking.notify_failed", { bookingId: booking.id, error: message });
    await deps.db.update(bookings).set({ notification: "failed", notificationError: message.slice(0, 300) }).where(eq(bookings.id, booking.id));
  }
}

// ── Admin ──────────────────────────────────────────────────────────────────

export async function listBookings(db: Db, { upcoming }: { upcoming: boolean }, now = new Date()) {
  return db
    .select()
    .from(bookings)
    .where(upcoming ? gte(bookings.endsAt, now) : lt(bookings.endsAt, now))
    .orderBy(upcoming ? asc(bookings.startsAt) : desc(bookings.startsAt))
    .limit(200);
}

export async function cancelBooking(db: Db, id: string) {
  const rows = await db
    .update(bookings)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(and(eq(bookings.id, id), eq(bookings.status, "confirmed")))
    .returning({ id: bookings.id });
  return rows.length > 0;
}
