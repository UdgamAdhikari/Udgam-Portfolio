import "server-only";
import { hmac } from "./crypto";

/**
 * The client IP as reported by the hosting proxy. Only ever used hashed (for
 * rate limiting and daily visitor counts); it is never stored or logged raw.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return "unknown";
}

export const ipKey = (headers: Headers) => hmac(clientIp(headers), "ip").slice(0, 32);

/**
 * CSRF defence for Route Handlers that change state: the request must come
 * from a page on this same host. (Server Actions get the same check from
 * Next.js itself.) Browsers always send Origin on cross-site POSTs.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Visitors who ask not to be tracked (Global Privacy Control or DNT). */
export const optedOut = (headers: Headers) => headers.get("sec-gpc") === "1" || headers.get("dnt") === "1";
