import "server-only";
import { eq } from "drizzle-orm";
import { projectSchema } from "@/lib/content-schema";
import type { Db } from "@/server/db/client";
import { projects } from "@/server/db/schema";
import { listProjects, nextPosition, reorder } from "@/server/content/repo";

export type SaveResult = { ok: true; id: string } | { ok: false; message: string; fields?: Record<string, string> };

export async function saveProject(db: Db, id: string | null, input: unknown): Promise<SaveResult> {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: "Some fields need attention.", fields };
  }
  const data = parsed.data;
  const values = {
    slug: data.slug,
    title: data.title,
    summary: data.summary,
    body: data.body,
    technologies: data.technologies,
    githubUrl: data.githubUrl ?? null,
    liveUrl: data.liveUrl ?? null,
    cover: data.cover,
    gallery: data.gallery,
    featured: data.featured,
    updatedAt: new Date(),
  };

  const [clash] = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, data.slug)).limit(1);
  if (clash && clash.id !== id) return { ok: false, message: "Another project already uses that slug.", fields: { slug: "Already in use" } };

  if (id) {
    const [row] = await db.update(projects).set(values).where(eq(projects.id, id)).returning({ id: projects.id });
    return row ? { ok: true, id: row.id } : { ok: false, message: "That project no longer exists." };
  }
  const [row] = await db
    .insert(projects)
    .values({ ...values, published: false, position: await nextPosition(db, "projects") })
    .returning({ id: projects.id });
  return { ok: true, id: row!.id };
}

export async function setPublished(db: Db, id: string, published: boolean) {
  const [current] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!current) return null;
  const [row] = await db
    .update(projects)
    .set({ published, publishedAt: published ? (current.publishedAt ?? new Date()) : current.publishedAt, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();
  return row ?? null;
}

export async function setFeatured(db: Db, id: string, featured: boolean) {
  const [row] = await db.update(projects).set({ featured, updatedAt: new Date() }).where(eq(projects.id, id)).returning({ slug: projects.slug });
  return row ?? null;
}

export async function moveProject(db: Db, id: string, direction: -1 | 1) {
  const ids = (await listProjects(db)).map((p) => p.id);
  const i = ids.indexOf(id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= ids.length) return false;
  [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  await reorder(db, "projects", ids);
  return true;
}

export async function deleteProject(db: Db, id: string) {
  const [row] = await db.delete(projects).where(eq(projects.id, id)).returning({ slug: projects.slug });
  return row ?? null;
}
