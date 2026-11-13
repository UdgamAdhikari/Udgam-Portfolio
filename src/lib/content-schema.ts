import { z } from "zod";

/**
 * Shapes of the editable site content. The admin validates writes with these
 * and the public site trusts what it reads because it was validated on write.
 */

const line = (max = 200) => z.string().trim().min(1, "Required").max(max);
const optionalLine = (max = 200) => z.string().trim().max(max).default("");

export const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^https:\/\/|^http:\/\//i.test(v), "Must start with https://")
  .refine((v) => {
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  }, "Not a valid URL");

/** A path on this site (/media/…, /photo.jpg) or an absolute http(s) URL. */
export const assetUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => (v.startsWith("/") && !v.startsWith("//")) || /^https?:\/\//i.test(v), "Must be a site path or https:// URL");

export const imageRef = z.object({
  src: assetUrl,
  width: z.number().int().positive().max(20000),
  height: z.number().int().positive().max(20000),
  alt: z.string().trim().max(300).optional(),
  assetId: z.uuid().optional(),
});

export const profileSchema = z.object({
  name: line(80),
  role: line(80),
  email: z.email(),
  phone: optionalLine(40),
  location: line(80),
  photo: assetUrl,
  website: httpUrl,
  social: z.array(z.object({ label: line(40), href: httpUrl })).max(12),
});

export const heroSchema = z.object({
  /** The headline: the name, one fitted line per entry. */
  name: z.array(line(40)).min(1).max(3),
  eyebrow: line(120),
  tagline: line(160),
  intro: line(600),
});

export const aboutSchema = z.object({
  title: line(120),
  paragraphs: z.array(line(1200)).min(1).max(8),
});

export const contactCopySchema = z.object({
  title: z.array(line(40)).min(1).max(3),
  lede: line(400),
  /** Shown after a successful submission, e.g. "within two working days". */
  replyWithin: line(60),
});

export const skillsSchema = z
  .array(z.object({ title: line(60), skills: z.array(line(60)).min(1).max(20) }))
  .max(10);

/** The logo carousel. `icon` is a simple-icons slug; without one the name is set as type. */
export const stackSchema = z
  .array(z.object({ name: line(40), icon: z.string().trim().regex(/^[a-z0-9]+$/, "A simple-icons slug, e.g. react").max(40).optional() }))
  .max(40);

export const seoSchema = z.object({
  title: line(70),
  description: line(200),
  ogImage: assetUrl.optional().or(z.literal("")),
});

export const resumeSchema = z.object({
  url: assetUrl,
  fileName: line(120),
  updatedAt: z.string().optional(),
});

export const SETTINGS = {
  profile: profileSchema,
  hero: heroSchema,
  about: aboutSchema,
  contact: contactCopySchema,
  skills: skillsSchema,
  stack: stackSchema,
  seo: seoSchema,
  resume: resumeSchema,
} as const;

export type SettingKey = keyof typeof SETTINGS;
export type Settings = { [K in SettingKey]: z.output<(typeof SETTINGS)[K]> };

export const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and single hyphens only");

export const projectSchema = z.object({
  slug,
  title: line(100),
  summary: line(300),
  body: z.string().max(50_000).default(""),
  technologies: z.array(line(40)).max(20),
  githubUrl: httpUrl.optional().or(z.literal("").transform(() => undefined)),
  liveUrl: httpUrl.optional().or(z.literal("").transform(() => undefined)),
  cover: imageRef.nullable().default(null),
  gallery: z.array(imageRef).max(24).default([]),
  featured: z.boolean().default(false),
});

export type ProjectInput = z.input<typeof projectSchema>;

export const experienceSchema = z.object({
  period: line(40),
  title: line(100),
  place: line(120),
  kind: z.enum(["Work", "Study"]),
  points: z.array(line(400)).max(10),
});
