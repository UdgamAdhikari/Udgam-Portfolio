import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate for the dashboard: no session cookie, no admin page. This
 * only saves a round trip — every admin page, action and data read verifies
 * the session against the database itself (src/server/auth/guard.ts).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const hasCookie = request.cookies.has("__Host-admin_session") || request.cookies.has("admin_session");
  if (!hasCookie) return NextResponse.redirect(new URL("/admin/login", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
