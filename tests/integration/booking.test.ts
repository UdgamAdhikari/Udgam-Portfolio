// @vitest-environment node
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cancelBooking, createBooking, openSlots, type BookingDeps } from "@/server/booking";
import { bookings } from "@/server/db/schema";
import type { Email, Mailer } from "@/server/email/mailer";
import { createTestDb, resetTestDb } from "../support/db";

let t: Awaited<ReturnType<typeof createTestDb>>;
let sent: Email[];
const now = new Date("2026-11-16T05:00:00Z");
const SLOT = "2026-11-17T13:15:00.000Z";

const deps = (overrides: Partial<BookingDeps> = {}): BookingDeps => ({
  db: t.db,
  mailer: { send: vi.fn(async (e: Email) => (sent.push(e), { id: "x" })) } satisfies Mailer,
  ownerEmail: "owner@example.com",
  ownerName: "Udgam Adhikari",
  siteUrl: "https://example.com",
  sendConfirmation: false,
  ...overrides,
});
const body = (extra: Record<string, unknown> = {}) => ({ start: SLOT, name: "Ada Lovelace", email: "ada@example.com", notes: "Hi", ...extra });

beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => t.close());
beforeEach(async () => {
  await resetTestDb(t.client);
  sent = [];
});

describe("bookings", () => {
  it("books an open slot, emails the owner and removes the slot", async () => {
    const result = await createBooking(body(), { ipKey: "ip1" }, deps(), now);
    expect(result.status).toBe(201);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe("owner@example.com");
    expect(sent[0]!.replyTo).toBe("ada@example.com");
    const [row] = await t.db.select().from(bookings);
    expect(row!.notification).toBe("sent");
    expect(await openSlots(t.db, now)).not.toContain(SLOT);
  });

  it("refuses a second booking for the same slot", async () => {
    await createBooking(body(), { ipKey: "ip1" }, deps(), now);
    const second = await createBooking(body({ email: "bob@example.com", name: "Bob" }), { ipKey: "ip2" }, deps(), now);
    expect(second.status).toBe(409);
  });

  it("rejects times that aren't real slots", async () => {
    const result = await createBooking(body({ start: "2026-11-17T13:20:00.000Z" }), { ipKey: "ip1" }, deps(), now);
    expect(result.status).toBe(409);
  });

  it("reports field errors", async () => {
    const result = await createBooking(body({ email: "nope", name: "" }), { ipKey: "ip1" }, deps(), now);
    expect(result.status).toBe(422);
    expect(Object.keys((result.body as { fields: Record<string, string> }).fields).sort()).toEqual(["email", "name"]);
  });

  it("keeps the booking when email isn't configured", async () => {
    const result = await createBooking(body(), { ipKey: "ip1" }, deps({ ownerEmail: undefined }), now);
    expect(result.status).toBe(201);
    const [row] = await t.db.select().from(bookings);
    expect(row!.notification).toBe("failed");
  });

  it("frees the slot when cancelled", async () => {
    await createBooking(body(), { ipKey: "ip1" }, deps(), now);
    const [row] = await t.db.select().from(bookings);
    expect(await cancelBooking(t.db, row!.id)).toBe(true);
    expect(await openSlots(t.db, now)).toContain(SLOT);
    const [after] = await t.db.select().from(bookings).where(eq(bookings.id, row!.id));
    expect(after!.status).toBe("cancelled");
    const rebook = await createBooking(body({ email: "bob@example.com" }), { ipKey: "ip2" }, deps(), now);
    expect(rebook.status).toBe(201);
  });
});
