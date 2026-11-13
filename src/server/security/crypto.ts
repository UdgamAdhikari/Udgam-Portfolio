import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/server/env";

export const sha256 = (input: string | Buffer) => createHash("sha256").update(input).digest("hex");

export const hmac = (input: string, purpose: string) =>
  createHmac("sha256", `${purpose}:${env().APP_SECRET}`).update(input).digest("base64url");

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
