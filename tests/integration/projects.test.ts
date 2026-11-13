// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, resetTestDb } from "../support/db";

const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
  headers: async () => new Headers(),
}));
const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag, revalidatePath }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw Object.assign(new Error(`REDIRECT ${to}`), { digest: `NEXT_REDIRECT;${to}` });
  },
}));
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T,>(fn: T) => fn }));

const { saveProject, setPublished, moveProject, deleteProject } = await import("@/server/admin/projects");
const { listProjects, listPublishedProjects, getPublishedProjectBySlug, readSettings, writeSetting } = await import(
  "@/server/content/repo"
);
const actions = await import("@/app/admin/_actions/projects");
const contentActions = await import("@/app/admin/_actions/content");
const { createSession, sessionCookieName } = await import("@/server/auth/session");
const { TAGS } = await import("@/server/content/tags");

let t: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => {
  t = await createTestDb();
});
beforeEach(async () => {
  await resetTestDb(t.client);
  jar.clear();
  revalidateTag.mockClear();
  revalidatePath.mockClear();
});
afterAll(() => t.close());

const base = {
  slug: "telemetry-dashboard",
  title: "Telemetry Dashboard",
  summary: "Live engine telemetry.",
  body: "## The problem\n\nEngines are noisy.",
  technologies: ["React", "TypeScript"],
  githubUrl: "https://github.com/example/telemetry",
  liveUrl: "",
  cover: { src: "/media/00000000-0000-4000-8000-000000000000", width: 1200, height: 800, alt: "Dashboard" },
  featured: true,
};

async function signIn() {
  const { token } = await createSession(t.db, "vitest");
  jar.set(sessionCookieName(), token);
}

describe("projects — creation and editing", () => {
  it("creates a project as an unpublished draft", async () => {
    const result = await saveProject(t.db, null, base);
    expect(result.ok).toBe(true);
    const [row] = await listProjects(t.db);
    expect(row).toMatchObject({ slug: base.slug, published: false, featured: true, liveUrl: null, position: 0 });
    expect(await listPublishedProjects(t.db)).toHaveLength(0);
  });

  it("edits a project's fields", async () => {
    const created = await saveProject(t.db, null, base);
    if (!created.ok) throw new Error("setup");
    const edited = await saveProject(t.db, created.id, { ...base, title: "Telemetry, Revised", technologies: ["Svelte"] });
    expect(edited.ok).toBe(true);
    const [row] = await listProjects(t.db);
    expect(row).toMatchObject({ title: "Telemetry, Revised", technologies: ["Svelte"] });
  });

  it("validates input: slug format, unique slug, safe URLs only", async () => {
    expect(await saveProject(t.db, null, { ...base, slug: "Not A Slug" })).toMatchObject({ ok: false, fields: { slug: expect.any(String) } });
    expect(await saveProject(t.db, null, { ...base, githubUrl: "javascript:alert(1)" })).toMatchObject({ ok: false, fields: { githubUrl: expect.any(String) } });
    expect(await saveProject(t.db, null, { ...base, cover: { ...base.cover, src: "//evil.example/x.png" } })).toMatchObject({ ok: false });
    await saveProject(t.db, null, base);
    expect(await saveProject(t.db, null, { ...base, title: "Copy" })).toMatchObject({ ok: false, fields: { slug: "Already in use" } });
  });
});

