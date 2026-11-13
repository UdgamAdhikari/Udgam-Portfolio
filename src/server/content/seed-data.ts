import { projects as staticProjects, record } from "@/data/content";
import { DEFAULT_SETTINGS } from "./defaults";

/** MDX case study → plain Markdown. `<Pending>x</Pending>` becomes a
 * `TO_CONFIRM: x` paragraph, which the renderer shows as a placeholder. */
export function mdxToMarkdown(mdx: string) {
  return mdx
    .replace(/^import .*$/gm, "")
    .replace(/<Pending>([\s\S]*?)<\/Pending>/g, (_, text: string) => `TO_CONFIRM: ${text.trim()}`)
    .replace(/<Pending\s*\/>/g, "TO_CONFIRM: To confirm")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildSeed(readCaseStudy: (slug: string) => string) {
  const now = new Date();
  return {
    settings: DEFAULT_SETTINGS,
    projects: staticProjects.map((p, position) => ({
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      body: mdxToMarkdown(readCaseStudy(p.slug)),
      // TO_CONFIRM stays: it renders as a visible "to confirm" marker.
      technologies: p.technologies,
      githubUrl: p.githubUrl ?? null,
      liveUrl: p.liveUrl ?? null,
      cover: p.image ? { ...p.image, alt: `Screenshot of ${p.title}` } : null,
      featured: p.featured,
      published: true,
      publishedAt: now,
      position,
    })),
    experience: record.map((r, position) => ({ ...r, position })),
  };
}
