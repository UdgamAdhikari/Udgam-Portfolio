import "server-only";
import type { Project, RecordEntry } from "@/data/content";
import { getExperience, getProject, getProjects, getSettings, type PublicProject } from "./public";

/**
 * Everything the public pages render, read from the database (cached, see
 * ./public.ts) and shaped like the original static content types so the
 * section components stay presentational.
 */
export type CaseStudy = Project & { body: string; gallery: PublicProject["gallery"] };

const toProject = (p: PublicProject): CaseStudy => ({
  slug: p.slug,
  title: p.title,
  summary: p.summary,
  technologies: p.technologies,
  featured: p.featured,
  ...(p.image ? { image: { src: p.image.src, width: p.image.width, height: p.image.height } } : {}),
  ...(p.githubUrl ? { githubUrl: p.githubUrl } : {}),
  ...(p.liveUrl ? { liveUrl: p.liveUrl } : {}),
  body: p.body,
  gallery: p.gallery,
});

export async function getSite() {
  const [settings, projects, experience] = await Promise.all([getSettings(), getProjects(), getExperience()]);
  return {
    // The CV link is stable; /resume redirects to whichever file is current.
    profile: { ...settings.profile, resumeUrl: "/resume" },
    hero: settings.hero,
    about: settings.about,
    contact: settings.contact,
    skillGroups: settings.skills,
    stack: settings.stack,
    seo: settings.seo,
    projects: projects.map(toProject),
    record: experience.map(({ period, title, place, kind, points }): RecordEntry => ({ period, title, place, kind, points })),
  };
}

export type Site = Awaited<ReturnType<typeof getSite>>;
export type SiteProfile = Site["profile"];

export async function getCaseStudy(slug: string) {
  const project = await getProject(slug);
  return project?.featured ? toProject(project) : null;
}
