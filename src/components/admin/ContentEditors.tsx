"use client";

import { useActionState, useState, type ReactNode } from "react";
import {
  deleteExperienceAction,
  moveExperienceAction,
  saveExperienceAction,
  saveSettingAction,
} from "@/app/admin/_actions/content";
import type { ActionState } from "@/app/admin/_actions/shared";
import type { SettingKey, Settings } from "@/lib/content-schema";
import ActionButton from "./ActionButton";
import Upload from "./Upload";
import { buttonClass, inputClass, Panel, primaryButtonClass, quietButtonClass } from "./ui";

// ── Shared pieces ────────────────────────────────────────────────────────────

function SettingForm<K extends SettingKey>({
  settingKey,
  value,
  children,
}: {
  settingKey: K;
  value: Settings[K];
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveSettingAction.bind(null, settingKey), {});
  const errors = Object.entries(state.fields ?? {});
  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="payload" value={JSON.stringify(value)} />
      {children}
      {errors.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-lg border border-signal px-4 py-3 text-sm text-signal">
          {errors.map(([path, message]) => (
            <li key={path}>
              <span className="font-mono">{path || "value"}</span>: {message}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Saving…" : "Save"}
        </button>
        <p role="status" className={`text-sm ${state.ok === false ? "text-signal" : "text-muted"}`}>
          {state.message}
        </p>
      </div>
    </form>
  );
}

function Text({
  id,
  label,
  value,
  onChange,
  multiline,
  hint,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean | number;
  hint?: string;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="label text-muted">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} value={value} rows={typeof multiline === "number" ? multiline : 3} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      ) : (
        <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      )}
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}

/** A list of rows with add / remove / move controls. */
function RowList<T>({
  items,
  setItems,
  render,
  blank,
  noun,
  max = 20,
}: {
  items: T[];
  setItems: (items: T[]) => void;
  render: (item: T, update: (item: T) => void, index: number) => ReactNode;
  blank: T;
  noun: string;
  max?: number;
}) {
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j]!, next[i]!];
    setItems(next);
  };
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2 rounded-xl border border-line p-3">
          <div className="min-w-0 flex-1">{render(item, (v) => setItems(items.map((x, j) => (j === i ? v : x))), i)}</div>
          <div className="flex">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${noun} ${i + 1} up`} className={quietButtonClass}>
              ↑
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move ${noun} ${i + 1} down`} className={quietButtonClass}>
              ↓
            </button>
            <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label={`Remove ${noun} ${i + 1}`} className={quietButtonClass}>
              Remove
            </button>
          </div>
        </div>
      ))}
      {items.length < max && (
        <button type="button" onClick={() => setItems([...items, blank])} className={buttonClass}>
          Add {noun}
        </button>
      )}
    </div>
  );
}

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const csv = (s: string) => s.split(",").map((l) => l.trim()).filter(Boolean);

// ── Section editors ─────────────────────────────────────────────────────────

function ProfileEditor({ initial }: { initial: Settings["profile"] }) {
  const [v, setV] = useState(initial);
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV({ ...v, [k]: value });
  return (
    <SettingForm settingKey="profile" value={v}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Text id="profile-name" label="Name" value={v.name} onChange={(x) => set("name", x)} />
        <Text id="profile-role" label="Role" value={v.role} onChange={(x) => set("role", x)} />
        <Text id="profile-email" label="Public email" type="email" value={v.email} onChange={(x) => set("email", x)} />
        <Text id="profile-phone" label="Phone (optional)" value={v.phone} onChange={(x) => set("phone", x)} />
        <Text id="profile-location" label="Location" value={v.location} onChange={(x) => set("location", x)} />
        <Text id="profile-website" label="Website (canonical URL)" type="url" value={v.website} onChange={(x) => set("website", x)} />
      </div>
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
        <Text id="profile-photo" label="Portrait" value={v.photo} onChange={(x) => set("photo", x)} hint="A site path like /Photo.jpg, or upload a new one." />
        <Upload kind="image" label="Upload portrait" onUploaded={(a) => set("photo", a.url)} />
      </div>
      <fieldset>
        <legend className="label mb-2 text-muted">Social links</legend>
        <RowList
          items={v.social}
          setItems={(social) => set("social", social)}
          blank={{ label: "", href: "https://" }}
          noun="link"
          max={12}
          render={(item, update, i) => (
            <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
              <Text id={`social-label-${i}`} label="Label" value={item.label} onChange={(label) => update({ ...item, label })} />
              <Text id={`social-href-${i}`} label="URL" type="url" value={item.href} onChange={(href) => update({ ...item, href })} />
            </div>
          )}
        />
      </fieldset>
    </SettingForm>
  );
}

