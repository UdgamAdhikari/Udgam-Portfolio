import type { MetadataRoute } from "next";
import { getProjects, getSettings } from "@/server/content/public";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ profile }, projects] = await Promise.all([getSettings(), getProjects()]);
  return [
    { url: profile.website, changeFrequency: "monthly", priority: 1 },
    ...projects
      .filter((project) => project.featured)
      .map((project) => ({
        url: `${profile.website}/work/${project.slug}`,
        lastModified: project.updatedAt,
        changeFrequency: "yearly" as const,
        priority: 0.7,
      })),
  ];
}
