import "server-only";
import { eq, lt, or } from "drizzle-orm";
import type { Db } from "@/server/db/client";
import { sessions } from "@/server/db/schema";
import { isProduction } from "@/server/env";
import { randomToken, sha256 } from "@/server/security/crypto";

/**
 * Opaque, server-side sessions. The cookie holds a random 256-bit token; the
 * database holds only its sha256, so a database leak doesn't leak sessions.
 * A session ends after 7 days, or after 12 hours without activity.
 */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_IDLE_MS = 12 * 60 * 60 * 1000;
const TOUCH_AFTER_MS = 5 * 60 * 1000;

// __Host- cookies must be Secure, host-only and Path=/: they can't be set by
// a subdomain or over plain HTTP. Local HTTP development uses a plain name.
export const sessionCookieName = () => (isProduction() ? "__Host-admin_session" : "admin_session");

export const sessionCookieOptions = (expires: Date) => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: "strict" as const,
  path: "/",
  expires,
});

export async function createSession(db: Db, userAgent: string | null, now = new Date()) {
  const token = randomToken(32);
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await db.insert(sessions).values({
    id: sha256(token),
    createdAt: now,
    lastSeenAt: now,
    expiresAt,
    userAgent: userAgent?.slice(0, 200) ?? null,
  });
  return { token, expiresAt };
}

export async function validateSession(db: Db, token: string | undefined, now = new Date()) {
  if (!token || token.length < 32 || token.length > 100) return null;
  const id = sha256(token);
  const [session] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  if (!session) return null;
  const idleExpired = session.lastSeenAt.getTime() + SESSION_IDLE_MS <= now.getTime();
  if (session.expiresAt <= now || idleExpired) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }
  if (now.getTime() - session.lastSeenAt.getTime() > TOUCH_AFTER_MS) {
    await db.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.id, id));
  }
  return session;
}

export async function deleteSession(db: Db, token: string | undefined) {
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
}

export async function deleteAllSessions(db: Db) {
  await db.delete(sessions);
}

export async function purgeExpiredSessions(db: Db, now = new Date()) {
  await db
    .delete(sessions)
    .where(or(lt(sessions.expiresAt, now), lt(sessions.lastSeenAt, new Date(now.getTime() - SESSION_IDLE_MS))));
}
