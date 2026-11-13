import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { profile, projects, sections } from "@/data/content";

describe("content", () => {
  it("has a case-study seed file for every featured project", () => {
    for (const project of projects.filter((p) => p.featured)) {
      expect(existsSync(`src/content/work/${project.slug}.md`), project.slug).toBe(true);
    }
  });

  it("only uses local screenshots that exist (no stock imagery)", () => {
    for (const project of projects) {
      if (!project.image) continue;
      expect(project.image.src.startsWith("/"), project.slug).toBe(true);
      expect(existsSync(`public${project.image.src}`), project.image.src).toBe(true);
    }
  });

  it("has unique slugs and section ids", () => {
    expect(new Set(projects.map((p) => p.slug)).size).toBe(projects.length);
    expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length);
  });

  it("links the CV that ships with the site", () => {
    expect(existsSync(`public${profile.resumeUrl}`)).toBe(true);
  });
});
