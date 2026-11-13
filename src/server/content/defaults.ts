import type { Settings } from "@/lib/content-schema";
import { about, contact, hero, profile, skillGroups, stack } from "@/data/content";

/**
 * Seed values for the editable settings, taken from the original static
 * content file. Used by `npm run db:seed`, and as a fallback for any setting
 * that has never been saved so a fresh database still renders a full page.
 */
export const DEFAULT_SETTINGS: Settings = {
  profile: {
    name: profile.name,
    role: profile.role,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    photo: profile.photo,
    website: profile.website,
    social: profile.social,
  },
  hero: { name: hero.name, eyebrow: hero.eyebrow, tagline: hero.tagline, intro: hero.intro },
  about: { title: about.title, paragraphs: about.paragraphs },
  contact: { title: contact.title, lede: contact.lede, replyWithin: "within two working days" },
  skills: skillGroups,
  stack,
  seo: {
    title: `${profile.name} — ${profile.role}`,
    description:
      "Udgam Adhikari is a frontend developer in Kathmandu, building responsive interfaces and reusable components with React, Next.js and TypeScript.",
    ogImage: "",
  },
  resume: { url: profile.resumeUrl, fileName: "UdgamAdhikari_CV.pdf" },
};
