import "server-only";
import { env } from "@/server/env";
import { hmac, safeEqual } from "./crypto";

/**
 * Bot protection for the contact form, in layers:
 *  1. a honeypot field people never see;
 *  2. a signed form token issued when the form opens: submissions faster than
 *     a person could type, or replayed after hours, are rejected;
 *  3. Cloudflare Turnstile, when TURNSTILE_SECRET_KEY is configured.
 */
export const MIN_FILL_MS = 3_000;
export const MAX_TOKEN_AGE_MS = 6 * 60 * 60 * 1000;

export function issueFormToken(now = Date.now()) {
  const payload = `${now}`;
  return `${payload}.${hmac(payload, "form-token")}`;
}

export type TokenCheck = { ok: true } | { ok: false; reason: "invalid" | "too_fast" | "expired" };

export function checkFormToken(token: string, now = Date.now()): TokenCheck {
  const [issued, signature] = token.split(".");
  if (!issued || !signature || !/^\d{10,16}$/.test(issued)) return { ok: false, reason: "invalid" };
  if (!safeEqual(signature, hmac(issued, "form-token"))) return { ok: false, reason: "invalid" };
  const age = now - Number(issued);
  if (age < MIN_FILL_MS) return { ok: false, reason: "too_fast" };
  if (age > MAX_TOKEN_AGE_MS) return { ok: false, reason: "expired" };
  return { ok: true };
}

export async function verifyTurnstile(token: string | undefined, ip: string, fetcher: typeof fetch = fetch) {
  const secret = env().TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured: layers 1–2 still apply
  if (!token) return false;
  try {
    const res = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
