import "server-only";
import { eq } from "drizzle-orm";
import { experienceSchema } from "@/lib/content-schema";
import type { Db } from "@/server/db/client";
import { experience } from "@/server/db/schema";
import { listExperience, nextPosition, reorder } from "@/server/content/repo";

export async function saveExperience(db: Db, id: string | null, input: unknown) {
  const parsed = experienceSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { ok: false as const, message: "Some fields need attention.", fields };
  }
  if (id) {
    const [row] = await db.update(experience).set({ ...parsed.data, updatedAt: new Date() }).where(eq(experience.id, id)).returning({ id: experience.id });
    return row ? { ok: true as const, id: row.id } : { ok: false as const, message: "That entry no longer exists." };
  }
  const [row] = await db
    .insert(experience)
    .values({ ...parsed.data, position: await nextPosition(db, "experience") })
    .returning({ id: experience.id });
  return { ok: true as const, id: row!.id };
}

export async function moveExperience(db: Db, id: string, direction: -1 | 1) {
  const ids = (await listExperience(db)).map((e) => e.id);
  const i = ids.indexOf(id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= ids.length) return false;
  [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  await reorder(db, "experience", ids);
  return true;
}

export async function deleteExperience(db: Db, id: string) {
  const rows = await db.delete(experience).where(eq(experience.id, id)).returning({ id: experience.id });
  return rows.length > 0;
}