function HeroEditor({ initial }: { initial: Settings["hero"] }) {
  const [v, setV] = useState(initial);
  const [name, setName] = useState(initial.name.join("\n"));
  return (
    <SettingForm settingKey="hero" value={{ ...v, name: lines(name) }}>
      <Text id="hero-name" label="Headline (one line per row)" multiline={2} value={name} onChange={setName} hint="Each line is fitted to the full width." />
      <Text id="hero-eyebrow" label="Eyebrow" value={v.eyebrow} onChange={(eyebrow) => setV({ ...v, eyebrow })} />
      <Text id="hero-tagline" label="Tagline" value={v.tagline} onChange={(tagline) => setV({ ...v, tagline })} />
      <Text id="hero-intro" label="Introduction" multiline={4} value={v.intro} onChange={(intro) => setV({ ...v, intro })} />
    </SettingForm>
  );
}

function AboutEditor({ initial }: { initial: Settings["about"] }) {
  const [title, setTitle] = useState(initial.title);
  const [text, setText] = useState(initial.paragraphs.join("\n\n"));
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <SettingForm settingKey="about" value={{ title, paragraphs }}>
      <Text id="about-title" label="Title" value={title} onChange={setTitle} />
      <Text id="about-body" label="Paragraphs (separate with a blank line)" multiline={10} value={text} onChange={setText} />
    </SettingForm>
  );
}

function ContactEditor({ initial }: { initial: Settings["contact"] }) {
  const [v, setV] = useState(initial);
  const [title, setTitle] = useState(initial.title.join("\n"));
  return (
    <SettingForm settingKey="contact" value={{ ...v, title: lines(title) }}>
      <Text id="contact-title" label="Title (one line per row)" multiline={2} value={title} onChange={setTitle} />
      <Text id="contact-lede" label="Lede" multiline={3} value={v.lede} onChange={(lede) => setV({ ...v, lede })} />
      <Text
        id="contact-reply"
        label="Reply time shown after sending"
        value={v.replyWithin}
        onChange={(replyWithin) => setV({ ...v, replyWithin })}
        hint='Completes "I usually reply …", e.g. "within two working days".'
      />
    </SettingForm>
  );
}

function SkillsEditor({ initial }: { initial: Settings["skills"] }) {
  const [groups, setGroups] = useState(initial.map((g) => ({ title: g.title, skills: g.skills.join(", ") })));
  return (
    <SettingForm settingKey="skills" value={groups.map((g) => ({ title: g.title, skills: csv(g.skills) }))}>
      <RowList
        items={groups}
        setItems={setGroups}
        blank={{ title: "", skills: "" }}
        noun="group"
        max={10}
        render={(g, update, i) => (
          <div className="grid gap-3 sm:grid-cols-[14rem_1fr]">
            <Text id={`skills-title-${i}`} label="Group" value={g.title} onChange={(title) => update({ ...g, title })} />
            <Text id={`skills-list-${i}`} label="Skills (comma-separated)" value={g.skills} onChange={(skills) => update({ ...g, skills })} />
          </div>
        )}
      />
    </SettingForm>
  );
}

