import { z } from "zod";

// ── When people can book a call ─────────────────────────────────────────────
// Edit these to change availability. Times are wall-clock times in Kathmandu.
// Nepal has no daylight saving, so a fixed UTC offset is exact.

export const BOOKING = {
  title: "30 min intro call",
  minutes: 30,
  timezone: "Asia/Kathmandu",
  utcOffsetMinutes: 5 * 60 + 45,
  /** Weekday (0 = Sunday) → bookable [start, end) windows, "HH:MM". */
  hours: {
    1: [["19:00", "21:30"]],
    2: [["19:00", "21:30"]],
    3: [["19:00", "21:30"]],
    4: [["19:00", "21:30"]],
    5: [["19:00", "21:30"]],
    6: [["10:00", "13:00"]],
  } as Partial<Record<number, [string, string][]>>,
  /** No slots sooner than this. */
  minNoticeHours: 12,
  /** How far ahead the calendar opens. */
  horizonDays: 30,
  where: "Online — I'll email you a Google Meet link",
} as const;

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number) as [number, number];
  return h * 60 + m;
};

/** "YYYY-MM-DD" for an instant, as the date in Kathmandu. */
export function kathmanduDate(instant: Date): string {
  return new Date(instant.getTime() + BOOKING.utcOffsetMinutes * 60_000).toISOString().slice(0, 10);
}

/** Every slot start (UTC) on one Kathmandu calendar date, ignoring notice and bookings. */
export function slotsOnDate(date: string): Date[] {
  const midnightUtc = Date.parse(`${date}T00:00:00Z`) - BOOKING.utcOffsetMinutes * 60_000;
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const out: Date[] = [];
  for (const [start, end] of BOOKING.hours[weekday] ?? []) {
    for (let m = toMinutes(start); m + BOOKING.minutes <= toMinutes(end); m += BOOKING.minutes) {
      out.push(new Date(midnightUtc + m * 60_000));
    }
  }
  return out;
}

/**
 * Bookable slot starts between now (plus notice) and the horizon, minus the
 * ones already taken. `taken` holds ISO strings of confirmed bookings.
 */
export function availableSlots(now: Date, taken: Iterable<string> = []): Date[] {
  const takenSet = new Set(taken);
  const earliest = now.getTime() + BOOKING.minNoticeHours * 3_600_000;
  const out: Date[] = [];
  const first = Date.parse(`${kathmanduDate(now)}T00:00:00Z`);
  for (let d = 0; d <= BOOKING.horizonDays; d++) {
    const date = new Date(first + d * 86_400_000).toISOString().slice(0, 10);
    for (const slot of slotsOnDate(date)) {
      if (slot.getTime() >= earliest && !takenSet.has(slot.toISOString())) out.push(slot);
    }
  }
  return out;
}

/** True when `iso` is a real, currently bookable slot start (ignoring other bookings). */
export function isBookableSlot(iso: string, now: Date): boolean {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime()) || instant.toISOString() !== iso) return false;
  return availableSlots(now).some((slot) => slot.getTime() === instant.getTime());
}

export const bookingRequest = z.object({
  start: z.string().max(40),
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z.string().trim().max(200).pipe(z.email("Please enter a valid email address.")),
  notes: z.string().trim().max(1000, "Please keep notes under 1000 characters.").optional().default(""),
  /** Hidden honeypot: real people leave it empty. */
  website: z.string().max(0).optional().default(""),
});

export type BookingRequest = z.infer<typeof bookingRequest>;

/** An .ics file for the booked call, so the visitor can add it to any calendar. */
export function icsFor({ start, ref, ownerName, ownerEmail }: { start: Date; ref: string; ownerName: string; ownerEmail: string }) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(start.getTime() + BOOKING.minutes * 60_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//udgamadhikari.com.np//booking//EN",
    "BEGIN:VEVENT",
    `UID:${ref}@udgamadhikari.com.np`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${BOOKING.title} with ${ownerName}`,
    `DESCRIPTION:${BOOKING.where}. Questions: ${ownerEmail}`,
    `ORGANIZER;CN=${ownerName}:mailto:${ownerEmail}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** A Google Calendar "add event" link for the booked call. */
export function googleCalendarUrl({ start, ownerName }: { start: Date; ownerName: string }) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(start.getTime() + BOOKING.minutes * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${BOOKING.title} with ${ownerName}`,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: BOOKING.where,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
