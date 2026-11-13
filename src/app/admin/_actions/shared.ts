import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { TAGS } from "@/server/content/tags";

export type ActionState = { ok?: boolean; message?: string; fields?: Record<string, string>; id?: string };

/**
 * Expire the public pages that show a piece of content. `{ expire: 0 }`
 * makes the next visitor get fresh data instead of a stale copy.
 */
export function refreshPublic(kind: keyof typeof TAGS, slugs: string[] = []) {
  revalidateTag(TAGS[kind], { expire: 0 });
  revalidatePath("/");
  if (kind === "projects" || kind === "settings") {
    for (const slug of slugs) revalidatePath(`/work/${slug}`);
    revalidatePath("/work/[slug]", "page");
    revalidatePath("/sitemap.xml");
  }
  if (kind === "settings") revalidatePath("/", "layout");
}

/** Parse the JSON payload the client editors post in a hidden field. */
export function payload(formData: FormData): unknown {
  const raw = formData.get("payload");
  if (typeof raw !== "string" || raw.length > 200_000) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);