function StackEditor({ initial }: { initial: Settings["stack"] }) {
  const [items, setItems] = useState(initial.map((s) => ({ name: s.name, icon: s.icon ?? "" })));
  return (
    <SettingForm settingKey="stack" value={items.map((s) => (s.icon.trim() ? { name: s.name, icon: s.icon.trim() } : { name: s.name }))}>
      <p className="text-sm text-muted">
        The icon is a simple-icons slug (e.g. <code>react</code>, <code>nextdotjs</code>). Only marks the site already bundles show as logos;
        anything else is set as text.
      </p>
      <RowList
        items={items}
        setItems={setItems}
        blank={{ name: "", icon: "" }}
        noun="technology"
        max={40}
        render={(s, update, i) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <Text id={`stack-name-${i}`} label="Name" value={s.name} onChange={(name) => update({ ...s, name })} />
            <Text id={`stack-icon-${i}`} label="Icon slug (optional)" value={s.icon} onChange={(icon) => update({ ...s, icon })} />
          </div>
        )}
      />
    </SettingForm>
  );
}

function SeoEditor({ initial }: { initial: Settings["seo"] }) {
  const [v, setV] = useState({ ...initial, ogImage: initial.ogImage ?? "" });
  return (
    <SettingForm settingKey="seo" value={v}>
      <Text id="seo-title" label={`Page title (${v.title.length}/70)`} value={v.title} onChange={(title) => setV({ ...v, title })} />
      <Text id="seo-description" label={`Description (${v.description.length}/200)`} multiline={3} value={v.description} onChange={(description) => setV({ ...v, description })} />
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
        <Text
          id="seo-og"
          label="Social preview image (optional)"
          value={v.ogImage}
          onChange={(ogImage) => setV({ ...v, ogImage })}
          hint="Leave empty to use the generated preview card."
        />
        <Upload kind="image" label="Upload image" onUploaded={(a) => setV({ ...v, ogImage: a.url })} />
      </div>
    </SettingForm>
  );
}

function ResumeEditor({ initial }: { initial: Settings["resume"] }) {
  const [v, setV] = useState(initial);
  return (
    <SettingForm settingKey="resume" value={v}>
      <p className="rounded-lg border border-dashed border-line px-4 py-3 text-sm text-muted">
        The public site currently doesn&apos;t link to a CV, by your decision. The file stays available at <code>/resume</code> for links you
        send yourself.
      </p>
      <p>
        Current file:{" "}
        <a href={v.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
          {v.fileName}
        </a>
        {v.updatedAt && <span className="text-sm text-muted"> · updated {new Date(v.updatedAt).toLocaleDateString("en-GB")}</span>}
      </p>
      <Upload
        kind="document"
        label="Upload new PDF"
        onUploaded={(a) => setV({ url: a.url, fileName: a.name, updatedAt: new Date().toISOString() })}
      />
      <p className="text-sm text-muted">After uploading, press Save to make it the current CV.</p>
    </SettingForm>
  );
}

// ── Experience ─────────────────────────────────────────────────────────────

export type ExperienceItem = { id: string; period: string; title: string; place: string; kind: "Work" | "Study"; points: string[] };

function ExperienceForm({ entry, onDone }: { entry: ExperienceItem | null; onDone?: () => void }) {
  const [v, setV] = useState({
    period: entry?.period ?? "",
    title: entry?.title ?? "",
    place: entry?.place ?? "",
    kind: entry?.kind ?? ("Work" as "Work" | "Study"),
    points: entry?.points.join("\n") ?? "",
  });
  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (prev, form) => {
    const result = await saveExperienceAction(entry?.id ?? null, prev, form);
    if (result.ok && !entry) {
      setV({ period: "", title: "", place: "", kind: "Work", points: "" });
      onDone?.();
    }
    return result;
  }, {});
  const prefix = entry?.id ?? "new";
  const errors = state.fields ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="payload" value={JSON.stringify({ ...v, points: lines(v.points) })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Text id={`${prefix}-title`} label="Title" value={v.title} onChange={(title) => setV({ ...v, title })} />
        <Text id={`${prefix}-place`} label="Place" value={v.place} onChange={(place) => setV({ ...v, place })} />
        <Text id={`${prefix}-period`} label="Period" value={v.period} onChange={(period) => setV({ ...v, period })} hint="e.g. Jul 2024 — Present" />
        <div>
          <label htmlFor={`${prefix}-kind`} className="label text-muted">
            Kind
          </label>
          <select id={`${prefix}-kind`} value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value as "Work" | "Study" })} className={inputClass}>
            <option value="Work">Work</option>
            <option value="Study">Study</option>
          </select>
        </div>
      </div>
      <Text id={`${prefix}-points`} label="Points (one per line)" multiline={4} value={v.points} onChange={(points) => setV({ ...v, points })} />
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="text-sm text-signal">
          {Object.entries(errors)
            .map(([k, m]) => `${k}: ${m}`)
            .join(" · ")}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Saving…" : entry ? "Save entry" : "Add entry"}
        </button>
        <p role="status" className={`text-sm ${state.ok === false ? "text-signal" : "text-muted"}`}>
          {state.message}
        </p>
      </div>
    </form>
  );
}

