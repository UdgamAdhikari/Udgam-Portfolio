import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/server/db/client";
import { sessionCookieName, validateSession } from "./session";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

/** The current admin session, or null. Memoised per request. */
export const currentSession = cache(async () => {
  const store = await cookies();
  return validateSession(db(), store.get(sessionCookieName())?.value);
});

/**
 * Authorization for every protected Server Action and data read. The proxy's
 * redirect is only a convenience; this check is the real gate.
 */
export async function requireAdmin() {
  const session = await currentSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

/** For admin pages: send signed-out visitors to the login screen. */
export async function requireAdminPage() {
  const session = await currentSession();
  if (!session) redirect("/admin/login");
  return session;
}
