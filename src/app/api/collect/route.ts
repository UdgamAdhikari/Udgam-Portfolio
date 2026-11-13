import { eventSchema, isBot, recordEvent } from "@/server/analytics";
import { db } from "@/server/db/client";
import { log } from "@/server/log";
import { rateLimit } from "@/server/security/rate-limit";
import { clientIp, ipKey, isSameOrigin, optedOut } from "@/server/security/request";

export const dynamic = "force-dynamic";

const accepted = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const { headers } = request;
  // Opted-out visitors and bots get the same empty answer; nothing is stored.
  if (optedOut(headers) || isBot(headers.get("user-agent") ?? "")) return accepted();
  if (headers.get("origin") && !isSameOrigin(request)) return new Response(null, { status: 403 });

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 2048) return new Response(null, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const event = eventSchema.safeParse(body);
  if (!event.success) return new Response(null, { status: 400 });

  try {
    const limit = await rateLimit(db(), `collect:${ipKey(headers)}`, { limit: 120, windowSeconds: 60 });
    if (!limit.allowed) return new Response(null, { status: 429 });
    await recordEvent(db(), event.data, {
      ip: clientIp(headers),
      userAgent: headers.get("user-agent") ?? "",
      host: headers.get("x-forwarded-host") ?? headers.get("host"),
    });
  } catch (error) {
    log.warn("analytics.record_failed", { error });
  }
  return accepted();
}