function ExperienceEditor({ entries }: { entries: ExperienceItem[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-4">
      {entries.length === 0 && <p className="text-muted">No entries. The Record section shows nothing until you add one.</p>}
      <ol className="space-y-4">
        {entries.map((entry, i) => (
          <li key={entry.id} className="rounded-xl border border-line p-4">
            <details>
              <summary className="flex min-h-11 cursor-pointer flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium">{entry.title}</span>
                <span className="text-sm text-muted">
                  {entry.place} · {entry.period} · {entry.kind}
                </span>
              </summary>
              <div className="mt-4">
                <ExperienceForm entry={entry} />
              </div>
            </details>
            <div className="mt-2 flex flex-wrap gap-2">
              {i > 0 && (
                <ActionButton action={() => moveExperienceAction(entry.id, -1)} className={quietButtonClass} label={`Move ${entry.title} up`}>
                  ↑
                </ActionButton>
              )}
              {i < entries.length - 1 && (
                <ActionButton action={() => moveExperienceAction(entry.id, 1)} className={quietButtonClass} label={`Move ${entry.title} down`}>
                  ↓
                </ActionButton>
              )}
              <ActionButton action={() => deleteExperienceAction(entry.id)} className={quietButtonClass} confirm="Press again to delete" label={`Delete ${entry.title}`}>
                Delete
              </ActionButton>
            </div>
          </li>
        ))}
      </ol>
      {adding ? (
        <div className="rounded-xl border border-fg p-4">
          <ExperienceForm entry={null} onDone={() => setAdding(false)} />
          <button type="button" onClick={() => setAdding(false)} className={`${quietButtonClass} mt-2`}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className={buttonClass}>
          Add entry
        </button>
      )}
    </div>
  );
}

// ── Page body ──────────────────────────────────────────────────────────────


export default function ContentEditors({ settings, experience }: { settings: Settings; experience: ExperienceItem[] }) {
  return (
    <div className="space-y-8">
      <Panel id="hero" title="Introduction">
        <HeroEditor initial={settings.hero} />
      </Panel>
      <Panel id="about" title="About">
        <AboutEditor initial={settings.about} />
      </Panel>
      <Panel id="skills" title="Skills (spec sheet)">
        <SkillsEditor initial={settings.skills} />
      </Panel>
      <Panel id="stack" title="Stack (logo carousel)">
        <StackEditor initial={settings.stack} />
      </Panel>
      <Panel id="experience" title="Experience (Record)">
        <ExperienceEditor entries={experience} />
      </Panel>
      <Panel id="profile" title="Profile & social links">
        <ProfileEditor initial={settings.profile} />
      </Panel>
      <Panel id="contact" title="Contact copy">
        <ContactEditor initial={settings.contact} />
      </Panel>
      <Panel id="seo" title="SEO">
        <SeoEditor initial={settings.seo} />
      </Panel>
      <Panel id="resume" title="CV file">
        <ResumeEditor initial={settings.resume} />
      </Panel>
    </div>
  );
}
