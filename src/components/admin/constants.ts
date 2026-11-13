import type { ImageRef } from "@/server/db/schema";

// Plain values shared by server pages and client editors. They live here,
// not in the "use client" files: a value exported from a client module
// reaches a Server Component as a client reference, not as the value.

export type EditableProject = {
  title: string;
  slug: string;
  summary: string;
  body: string;
  technologies: string[];
  githubUrl: string;
  liveUrl: string;
  featured: boolean;
  cover: ImageRef | null;
  gallery: ImageRef[];
};

export const EMPTY_PROJECT: EditableProject = {
  title: "",
  slug: "",
  summary: "",
  body: "",
  technologies: [],
  githubUrl: "",
  liveUrl: "",
  featured: false,
  cover: null,
  gallery: [],
};

export const CONTENT_SECTIONS = [
  ["hero", "Introduction"],
  ["about", "About"],
  ["skills", "Skills"],
  ["stack", "Stack"],
  ["experience", "Experience"],
  ["profile", "Profile & social"],
  ["contact", "Contact copy"],
  ["seo", "SEO"],
  ["resume", "CV file"],
] as const;
