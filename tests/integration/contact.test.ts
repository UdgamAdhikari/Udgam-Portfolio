// @vitest-environment node
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/server/db/client";
import { inquiries } from "@/server/db/schema";
import { EmailDeliveryError, type Email, type Mailer } from "@/server/email/mailer";
import { issueFormToken } from "@/server/security/bot";
import { retryFailedNotifications, submitInquiry, type SubmitDeps } from "@/server/contact/submit";
import { createTestDb, resetTestDb } from "../support/db";

let t: Awaited<ReturnType<typeof createTestDb>>;
let sent: Email[];
let key = 0;

const okMailer = (): Mailer => ({
  send: vi.fn(async (email: Email) => {
    sent.push(email);
    return { id: `email-${sent.length}` };
  }),
});
const failingMailer = (): Mailer => ({
  send: vi.fn(async () => {
    throw new EmailDeliveryError("Resend responded 500: internal", 500);
  }),
});

function deps(overrides: Partial<SubmitDeps> = {}): SubmitDeps {
  return {
    db: t.db,
    mailer: okMailer(),
    ownerEmail: "owner@example.com",
    ownerName: "Udgam Adhikari",
    replyWithin: "within two working days",
    siteUrl: "https://example.com",
    sendConfirmation: false,
    verifyHuman: async () => true,
    ...overrides,
  };
}

function payload(overrides: Record<string, unknown> = {}) {
  key++;
  return {
    idempotencyKey: `test-key-${String(key).padStart(8, "0")}-abcdef`,
    formToken: issueFormToken(Date.now() - 10_000),
    website: "",
    type: "project",
    name: "Ada Lovelace",
    email: "Ada@Example.com",
    company: "Analytical Engines",
    budget: "$5k – $15k",
    timeline: "1 – 3 months",
    message: `We need a dashboard for our engine telemetry, roughly ten screens. (#${key})`,
    ...overrides,
  };
}

const rows = () => t.db.select().from(inquiries);
const ctx = { ipKey: "ip-a" };

beforeAll(async () => {
  t = await createTestDb();
});
beforeEach(async () => {
  await resetTestDb(t.client);
  sent = [];
});
afterAll(async () => {
  await t.close();
});

describe("contact submission — happy path", () => {
  it("saves a valid inquiry, notifies the owner, and only then reports success", async () => {
    const d = deps();
    const result = await submitInquiry(payload(), ctx, d);

    expect(result.status).toBe(201);
    expect(result.body).toMatchObject({ ok: true, reference: expect.stringMatching(/^[0-9A-F]{8}$/) });

    const [row] = await rows();
    expect(row).toMatchObject({
      type: "project",
      name: "Ada Lovelace",
      email: "ada@example.com", // normalised
      company: "Analytical Engines",
      subject: "Project inquiry from Analytical Engines",
      status: "new",
      notification: "sent",
      details: { budget: "$5k – $15k", timeline: "1 – 3 months" },
    });
    expect(d.mailer.send).toHaveBeenCalledTimes(1);
    expect(sent[0]).toMatchObject({ to: "owner@example.com", replyTo: "ada@example.com", idempotencyKey: `inquiry-${row!.id}` });
  });

  it("escapes visitor input in the notification email", async () => {
    await submitInquiry(payload({ name: "<script>alert(1)</script>", message: "Hello <img src=x onerror=alert(1)> there friend" }), ctx, deps());
    expect(sent[0]!.html).not.toContain("<script>");
    expect(sent[0]!.html).not.toContain("<img src=x");
    expect(sent[0]!.html).toContain("&lt;script&gt;");
  });

  it("only stores the detail answers that belong to the inquiry type", async () => {
    await submitInquiry(payload({ type: "other", budget: "$15k+", role: "CTO" }), ctx, deps());
    const [row] = await rows();
    expect(row!.details).toEqual({});
  });
});

