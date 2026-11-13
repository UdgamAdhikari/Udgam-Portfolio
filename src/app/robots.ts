import type { MetadataRoute } from "next";
import { getSettings } from "@/server/content/public";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { profile } = await getSettings();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${profile.website}/sitemap.xml`,
  };
}
