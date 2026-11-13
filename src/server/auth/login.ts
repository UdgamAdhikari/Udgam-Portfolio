import "server-only";
import type { Db } from "@/server/db/client";
import { env } from "@/server/env";
import { log } from "@/server/log";
import { safeEqual } from "@/server/security/crypto";
import { rateLimitAll } from "@/server/security/rate-limit";
import { verifyPassword } from "./password-core";
import { createSession } from "./session";

export type LoginResult =
  | { ok: true; token: string; expiresAt: Date }
  | { ok: false; error: "invalid" | "rate_limited"; retryAfter?: number };

/**
 * Single-owner login. Failures are deliberately indistinguishable (wrong
 * email or wrong password), the password is always hashed even for a wrong
 * email so timing doesn't reveal which, and attempts are rate limited per IP
 * and globally to slow down distributed guessing.
 */
export async function attemptLogin(
  db: Db,
  input: { email: string; password: string; ipKey: string; userAgent: string | null },
): Promise<LoginResult> {
  const limit = await rateLimitAll(db, [
    { key: `login:ip:${input.ipKey}`, limit: 5, windowSeconds: 15 * 60 },
    { key: "login:global", limit: 30, windowSeconds: 60 * 60 },
  ]);
  if (!limit.allowed) {
    log.warn("auth.login.rate_limited");
    return { ok: false, error: "rate_limited", retryAfter: limit.retryAfter };
  }

  const { ADMIN_EMAIL, ADMIN_PASSWORD_HASH } = env();
  const emailMatches = safeEqual(input.email.trim().toLowerCase(), ADMIN_EMAIL);
  const passwordMatches = await verifyPassword(input.password, ADMIN_PASSWORD_HASH);

  if (!emailMatches || !passwordMatches) {
    log.warn("auth.login.failed");
    return { ok: false, error: "invalid" };
  }
  const session = await createSession(db, input.userAgent);
  log.info("auth.login.succeeded");
  return { ok: true, ...session };
}