describe("projects — publishing", () => {
  it("publishing makes it public; unpublishing removes it", async () => {
    const created = await saveProject(t.db, null, base);
    if (!created.ok) throw new Error("setup");

    expect(await getPublishedProjectBySlug(t.db, base.slug)).toBeNull();
    const published = await setPublished(t.db, created.id, true);
    expect(published?.publishedAt).toBeInstanceOf(Date);
    expect(await getPublishedProjectBySlug(t.db, base.slug)).toMatchObject({ title: base.title });

    await setPublished(t.db, created.id, false);
    expect(await getPublishedProjectBySlug(t.db, base.slug)).toBeNull();
    expect(await listPublishedProjects(t.db)).toHaveLength(0);
  });

  it("the publish action revalidates the public pages that show the project", async () => {
    await signIn();
    const created = await saveProject(t.db, null, base);
    if (!created.ok) throw new Error("setup");

    expect(await actions.publishProject(created.id, true)).toMatchObject({ ok: true });
    expect(revalidateTag).toHaveBeenCalledWith(TAGS.projects, { expire: 0 });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith(`/work/${base.slug}`);

    revalidateTag.mockClear();
    expect(await actions.publishProject(created.id, false)).toMatchObject({ ok: true, message: expect.stringMatching(/Unpublished/) });
    expect(revalidateTag).toHaveBeenCalledWith(TAGS.projects, { expire: 0 });
  });

  it("editing a published project through the action updates the live site", async () => {
    await signIn();
    const created = await saveProject(t.db, null, base);
    if (!created.ok) throw new Error("setup");
    await setPublished(t.db, created.id, true);

    const form = new FormData();
    form.set("payload", JSON.stringify({ ...base, summary: "Now with alerts." }));
    const result = await actions.saveProjectAction(created.id, {}, form);
    expect(result).toMatchObject({ ok: true, message: expect.stringMatching(/live site/) });
    expect((await getPublishedProjectBySlug(t.db, base.slug))?.summary).toBe("Now with alerts.");
    expect(revalidateTag).toHaveBeenCalledWith(TAGS.projects, { expire: 0 });
  });

  it("saving a draft does not touch the public cache", async () => {
    await signIn();
    const created = await saveProject(t.db, null, base);
    if (!created.ok) throw new Error("setup");
    const form = new FormData();
    form.set("payload", JSON.stringify({ ...base, summary: "Draft change" }));
    await actions.saveProjectAction(created.id, {}, form);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("projects — ordering and deletion", () => {
  it("moves projects up and down", async () => {
    for (const slug of ["aa", "bb", "cc"]) await saveProject(t.db, null, { ...base, slug, title: slug.toUpperCase() });
    const [a] = await listProjects(t.db);
    await moveProject(t.db, a!.id, 1);
    expect((await listProjects(t.db)).map((p) => p.slug)).toEqual(["bb", "aa", "cc"]);
    expect(await moveProject(t.db, (await listProjects(t.db))[0]!.id, -1)).toBe(false);
  });

  it("deletes a project", async () => {
    const created = await saveProject(t.db, null, base);
    if (!created.ok) throw new Error("setup");
    expect(await deleteProject(t.db, created.id)).toMatchObject({ slug: base.slug });
    expect(await listProjects(t.db)).toHaveLength(0);
  });
});

describe("site content settings", () => {
  it("falls back to defaults, then serves saved values", async () => {
    expect((await readSettings(t.db)).about.title).toBeTruthy();
    await writeSetting(t.db, "about", { title: "New title", paragraphs: ["One."] });
    expect((await readSettings(t.db)).about).toEqual({ title: "New title", paragraphs: ["One."] });
  });

  it("the settings action validates and refreshes the public site", async () => {
    await signIn();
    const bad = new FormData();
    bad.set("payload", JSON.stringify({ title: "", paragraphs: [] }));
    expect(await contentActions.saveSettingAction("about", {}, bad)).toMatchObject({ ok: false });

    const good = new FormData();
    good.set("payload", JSON.stringify({ title: "About me", paragraphs: ["Hello."] }));
    expect(await contentActions.saveSettingAction("about", {}, good)).toMatchObject({ ok: true });
    expect(revalidateTag).toHaveBeenCalledWith(TAGS.settings, { expire: 0 });
  });

  it("rejects social links that aren't http(s)", async () => {
    await expect(writeSetting(t.db, "profile", { ...(await readSettings(t.db)).profile, social: [{ label: "X", href: "javascript:alert(1)" }] })).rejects.toThrow();
  });
});
