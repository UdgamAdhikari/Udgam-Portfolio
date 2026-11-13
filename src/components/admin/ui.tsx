import type { ReactNode } from "react";

// Shared, presentational pieces for the dashboard. Calm and utilitarian.

export const inputClass =
  "mt-1.5 block min-h-11 w-full rounded-lg border border-line bg-transparent px-3 py-2 text-base outline-none transition-colors focus:border-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-signal aria-invalid:border-signal";

export const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-fg px-5 text-sm transition-colors hover:bg-fg hover:text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-50";

export const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-fg px-6 text-sm text-bg transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-50";

export const quietButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-3 text-sm text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-40";

export function PageHeader({ title, children, eyebrow }: { title: string; eyebrow?: string; children?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div>
        {eyebrow && <p className="label text-muted">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-3xl font-[620] [font-variation-settings:'wdth'_105] sm:text-4xl">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </header>
  );
}

export function Panel({ title, children, id, actions }: { title: string; children: ReactNode; id?: string; actions?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="scroll-mt-24 rounded-2xl border border-line p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id={id ? `${id}-title` : undefined} className="label text-muted">
          {title}
        </h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="rounded-2xl border border-line p-5">
      <p className="label text-muted">{label}</p>
      <p className="mt-2 font-display text-4xl font-[620] tabular-nums">{value}</p>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
    </div>
  );
}

const PILL: Record<string, string> = {
  new: "border-signal text-signal",
  read: "border-line text-fg",
  replied: "border-fg bg-fg text-bg",
  archived: "border-line text-muted",
  published: "border-fg bg-fg text-bg",
  draft: "border-dashed border-line text-muted",
  featured: "border-signal text-signal",
  failed: "border-signal bg-signal text-bg",
  pending: "border-dashed border-line text-muted",
  sent: "border-line text-muted",
};

export function Pill({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className={`label inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${PILL[tone] ?? "border-line text-muted"}`}>
      {children}
    </span>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-signal">
      {message}
    </p>
  );
}

export function DateTime({ value, withTime = true }: { value: Date | string; withTime?: boolean }) {
  const date = typeof value === "string" ? new Date(value) : value;
  const text = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
    timeZone: "Asia/Kathmandu",
  }).format(date);
  return <time dateTime={date.toISOString()}>{text}</time>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      <p className="text-lg">{title}</p>
      {children && <div className="mt-2 text-muted">{children}</div>}
    </div>
  );
}
