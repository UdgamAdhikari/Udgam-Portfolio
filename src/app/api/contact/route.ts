import { NextResponse } from "next/server";
import { contactDeps } from "@/server/contact/deps";
import { submitInquiry } from "@/server/contact/submit";
import { log } from "@/server/log";
import { issueFormToken } from "@/server/security/bot";
import { clientIp, ipKey, isSameOrigin } from "@/server/security/request";

export const dynamic = "force-dynamic";

const MAX_BODY = 32 * 1024;
const noStore = { "Cache-Control": "no-store" };

/** A signed timestamp the form must return; see server/security/bot.ts. */
export function GET() {
  return NextResponse.json({ formToken: issueFormToken() }, { headers: noStore });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "forbidden", message: "Cross-site submissions aren't accepted." }, { status: 403, headers: noStore });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "bad_request", message: "Expected JSON." }, { status: 415, headers: noStore });
  }

  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) {
      return NextResponse.json({ ok: false, error: "too_large", message: "That message is too long." }, { status: 413, headers: noStore });
    }
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request", message: "The form data couldn't be read." }, { status: 400, headers: noStore });
  }

  try {
    const result = await submitInquiry(raw, { ipKey: ipKey(request.headers) }, await contactDeps(clientIp(request.headers)));
    const headers: Record<string, string> = { ...noStore };
    if ("retryAfter" in result && result.retryAfter) headers["Retry-After"] = String(result.retryAfter);
    return NextResponse.json(result.body, { status: result.status, headers });
  } catch (error) {
    // e.g. the settings read failed before submitInquiry could run.
    log.error("contact.unhandled", { error });
    return NextResponse.json(
      { ok: false, error: "unavailable", message: "Your message couldn't be saved just now. Please try again shortly, or email me directly." },
      { status: 503, headers: noStore },
    );
  }
}
