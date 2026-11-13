// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { sessions, inquiries, projects, settings } from "@/server/db/schema";
import { createTestDb, resetTestDb } from "../support/db";
import { ADMIN } from "../support/admin";

// Next's request APIs, replaced with a controllable cookie jar.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
  headers: async () => new Headers({ "user-agent": "vitest", "x-real-ip": "203.0.113.9" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw Object.assign(new Error(`REDIRECT ${to}`), { digest: `NEXT_REDIRECT;${to}` });
  },
}));
// React's request cache() memoises across a server request; here every call is its own request.
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T,>(fn: T) => fn }));

const { attemptLogin } = await import("@/server/auth/login");
const { createSession, validateSession, deleteSession, SESSION_IDLE_MS, SESSION_TTL_MS, sessionCookieName } = await import(
  "@/server/auth/session"
);
const { hashPassword, verifyPassword } = await import("@/server/auth/password-core");
const { requireAdmin, UnauthorizedError } = await import("@/server/auth/guard");

let t: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => {
  t = await createTestDb();
});
beforeEach(async () => {
  await resetTestDb(t.client);
  jar.clear();
});
afterAll(() => t.close());

describe("passwords", () => {
  it("verifies the right password and rejects others", async () => {
    const hash = await hashPassword("a long enough password");
    expect(hash).toMatch(/^scrypt\$32768\$8\$1\$/);
    expect(await verifyPassword("a long enough password", hash)).toBe(true);
    expect(await verifyPassword("a long enough passworD", hash)).toBe(false);
    expect(await verifyPassword("anything", "plaintext")).toBe(false);
  });
});

describe("login", () => {
  const login = (email: string, password: string, ipKey = "ip-1") =>
    attemptLogin(t.db, { email, password, ipKey, userAgent: "vitest" });

  it("creates a session for the owner's credentials (email case-insensitive)", async () => {
    const result = await login("Owner@Example.com", ADMIN.password);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.token.length).toBeGreaterThanOrEqual(43);
    const stored = await t.db.select().from(sessions);
    expect(stored).toHaveLength(1);
    // Only the hash of the token is stored.
    expect(stored[0]!.id).not.toBe(result.token);
  });

  it("gives the same answer for a wrong password and a wrong email", async () => {
    expect(await login(ADMIN.email, "wrong password")).toEqual({ ok: false, error: "invalid" });
    expect(await login("someone@else.com", ADMIN.password)).toEqual({ ok: false, error: "invalid" });
    expect(await t.db.select().from(sessions)).toHaveLength(0);
  });

  it("rate limits repeated attempts from one address, even with the right password", async () => {
    for (let i = 0; i < 5; i++) await login(ADMIN.email, "wrong");
    const blocked = await login(ADMIN.email, ADMIN.password);
    expect(blocked).toMatchObject({ ok: false, error: "rate_limited" });
    expect(await login(ADMIN.email, ADMIN.password, "ip-2")).toMatchObject({ ok: true });
  });
});

describe("sessions", () => {
  it("accepts a fresh session and rejects tampered tokens", async () => {
    const { token } = await createSession(t.db, "ua");
    expect(await validateSession(t.db, token)).not.toBeNull();
    expect(await validateSession(t.db, `${token.slice(0, -1)}x`)).toBeNull();
    expect(await validateSession(t.db, undefined)).toBeNull();
  });

  it("expires after the absolute lifetime", async () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const { token } = await createSession(t.db, "ua", start);
    // Keep it active so only the absolute limit applies.
    for (let h = 6; h < SESSION_TTL_MS / 3_600_000; h += 6) {
      expect(await validateSession(t.db, token, new Date(start.getTime() + h * 3_600_000))).not.toBeNull();
    }
    expect(await validateSession(t.db, token, new Date(start.getTime() + SESSION_TTL_MS + 1))).toBeNull();
  });

  it("expires after inactivity and is deleted", async () => {
    const start = new Date();
    const { token } = await createSession(t.db, "ua", start);
    expect(await validateSession(t.db, token, new Date(start.getTime() + SESSION_IDLE_MS + 1000))).toBeNull();
    expect(await t.db.select().from(sessions)).toHaveLength(0);
  });

  it("ends on logout", async () => {
    const { token } = await createSession(t.db, "ua");
    await deleteSession(t.db, token);
    expect(await validateSession(t.db, token)).toBeNull();
  });
});