describe("contact submission — invalid input", () => {
  it.each([
    [{ email: "not-an-email" }, "email"],
    [{ name: "A" }, "name"],
    [{ message: "too short" }, "message"],
    [{ type: "spam" }, "type"],
    [{ type: "hiring", role: "" }, "role"],
    [{ budget: "a million dollars" }, "budget"],
    [{ type: "hiring", role: "Frontend", link: "javascript:alert(1)" }, "link"],
  ])("rejects %o with an error on %s and saves nothing", async (bad, field) => {
    const result = await submitInquiry(payload(bad), ctx, deps());
    expect(result.status).toBe(422);
    expect(result.body).toMatchObject({ ok: false, error: "validation" });
    expect((result.body as { fields: Record<string, string> }).fields[field]).toBeTruthy();
    expect(await rows()).toHaveLength(0);
  });

  it("rejects a malformed envelope (missing idempotency key)", async () => {
    const rest: Record<string, unknown> = payload();
    delete rest.idempotencyKey;
    const result = await submitInquiry(rest, ctx, deps());
    expect(result.status).toBe(400);
  });
});

describe("contact submission — failures", () => {
  it("keeps the message when email delivery fails, and marks it for retry", async () => {
    const d = deps({ mailer: failingMailer() });
    const result = await submitInquiry(payload(), ctx, d);

    // The message is safely stored, so the visitor is told it was received.
    expect(result.status).toBe(201);
    const [row] = await rows();
    expect(row).toMatchObject({ notification: "failed", notificationAttempts: 1, status: "new" });
    expect(row!.notificationError).toContain("500");
  });

  it("retries failed notifications later and records the success", async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60_000);
    await submitInquiry(payload({ formToken: issueFormToken(tenMinutesAgo.getTime() - 10_000) }), ctx, deps({ mailer: failingMailer(), now: () => tenMinutesAgo }));
    const mailer = okMailer();
    const summary = await retryFailedNotifications({ db: t.db, mailer, ownerEmail: "owner@example.com", siteUrl: "https://example.com" });
    expect(summary).toEqual({ attempted: 1, sent: 1 });
    const [row] = await rows();
    expect(row).toMatchObject({ notification: "sent", notificationAttempts: 2, notificationError: null });
  });

  it("marks the notification failed (not sent) when no owner address is configured", async () => {
    await submitInquiry(payload(), ctx, deps({ ownerEmail: undefined }));
    const [row] = await rows();
    expect(row!.notification).toBe("failed");
    expect(row!.notificationError).toMatch(/CONTACT_TO_EMAIL/);
  });

  it("reports failure (never success) when the database write fails, and sends no email", async () => {
    // Every query works except the insert into inquiries.
    const broken = new Proxy(t.db, {
      get(target, prop, receiver) {
        if (prop === "insert") {
          return (table: unknown) => {
            if (table === inquiries) throw new Error("connection terminated unexpectedly");
            return target.insert(table as never);
          };
        }
        const value = Reflect.get(target, prop, receiver);
        return typeof value === "function" ? value.bind(target) : value;
      },
    }) as Db;
    const d = deps({ db: broken });
    const result = await submitInquiry(payload(), ctx, d);

    expect(result.status).toBe(503);
    expect(result.body).toMatchObject({ ok: false, error: "unavailable" });
    expect(d.mailer.send).not.toHaveBeenCalled();
    expect(await rows()).toHaveLength(0);
  });

  it("reports failure when the database is unreachable", async () => {
    const isolated = await createTestDb();
    await isolated.client.close();
    const result = await submitInquiry(payload(), ctx, deps({ db: isolated.db }));
    expect(result.status).toBe(503);
  });
});

