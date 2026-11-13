"use client";

import { useActionState, useState } from "react";
import { saveProjectAction } from "@/app/admin/_actions/projects";
import type { ActionState } from "@/app/admin/_actions/shared";
import Markdown from "@/components/content/Markdown";
import type { EditableProject } from "./constants";
import Upload from "./Upload";
import { FieldError, inputClass, primaryButtonClass, quietButtonClass } from "./ui";

const slugify = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export default function ProjectEditor({ id, initial }: { id: string | null; initial: EditableProject }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveProjectAction.bind(null, id), {});
  const [p, setP] = useState(initial);
  const [tech, setTech] = useState(initial.technologies.join(", "));
  const [slugTouched, setSlugTouched] = useState(id !== null);
  const [preview, setPreview] = useState(false);
  const errors = state.fields ?? {};

  const set = <K extends keyof EditableProject>(key: K, value: EditableProject[K]) => setP((prev) => ({ ...prev, [key]: value }));

  const payload = JSON.stringify({
    ...p,
    technologies: tech
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  });

  const moveShot = (i: number, d: -1 | 1) =>
    setP((prev) => {
      const gallery = [...prev.gallery];
      const j = i + d;
      if (j < 0 || j >= gallery.length) return prev;
      [gallery[i], gallery[j]] = [gallery[j]!, gallery[i]!];
      return { ...prev, gallery };
    });

  const field = (key: keyof EditableProject, label: string, input: React.ReactNode, hint?: string) => (
    <div>
      <label htmlFor={`f-${key}`} className="label text-muted">
        {label}
      </label>
      {input}
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <FieldError id={`f-${key}-error`} message={errors[key]} />
    </div>
  );
  const aria = (key: string) => ({
    id: `f-${key}`,
    "aria-invalid": Boolean(errors[key]) || undefined,
    "aria-describedby": errors[key] ? `f-${key}-error` : undefined,
  });

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="payload" value={payload} />

      <div className="grid gap-6 lg:grid-cols-2">
        {field(
          "title",
          "Title",
          <input
            {...aria("title")}
            value={p.title}
            required
            maxLength={100}
            onChange={(e) => {
              set("title", e.target.value);
              if (!slugTouched) set("slug", slugify(e.target.value));
            }}
            className={inputClass}
          />,
        )}
        {field(
          "slug",
          "Slug (URL)",
          <input
            {...aria("slug")}
            value={p.slug}
            required
            maxLength={80}
            spellCheck={false}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value);
            }}
            className={`${inputClass} font-mono`}
          />,
          `Case study address: /work/${p.slug || "…"}`,
        )}
      </div>

      {field(
        "summary",
        "Summary (one line on the work index)",
        <textarea {...aria("summary")} value={p.summary} required maxLength={300} rows={2} onChange={(e) => set("summary", e.target.value)} className={inputClass} />,
      )}

      {field(
        "technologies",
        "Technologies",
        <input {...aria("technologies")} value={tech} onChange={(e) => setTech(e.target.value)} className={inputClass} />,
        "Comma-separated. The token TO_CONFIRM shows a visible “to confirm” marker on the site.",
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {field(
          "githubUrl",
          "Code URL (optional)",
          <input {...aria("githubUrl")} type="url" value={p.githubUrl} placeholder="https://" onChange={(e) => set("githubUrl", e.target.value)} className={inputClass} />,
        )}
        {field(
          "liveUrl",
          "Live site URL (optional)",
          <input {...aria("liveUrl")} type="url" value={p.liveUrl} placeholder="https://" onChange={(e) => set("liveUrl", e.target.value)} className={inputClass} />,
        )}
      </div>

      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" checked={p.featured} onChange={(e) => set("featured", e.target.checked)} className="size-5 accent-[var(--signal)]" />
        <span>Featured — gets a case-study page</span>
      </label>

      <fieldset className="rounded-2xl border border-line p-5">
        <legend className="label px-1 text-muted">Cover image</legend>
        {p.cover ? (
          <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element -- a preview of an upload */}
            <img src={p.cover.src} alt="" width={p.cover.width} height={p.cover.height} className="h-auto w-full rounded-lg border border-line" />
            <div className="space-y-3">
              <p className="text-sm text-muted">
                {p.cover.width} × {p.cover.height}px
              </p>
              <div>
                <label htmlFor="cover-alt" className="label text-muted">
                  Alt text
                </label>
                <input
                  id="cover-alt"
                  value={p.cover.alt ?? ""}
                  maxLength={300}
                  onChange={(e) => set("cover", { ...p.cover!, alt: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Upload kind="image" label="Replace" onUploaded={(a) => set("cover", { src: a.url, width: a.width!, height: a.height!, alt: p.cover?.alt ?? "", assetId: a.id })} />
                <button type="button" onClick={() => set("cover", null)} className={quietButtonClass}>
                  Remove cover
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted">No cover: the site shows the technology logos instead. Use real screenshots only.</p>
            <Upload kind="image" label="Upload cover" onUploaded={(a) => set("cover", { src: a.url, width: a.width!, height: a.height!, alt: `Screenshot of ${p.title}`, assetId: a.id })} />
          </>
        )}
        <FieldError id="f-cover-error" message={errors.cover} />
      </fieldset>

      <fieldset className="rounded-2xl border border-line p-5">
        <legend className="label px-1 text-muted">Gallery (shown under the case study)</legend>
        {p.gallery.length > 0 && (
          <ol className="mb-4 space-y-3">
            {p.gallery.map((shot, i) => (
              <li key={`${shot.src}-${i}`} className="grid items-center gap-3 sm:grid-cols-[8rem_1fr_auto]">
                {/* eslint-disable-next-line @next/next/no-img-element -- a preview of an upload */}
                <img src={shot.src} alt="" width={shot.width} height={shot.height} className="h-auto w-full rounded border border-line" />
                <div>
                  <label htmlFor={`shot-${i}`} className="label text-muted">
                    Caption / alt text for screenshot {i + 1}
                  </label>
                  <input
                    id={`shot-${i}`}
                    value={shot.alt ?? ""}
                    maxLength={300}
                    onChange={(e) =>
                      set(
                        "gallery",
                        p.gallery.map((g, j) => (j === i ? { ...g, alt: e.target.value } : g)),
                      )
                    }
                    className={inputClass}
                  />
                </div>
                <div className="flex">
                  <button type="button" disabled={i === 0} onClick={() => moveShot(i, -1)} aria-label={`Move screenshot ${i + 1} up`} className={quietButtonClass}>
                    ↑
                  </button>
                  <button type="button" disabled={i === p.gallery.length - 1} onClick={() => moveShot(i, 1)} aria-label={`Move screenshot ${i + 1} down`} className={quietButtonClass}>
                    ↓
                  </button>
                  <button type="button" onClick={() => set("gallery", p.gallery.filter((_, j) => j !== i))} aria-label={`Remove screenshot ${i + 1}`} className={quietButtonClass}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
        <Upload
          kind="image"
          label="Add screenshot"
          onUploaded={(a) => setP((prev) => ({ ...prev, gallery: [...prev.gallery, { src: a.url, width: a.width!, height: a.height!, alt: "", assetId: a.id }] }))}
        />
        <FieldError id="f-gallery-error" message={errors.gallery} />
      </fieldset>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <label htmlFor="f-body" className="label text-muted">
            Case study (Markdown)
          </label>
          <div role="group" aria-label="Editor mode" className="flex gap-1">
            <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)} className={`${quietButtonClass} ${!preview ? "text-fg underline" : ""}`}>
              Write
            </button>
            <button type="button" aria-pressed={preview} onClick={() => setPreview(true)} className={`${quietButtonClass} ${preview ? "text-fg underline" : ""}`}>
              Preview
            </button>
          </div>
        </div>
        {preview ? (
          <div className="mt-1.5 min-h-64 rounded-lg border border-line p-5">
            {p.body.trim() ? <Markdown>{p.body}</Markdown> : <p className="text-muted">Nothing to preview yet.</p>}
          </div>
        ) : (
          <textarea
            {...aria("body")}
            value={p.body}
            rows={18}
            maxLength={50_000}
            onChange={(e) => set("body", e.target.value)}
            className={`${inputClass} font-mono text-sm leading-relaxed`}
          />
        )}
        <p className="mt-1 text-sm text-muted">
          Use <code>## Headings</code>, lists and links. HTML isn&apos;t rendered. A paragraph starting with <code>TO_CONFIRM:</code> shows as a
          visible placeholder, so unconfirmed facts never read as finished.
        </p>
        <FieldError id="f-body-error" message={errors.body} />
      </div>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-line bg-bg px-4 py-4 sm:mx-0 sm:px-0">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Saving…" : id ? "Save changes" : "Create draft"}
        </button>
        <p role="status" className={`text-sm ${state.ok === false ? "text-signal" : "text-muted"}`}>
          {state.message}
        </p>
      </div>
    </form>
  );
}
