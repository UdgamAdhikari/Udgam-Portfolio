// @vitest-environment node
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { analyticsEvents, inquiries } from "@/server/db/schema";
import { resetEnvForTests } from "@/server/env";
import { createTestDb, resetTestDb } from "../support/db";

vi.mock("next/cache", () => ({ unstable_cache: <T,>(fn: T) => fn, revalidateTag: vi.fn(), revalidatePath: vi.fn() }));

const contactRoute = await import("@/app/api/contact/route");
const collectRoute = await import("@/app/api/collect/route");

let t: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => {
  t = await createTestDb();
});
beforeEach(() => resetTestDb(t.client));
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.RESEND_API_KEY;
  resetEnvForTests();
});
afterAll(() => t.close());

const HOST = "portfolio.test";

async function formToken() {
  const res = contactRoute.GET();
  expect(res.headers.get("cache-control")).toBe("no-store");
  const { formToken } = (await res.json()) as { formToken: string };
  // Pretend the visitor spent ten seconds on the form.
  const [issued, sig] = formToken.split(".");
  vi.useFakeTimers({ now: Number(issued) + 10_000, toFake: ["Date"] });
  return `${issued}.${sig}`;
}

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://${HOST}/api/contact`, {
    method: "POST",
    headers: { host: HOST, origin: `https://${HOST}`, "content-type": "application/json", "x-real-ip": "198.51.100.7", ...headers },
    body: JSON.stringify(body),
  });
}

const form = async () => ({
  idempotencyKey: crypto.randomUUID(),
  formToken: await formToken(),
  type: "hiring",
  name: "Grace Hopper",
  email: "grace@example.com",
  company: "Navy",
  role: "Senior Frontend Engineer",
  employment: "Full-time",
  message: "We're hiring a frontend engineer for our compiler tooling team.",
});

describe("POST /api/contact", () => {
  it("stores the inquiry and calls Resend with the expected request", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    resetEnvForTests();
    const fetchMock = vi.fn(async () => Response.json({ id: "email_123" }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await contactRoute.POST(post(await form()));
    vi.useRealTimers();
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ ok: true });

    const [row] = await t.db.select().from(inquiries);
    expect(row).toMatchObject({ type: "hiring", notification: "sent", subject: "Hiring: Senior Frontend Engineer at Navy" });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test_key");
    expect((init.headers as Record<string, string>)["Idempotency-Key"]).toBe(`inquiry-${row!.id}`);
    expect(JSON.parse(String(init.body))).toMatchObject({ to: ["owner@example.com"], reply_to: "grace@example.com" });
  });

  it("still saves the message when Resend is down, flagging the notification", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    resetEnvForTests();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("upstream error", { status: 502 })));
    const res = await contactRoute.POST(post(await form()));
    vi.useRealTimers();
    expect(res.status).toBe(201);
    const [row] = await t.db.select().from(inquiries);
    expect(row).toMatchObject({ notification: "failed", notificationError: expect.stringContaining("502") });
  });

  it("rejects cross-site posts (CSRF) and non-JSON bodies", async () => {
    const body = await form();
    vi.useRealTimers();
    expect((await contactRoute.POST(post(body, { origin: "https://evil.example" }))).status).toBe(403);
    const noOrigin = post(body);
    noOrigin.headers.delete("origin");
    expect((await contactRoute.POST(noOrigin)).status).toBe(403);
    expect((await contactRoute.POST(post(body, { "content-type": "text/plain" }))).status).toBe(415);
    expect(await t.db.select().from(inquiries)).toHaveLength(0);
  });

  it("sends Retry-After with 429s", async () => {
    let last: Response | undefined;
    for (let i = 0; i < 6; i++) last = await contactRoute.POST(post({ ...(await form()), message: `Distinct message number ${i} for the rate limit test.` }));
    vi.useRealTimers();
    expect(last!.status).toBe(429);
    expect(Number(last!.headers.get("retry-after"))).toBeGreaterThan(0);
  });
});

describe("POST /api/collect", () => {
  const beacon = (body: unknown, headers: Record<string, string> = {}) =>
    new Request(`https://${HOST}/api/collect`, {
      method: "POST",
      headers: { host: HOST, origin: `https://${HOST}`, "user-agent": "Mozilla/5.0 (iPhone) Mobile", "x-real-ip": "198.51.100.8", ...headers },
      body: JSON.stringify(body),
    });

  it("records a page view without storing the IP, user agent or full referrer", async () => {
    const res = await collectRoute.POST(beacon({ type: "pageview", path: "/work/x?utm=1", referrer: "https://news.ycombinator.com/item?id=1" }));
    expect(res.status).toBe(204);
    const [row] = await t.db.select().from(analyticsEvents);
    expect(row).toMatchObject({ type: "pageview", path: "/work/x", referrer: "news.ycombinator.com", device: "mobile" });
    expect(JSON.stringify(row)).not.toMatch(/198\.51|iPhone|item\?id/);
  });

  it("records nothing for visitors with Global Privacy Control or Do Not Track, or for bots", async () => {
    await collectRoute.POST(beacon({ type: "pageview", path: "/" }, { "sec-gpc": "1" }));
    await collectRoute.POST(beacon({ type: "pageview", path: "/" }, { dnt: "1" }));
    await collectRoute.POST(beacon({ type: "pageview", path: "/" }, { "user-agent": "Googlebot/2.1" }));
    expect(await t.db.select().from(analyticsEvents)).toHaveLength(0);
  });

  it("rejects malformed events", async () => {
    expect((await collectRoute.POST(beacon({ type: "anything", path: "/" }))).status).toBe(400);
    expect((await collectRoute.POST(beacon({ type: "pageview", path: "https://evil" }))).status).toBe(400);
  });
});
