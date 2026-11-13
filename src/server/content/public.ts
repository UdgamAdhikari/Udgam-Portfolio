import "server-only";
import { unstable_cache } from "next/cache";
import type { Settings } from "@/lib/content-schema";
import { db } from "@/server/db/client";
import type { ExperienceRow, ImageRef, ProjectRow } from "@/server/db/schema";
import { getPublishedProjectBySlug, listExperience, listPublishedProjects, readSettings } from "./repo";
import { TAGS } from "./tags";

/**
 * Cached readers for the public site. Pages are prerendered from these and
 * kept until an admin change revalidates the matching tag, so publishing
 * from the dashboard updates the site without a deploy, and visitors still
 * get static HTML. A one-hour revalidate is a safety net, not the mechanism.
 */

export type PublicProject = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  technologies: string[];
  githubUrl: string | null;
  liveUrl: string | null;
  image: ImageRef | null;
  gallery: ImageRef[];
  featured: boolean;
  updatedAt: string;
};

export type PublicExperience = Pick<ExperienceRow, "period" | "title" | "place" | "kind" | "points"> & { id: string };

const toPublic = (p: ProjectRow): PublicProject => ({
  slug: p.slug,
  title: p.title,
  summary: p.summary,
  body: p.body,
  technologies: p.technologies,
  githubUrl: p.githubUrl,
  liveUrl: p.liveUrl,
  image: p.cover,
  gallery: p.gallery,
  featured: p.featured,
  updatedAt: p.updatedAt.toISOString(),
});

const REVALIDATE = 3600;

export const getSettings = unstable_cache(async (): Promise<Settings> => readSettings(db()), ["public-settings"], {
  tags: [TAGS.settings],
  revalidate: REVALIDATE,
});

export const getProjects = unstable_cache(
  async (): Promise<PublicProject[]> => (await listPublishedProjects(db())).map(toPublic),
  ["public-projects"],
  { tags: [TAGS.projects], revalidate: REVALIDATE },
);

export const getProject = unstable_cache(
  async (slug: string): Promise<PublicProject | null> => {
    const row = await getPublishedProjectBySlug(db(), slug);
    return row ? toPublic(row) : null;
  },
  ["public-project"],
  { tags: [TAGS.projects], revalidate: REVALIDATE },
);

export const getExperience = unstable_cache(
  async (): Promise<PublicExperience[]> =>
    (await listExperience(db())).map(({ id, period, title, place, kind, points }) => ({ id, period, title, place, kind, points })),
  ["public-experience"],
  { tags: [TAGS.experience], revalidate: REVALIDATE },
);
