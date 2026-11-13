"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/guard";
import { attemptLogin } from "@/server/auth/login";
import { deleteAllSessions, deleteSession, sessionCookieName, sessionCookieOptions } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { ipKey } from "@/server/security/request";
import type { ActionState } from "./shared";

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !email || !password || password.length > 200) {
    return { ok: false, message: "Enter your email and password." };
  }
  const h = await headers();
  const result = await attemptLogin(db(), { email, password, ipKey: ipKey(h), userAgent: h.get("user-agent") });
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.error === "rate_limited"
          ? `Too many attempts. Try again in ${Math.ceil((result.retryAfter ?? 60) / 60)} minutes.`
          : "That email and password don't match.",
    };
  }
  (await cookies()).set(sessionCookieName(), result.token, sessionCookieOptions(result.expiresAt));
  redirect("/admin");
}

export async function logout() {
  const store = await cookies();
  await deleteSession(db(), store.get(sessionCookieName())?.value);
  store.delete(sessionCookieName());
  redirect("/admin/login");
}

/** Ends every session, including this one (e.g. after using a shared computer). */
export async function logoutEverywhere() {
  await requireAdmin();
  await deleteAllSessions(db());
  (await cookies()).delete(sessionCookieName());
  redirect("/admin/login");
}