describe("contact submission — duplicates", () => {
  it("treats a retry with the same idempotency key as the same submission", async () => {
    const d = deps();
    const body = payload();
    const first = await submitInquiry(body, ctx, d);
    const second = await submitInquiry(body, ctx, d);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body).toMatchObject({ ok: true, duplicate: true, reference: (first.body as { reference: string }).reference });
    expect(await rows()).toHaveLength(1);
    expect(d.mailer.send).toHaveBeenCalledTimes(1);
  });

  it("handles concurrent double-submits with one row", async () => {
    const d = deps();
    const body = payload();
    const results = await Promise.all([submitInquiry(body, ctx, d), submitInquiry(body, ctx, d), submitInquiry(body, ctx, d)]);
    expect(results.every((r) => r.body.ok)).toBe(true);
    expect(await rows()).toHaveLength(1);
  });

  it("catches the same message sent again from a new form session", async () => {
    const body = payload();
    await submitInquiry(body, ctx, deps());
    const again = await submitInquiry({ ...body, idempotencyKey: "another-key-0000000000" }, ctx, deps());
    expect(again.status).toBe(200);
    expect(again.body).toMatchObject({ duplicate: true });
    expect(await rows()).toHaveLength(1);
  });

  it("refuses to reuse an idempotency key for different content", async () => {
    const body = payload();
    await submitInquiry(body, ctx, deps());
    const changed = await submitInquiry({ ...body, message: "A completely different message, long enough to be valid." }, ctx, deps());
    expect(changed.status).toBe(409);
    expect(await rows()).toHaveLength(1);
  });
});

describe("contact submission — abuse protection", () => {
  it("rate limits one address after 5 messages in 10 minutes", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await submitInquiry(payload(), ctx, deps())).status);
    expect(statuses).toEqual([201, 201, 201, 201, 201, 429]);
    expect(await rows()).toHaveLength(5);

    // A different visitor is unaffected.
    expect((await submitInquiry(payload(), { ipKey: "ip-b" }, deps())).status).toBe(201);
  });

  it("returns Retry-After information when limited", async () => {
    for (let i = 0; i < 5; i++) await submitInquiry(payload(), ctx, deps());
    const limited = await submitInquiry(payload(), ctx, deps());
    expect(limited.status).toBe(429);
    expect("retryAfter" in limited && limited.retryAfter).toBeGreaterThan(0);
  });

  it("lets the window reset after it expires", async () => {
    const past = new Date(Date.now() - 11 * 60_000);
    for (let i = 0; i < 5; i++) {
      await submitInquiry(payload({ formToken: issueFormToken(past.getTime() - 10_000) }), ctx, deps({ now: () => past }));
    }
    expect((await submitInquiry(payload(), ctx, deps())).status).toBe(201);
  });

  it("rejects a filled honeypot without saving", async () => {
    const result = await submitInquiry(payload({ website: "http://spam.example" }), ctx, deps());
    expect(result.status).toBe(400);
    expect(await rows()).toHaveLength(0);
  });

  it("rejects forms submitted faster than a person can type", async () => {
    const result = await submitInquiry(payload({ formToken: issueFormToken(Date.now() - 500) }), ctx, deps());
    expect(result.status).toBe(429);
    expect(result.body).toMatchObject({ error: "too_fast" });
  });

  it("rejects forged and expired form tokens", async () => {
    expect((await submitInquiry(payload({ formToken: `${Date.now() - 10_000}.forged-signature` }), ctx, deps())).body).toMatchObject({ error: "expired" });
    expect((await submitInquiry(payload({ formToken: issueFormToken(Date.now() - 7 * 3600_000) }), ctx, deps())).status).toBe(400);
    expect(await rows()).toHaveLength(0);
  });

  it("rejects when the human check fails", async () => {
    const result = await submitInquiry(payload(), ctx, deps({ verifyHuman: async () => false }));
    expect(result.status).toBe(403);
    expect(await rows()).toHaveLength(0);
  });

  it("sends at most one visitor confirmation per address per day, with none of their text in it", async () => {
    const d = deps({ sendConfirmation: true });
    await submitInquiry(payload({ name: "Visit spam.example now" }), ctx, d);
    await submitInquiry(payload(), ctx, d);
    const confirmations = sent.filter((e) => e.to === "ada@example.com");
    expect(confirmations).toHaveLength(1);
    expect(confirmations[0]!.html).not.toContain("spam.example");
    expect(confirmations[0]!.text).not.toContain("engine telemetry");
  });
});

describe("contact submission — stored data", () => {
  it("stores no IP address or user agent", async () => {
    await submitInquiry(payload(), ctx, deps());
    const [row] = await t.db.select().from(inquiries).where(eq(inquiries.type, "project"));
    expect(JSON.stringify(row)).not.toContain("ip-a");
  });
});