describe("authorization", () => {
  it("requireAdmin rejects requests without a valid session cookie", async () => {
    await expect(requireAdmin()).rejects.toBeInstanceOf(UnauthorizedError);
    jar.set(sessionCookieName(), "x".repeat(43));
    await expect(requireAdmin()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("requireAdmin accepts a valid session cookie", async () => {
    const { token } = await createSession(t.db, "ua");
    jar.set(sessionCookieName(), token);
    await expect(requireAdmin()).resolves.toMatchObject({ id: expect.any(String) });
  });

  it("the login action sets an httpOnly session cookie and redirects", async () => {
    const { login } = await import("@/app/admin/_actions/auth");
    const form = new FormData();
    form.set("email", ADMIN.email);
    form.set("password", ADMIN.password);
    await expect(login({}, form)).rejects.toThrow("REDIRECT /admin");
    expect(jar.get(sessionCookieName())).toBeTruthy();
  });

  it("every admin Server Action refuses to run without a session and changes nothing", async () => {
    const [{ db }] = [t];
    const [project] = await db.insert(projects).values({ slug: "p", title: "P", summary: "S" }).returning();
    const [inquiry] = await db
      .insert(inquiries)
      .values({ idempotencyKey: "k".repeat(20), contentHash: "h", type: "other", name: "N", email: "n@e.com", subject: "s", message: "m" })
      .returning();

    const modules = {
      projects: await import("@/app/admin/_actions/projects"),
      inquiries: await import("@/app/admin/_actions/inquiries"),
      content: await import("@/app/admin/_actions/content"),
    };
    const form = new FormData();
    form.set("payload", JSON.stringify({ slug: "hacked", title: "Hacked", summary: "x", technologies: [] }));
    form.set("file", new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "a.png"));

    const calls: [string, () => Promise<unknown>][] = [
      ["saveProjectAction(new)", () => modules.projects.saveProjectAction(null, {}, form)],
      ["saveProjectAction(edit)", () => modules.projects.saveProjectAction(project!.id, {}, form)],
      ["publishProject", () => modules.projects.publishProject(project!.id, true)],
      ["featureProject", () => modules.projects.featureProject(project!.id, true)],
      ["moveProjectAction", () => modules.projects.moveProjectAction(project!.id, 1)],
      ["deleteProjectAction", () => modules.projects.deleteProjectAction(project!.id)],
      ["uploadAsset", () => modules.projects.uploadAsset(form)],
      ["updateInquiryStatus", () => modules.inquiries.updateInquiryStatus(inquiry!.id, "archived")],
      ["removeInquiry", () => modules.inquiries.removeInquiry(inquiry!.id)],
      ["retryInquiryNotification", () => modules.inquiries.retryInquiryNotification(inquiry!.id)],
      ["saveSettingAction", () => modules.content.saveSettingAction("about", {}, form)],
      ["saveExperienceAction", () => modules.content.saveExperienceAction(null, {}, form)],
      ["moveExperienceAction", () => modules.content.moveExperienceAction(project!.id, 1)],
      ["deleteExperienceAction", () => modules.content.deleteExperienceAction(project!.id)],
    ];

    // Guard against an action being added without being listed here.
    const exported = Object.values(modules).flatMap((m) => Object.entries(m).filter(([, v]) => typeof v === "function").map(([k]) => k));
    expect(new Set(calls.map(([name]) => name.replace(/\(.*\)$/, "")))).toEqual(new Set(exported));

    for (const [name, call] of calls) {
      await expect(call(), name).rejects.toBeInstanceOf(UnauthorizedError);
    }
    expect(await db.select().from(projects)).toMatchObject([{ slug: "p", published: false }]);
    expect(await db.select().from(inquiries)).toMatchObject([{ status: "new" }]);
    expect(await db.select().from(settings)).toHaveLength(0);
  });
});
