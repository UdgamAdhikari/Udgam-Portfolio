import { NextResponse } from "next/server";
import { createBooking, openSlots } from "@/server/booking";
import { readSettings } from "@/server/content/repo";
import { db } from "@/server/db/client";
import { defaultMailer } from "@/server/email/mailer";
import { env } from "@/server/env";
import { log } from "@/server/log";
import { ipKey, isSameOrigin } from "@/server/security/request";

export const dynamic = "force-dynamic";

const MAX_BODY = 8 * 1024;
const noStore = { "Cache-Control": "no-store" };

/** Open slots (ISO start times) for the next few weeks. */
export async function GET() {
  try {
    return NextResponse.json({ ok: true, slots: await openSlots(db()) }, { headers: noStore });
  } catch (error) {
    log.error("booking.slots_failed", { error });
    return NextResponse.json({ ok: false, message: "Available times couldn't be loaded. Please try again shortly." }, { status: 503, headers: noStore });
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "forbidden", message: "Cross-site bookings aren't accepted." }, { status: 403, headers: noStore });
  }
  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) {
      return NextResponse.json({ ok: false, error: "too_large", message: "That's too long." }, { status: 413, headers: noStore });
    }
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request", message: "The booking couldn't be read." }, { status: 400, headers: noStore });
  }

  try {
    const config = env();
    const settings = await readSettings(db());
    const result = await createBooking(raw, { ipKey: ipKey(request.headers) }, {
      db: db(),
      mailer: defaultMailer(),
      ownerEmail: config.CONTACT_TO_EMAIL,
      ownerName: settings.profile.name,
      siteUrl: settings.profile.website.replace(/\/$/, ""),
      sendConfirmation: config.CONTACT_SEND_CONFIRMATION,
    });
    const headers: Record<string, string> = { ...noStore };
    if ("retryAfter" in result && result.retryAfter) headers["Retry-After"] = String(result.retryAfter);
    return NextResponse.json(result.body, { status: result.status, headers });
  } catch (error) {
    log.error("booking.unhandled", { error });
    return NextResponse.json(
      { ok: false, error: "unavailable", message: "Your booking couldn't be saved just now. Please try again shortly, or email me." },
      { status: 503, headers: noStore },
    );
  }
}
