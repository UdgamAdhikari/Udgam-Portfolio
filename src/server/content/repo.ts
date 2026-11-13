import "server-only";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { SETTINGS, type SettingKey, type Settings } from "@/lib/content-schema";
import type { Db } from "@/server/db/client";
import { experience, projects, settings } from "@/server/db/schema";
import { log } from "@/server/log";
import { DEFAULT_SETTINGS } from "./defaults";

// Uncached reads and writes. Public pages go through ./public.ts (cached);
// the admin reads through here so it always sees the latest data.

export async function readSettings(db: Db): Promise<Settings> {
  const rows = await db.select().from(settings);
  const out = { ...DEFAULT_SETTINGS } as Record<SettingKey, unknown>;
  for (const row of rows) {
    const key = row.key as SettingKey;
    if (!(key in SETTINGS)) continue;
    const parsed = SETTINGS[key].safeParse(row.value);
    if (parsed.success) out[key] = parsed.data;
    else log.warn("settings.invalid_row", { key });
  }
  return out as Settings;
}

export async function writeSetting<K extends SettingKey>(db: Db, key: K, value: unknown): Promise<Settings[K]> {
  const parsed = SETTINGS[key].parse(value) as Settings[K];
  await db
    .insert(settings)
    .values({ key, value: parsed, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value: parsed, updatedAt: new Date() } });
  return parsed;
}

export const listProjects = (db: Db) => db.select().from(projects).orderBy(asc(projects.position), asc(projects.createdAt));

export async function getProject(db: Db, id: string) {
  const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return row ?? null;
}

export const listPublishedProjects = (db: Db) =>
  db.select().from(projects).where(eq(projects.published, true)).orderBy(asc(projects.position), asc(projects.createdAt));

export async function getPublishedProjectBySlug(db: Db, slug: string) {
  const [row] = await db
    .select()
    .from(projects)
    .where(sql`${projects.slug} = ${slug} and ${projects.published} = true`)
    .limit(1);
  return row ?? null;
}

export const listExperience = (db: Db) => db.select().from(experience).orderBy(asc(experience.position), asc(experience.createdAt));

/** Persist a new order: ids in the order they should appear. */
export async function reorder(db: Db, table: "projects" | "experience", ids: string[]) {
  const t = table === "projects" ? projects : experience;
  await db.transaction(async (tx) => {
    const existing = await tx.select({ id: t.id }).from(t).where(inArray(t.id, ids));
    if (existing.length !== ids.length || new Set(ids).size !== ids.length) throw new Error("Unknown or repeated ids");
    for (const [position, id] of ids.entries()) {
      await tx.update(t).set({ position, updatedAt: new Date() }).where(eq(t.id, id));
    }
  });
}

export async function nextPosition(db: Db, table: "projects" | "experience") {
  const t = table === "projects" ? projects : experience;
  const [row] = await db.select({ max: sql<number>`coalesce(max(${t.position}), -1)` }).from(t);
  return Number(row?.max ?? -1) + 1;
}
