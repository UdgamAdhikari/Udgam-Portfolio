"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { BOOKING, googleCalendarUrl, icsFor } from "@/lib/booking";
import { OPEN_BOOKING } from "@/lib/booking-events";

type Step = "pick" | "details" | "done";
type Slots = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; slots: Date[] };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "YYYY-MM-DD" in the visitor's own timezone. */
const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function BookingDialog({ ownerName, ownerEmail, photo }: { ownerName: string; ownerEmail: string; photo: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>("pick");
  const [slots, setSlots] = useState<Slots>({ state: "loading" });
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<Date | null>(null);
  const [hour12, setHour12] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [ref, setRef] = useState("");
  const [values, setValues] = useState({ name: "", email: "", notes: "" });

  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const load = useCallback(async () => {
    setSlots({ state: "loading" });
    try {
      const res = await fetch("/api/booking", { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; slots?: string[]; message?: string };
      if (!json.ok || !json.slots) throw new Error(json.message);
      const list = json.slots.map((s) => new Date(s));
      setSlots({ state: "ready", slots: list });
      // Open on the first day that has a slot.
      if (list[0]) {
        setDay((current) => current ?? localDay(list[0]!));
        setMonth((current) => (list.some((s) => s.getMonth() === current.getMonth()) ? current : new Date(list[0]!.getFullYear(), list[0]!.getMonth(), 1)));
      }
    } catch (e) {
      setSlots({ state: "error", message: (e as Error).message || "Available times couldn't be loaded." });
    }
  }, []);

  // Opening: reset to the first step and fetch fresh availability.
  useEffect(() => {
    const open = () => {
      setStep("pick");
      setSlot(null);
      setError(null);
      setFields({});
      dialog.current?.showModal();
      document.documentElement.style.overflow = "hidden";
      void load();
    };
    window.addEventListener(OPEN_BOOKING, open);
    return () => window.removeEventListener(OPEN_BOOKING, open);
  }, [load]);

  const close = () => dialog.current?.close();

  const byDay = useMemo(() => {
    const map = new Map<string, Date[]>();
    if (slots.state === "ready") {
      for (const s of slots.slots) {
        const key = localDay(s);
        map.set(key, [...(map.get(key) ?? []), s]);
      }
    }
    return map;
  }, [slots]);

  const time = (d: Date) => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", hour12 }).format(d).toLowerCase();
  const longDate = (d: Date) => new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(d);

  // Calendar grid for the visible month, padded to whole weeks.
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: first.getDay() }, () => null),
      ...Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
    ];
  }, [month]);

  const months = useMemo(() => {
    if (slots.state !== "ready" || slots.slots.length === 0) return { prev: false, next: false };
    const firstSlot = slots.slots[0]!;
    const lastSlot = slots.slots[slots.slots.length - 1]!;
    return {
      prev: month > new Date(firstSlot.getFullYear(), firstSlot.getMonth(), 1),
      next: month < new Date(lastSlot.getFullYear(), lastSlot.getMonth(), 1),
    };
  }, [slots, month]);

  const daySlots = day ? (byDay.get(day) ?? []) : [];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!slot) return;
    setSending(true);
    setError(null);
    setFields({});
    const website = (new FormData(e.currentTarget as HTMLFormElement).get("website") as string) ?? "";
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: slot.toISOString(), ...values, website }),
      });
      const json = (await res.json()) as { ok: boolean; ref?: string; message?: string; error?: string; fields?: Record<string, string> };
      if (json.ok && json.ref) {
        setRef(json.ref);
        setStep("done");
        return;
      }
      setFields(json.fields ?? {});
      setError(json.message ?? "Something went wrong.");
      if (json.error === "slot_taken" || json.error === "slot_unavailable") {
        setStep("pick");
        setSlot(null);
        void load();
      }
    } catch {
      setError("You seem to be offline. Nothing was booked; please try again.");
    } finally {
      setSending(false);
    }
  };

  const downloadIcs = () => {
    if (!slot) return;
    const blob = new Blob([icsFor({ start: slot, ref, ownerName, ownerEmail })], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "call-with-udgam.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const input =
    "mt-1.5 w-full rounded-xl border border-line bg-[color-mix(in_srgb,var(--fg)_4%,var(--bg))] px-3 py-2 text-sm outline-none transition-colors focus:border-[color-mix(in_srgb,var(--fg)_40%,transparent)] aria-[invalid=true]:border-signal";

  // The summary column shared by every step.
  const summary = (
    <div className={`border-b border-line p-6 ${step === "pick" ? "lg:border-r lg:border-b-0" : "sm:border-r sm:border-b-0"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- small avatar, already optimised */}
      <img src={photo} alt="" className="size-10 rounded-full object-cover grayscale" />
      <p className="mt-3 text-sm text-muted">{ownerName}</p>
      <h2 id="booking-title" className="mt-1 text-xl font-medium">
        {BOOKING.title}
      </h2>
      <ul className="mt-5 space-y-3 text-sm text-muted">
        {slot && step !== "pick" && (
          <li className="flex gap-2.5 text-fg">
            <Icon d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
            <span>
              {longDate(slot)}
              <br />
              {time(slot)} – {time(new Date(slot.getTime() + BOOKING.minutes * 60_000))}
            </span>
          </li>
        )}
        <li className="flex gap-2.5">
          <Icon d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          {BOOKING.minutes} min
        </li>
        <li className="flex gap-2.5">
          <Icon d="M15 10l4.5-2.5v9L15 14M4 7h11v10H4z" />
          {BOOKING.where}
        </li>
        <li className="flex gap-2.5">
          <Icon d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
          {timezone.replace(/_/g, " ")}
        </li>
      </ul>
    </div>
  );

  return (
    <dialog
      ref={dialog}
      aria-labelledby="booking-title"
      onClose={() => (document.documentElement.style.overflow = "")}
      onClick={(e) => e.target === dialog.current && close()}
      className={`m-auto max-h-[calc(100svh-2rem)] ${step === "pick" ? "w-[min(100%-2rem,64rem)]" : "w-[min(100%-2rem,46rem)]"} overflow-y-auto rounded-3xl border border-line bg-bg p-0 text-fg shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45)] backdrop:bg-[rgb(0_0_0/0.45)] backdrop:backdrop-blur-sm open:animate-[booking-in_0.35s_var(--ease-settle)]`}
    >
      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-line hover:text-fg"
      >
        <Icon d="M6 6l12 12M18 6 6 18" />
      </button>

      {step === "done" && slot ? (
        <div className="px-6 py-10 sm:px-12">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-[color-mix(in_srgb,var(--fg)_8%,var(--bg))] text-signal">
            <Icon d="m5 12 4.5 4.5L19 7" />
          </div>
          <h2 id="booking-title" className="mt-4 text-center text-2xl font-medium">
            Your call is booked
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center text-muted">
            I&apos;ll email the meeting link to <span className="text-fg">{values.email}</span> before the call.
          </p>
          <dl className="mx-auto mt-8 grid max-w-xl gap-x-8 gap-y-4 rounded-2xl border border-line p-6 sm:grid-cols-[8rem_1fr]">
            <dt className="text-muted">What</dt>
            <dd>
              {BOOKING.title} between {ownerName} and {values.name}
            </dd>
            <dt className="text-muted">When</dt>
            <dd>
              {longDate(slot)}
              <br />
              {time(slot)} – {time(new Date(slot.getTime() + BOOKING.minutes * 60_000))}{" "}
              <span className="text-muted">({timezone.replace(/_/g, " ")})</span>
            </dd>
            <dt className="text-muted">Where</dt>
            <dd>{BOOKING.where}</dd>
            {values.notes && (
              <>
                <dt className="text-muted">Notes</dt>
                <dd className="whitespace-pre-line">{values.notes}</dd>
              </>
            )}
            <dt className="text-muted">Reference</dt>
            <dd className="font-mono text-sm">{ref}</dd>
          </dl>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-muted">Add to calendar</span>
            <a href={googleCalendarUrl({ start: slot, ownerName })} target="_blank" rel="noreferrer" className="rounded-full border border-line px-4 py-2 text-sm transition-colors hover:bg-line">
              Google
            </a>
            <button type="button" onClick={downloadIcs} className="rounded-full border border-line px-4 py-2 text-sm transition-colors hover:bg-line">
              Apple / Outlook (.ics)
            </button>
          </div>
          <p className="mt-8 text-center text-sm text-muted">
            Need to change it? Email{" "}
            <a href={`mailto:${ownerEmail}?subject=${encodeURIComponent(`Booking ${ref}`)}`} className="underline underline-offset-4">
              {ownerEmail}
            </a>
            .
          </p>
        </div>
      ) : step === "details" && slot ? (
        <div className="grid sm:grid-cols-[15rem_1fr]">
          {summary}
          <form onSubmit={submit} noValidate className="p-6">
            <label className="block text-sm font-medium">
              Your name <span className="text-signal">*</span>
              <input
                required
                autoComplete="name"
                value={values.name}
                aria-invalid={Boolean(fields.name)}
                onChange={(e) => setValues({ ...values, name: e.target.value })}
                className={input}
              />
              {fields.name && <span className="mt-1 block text-sm font-normal text-signal">{fields.name}</span>}
            </label>
            <label className="mt-4 block text-sm font-medium">
              Email address <span className="text-signal">*</span>
              <input
                required
                type="email"
                autoComplete="email"
                value={values.email}
                aria-invalid={Boolean(fields.email)}
                onChange={(e) => setValues({ ...values, email: e.target.value })}
                className={input}
              />
              {fields.email && <span className="mt-1 block text-sm font-normal text-signal">{fields.email}</span>}
            </label>
            <label className="mt-4 block text-sm font-medium">
              What would you like to talk about?
              <textarea
                rows={3}
                value={values.notes}
                aria-invalid={Boolean(fields.notes)}
                onChange={(e) => setValues({ ...values, notes: e.target.value })}
                placeholder="A role you're hiring for, a project, or anything that helps me prepare."
                className={`${input} resize-y placeholder:text-muted`}
              />
              {fields.notes && <span className="mt-1 block text-sm font-normal text-signal">{fields.notes}</span>}
            </label>
            {/* Honeypot: hidden from people, tempting to bots. */}
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0" />

            {error && (
              <p role="alert" className="mt-5 rounded-xl bg-[color-mix(in_srgb,var(--signal)_10%,var(--bg))] px-4 py-3 text-sm">
                {error}
              </p>
            )}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep("pick")}
                className="rounded-full border border-line bg-[color-mix(in_srgb,var(--fg)_6%,var(--bg))] px-5 py-2 text-sm text-fg shadow-[0_2px_8px_-2px_rgb(0_0_0/0.35)] transition-[background-color,translate] hover:-translate-y-px hover:bg-[color-mix(in_srgb,var(--fg)_12%,var(--bg))]"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={sending}
                className="rounded-full bg-fg px-5 py-2 text-sm font-medium text-bg shadow-[0_2px_8px_-2px_rgb(0_0_0/0.35)] transition-[opacity,translate] hover:-translate-y-px disabled:opacity-60"
              >
                {sending ? "Booking…" : "Confirm booking"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[18rem_1fr_16rem]">
          {summary}

          {/* Calendar */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              <p className="font-medium" aria-live="polite">
                {month.toLocaleDateString(undefined, { month: "long" })} <span className="text-muted">{month.getFullYear()}</span>
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Previous month"
                  disabled={!months.prev}
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                  className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-line hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Icon d="m15 6-6 6 6 6" />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  disabled={!months.next}
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                  className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-line hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Icon d="m9 6 6 6-6 6" />
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-1.5 text-center" role="grid" aria-label="Choose a day">
              {WEEKDAYS.map((w) => (
                <span key={w} className="pb-2 text-xs tracking-wide text-muted uppercase">
                  {w}
                </span>
              ))}
              {cells.map((date, i) => {
                if (!date) return <span key={`pad-${i}`} />;
                const key = localDay(date);
                const open = byDay.has(key);
                const selected = key === day;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!open}
                    aria-pressed={selected}
                    aria-label={`${date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}${open ? "" : ", unavailable"}`}
                    onClick={() => {
                      setDay(key);
                      setSlot(null);
                    }}
                    className={`aspect-square rounded-xl text-sm transition-[background-color,color,translate] ${
                      selected
                        ? "bg-fg font-medium text-bg"
                        : open
                          ? "bg-[color-mix(in_srgb,var(--fg)_8%,var(--bg))] font-medium hover:-translate-y-px hover:bg-[color-mix(in_srgb,var(--fg)_14%,var(--bg))]"
                          : "text-muted opacity-50"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Times */}
          <div className="border-t border-line p-6 lg:border-t-0 lg:border-l lg:pt-16">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">
                {day ? new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric" }) : "Pick a day"}
              </p>
              <div className="flex rounded-full border border-line p-0.5 text-xs" role="group" aria-label="Time format">
                {[true, false].map((h12) => (
                  <button
                    key={String(h12)}
                    type="button"
                    aria-pressed={hour12 === h12}
                    onClick={() => setHour12(h12)}
                    className={`rounded-full px-2.5 py-1 transition-colors ${hour12 === h12 ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}
                  >
                    {h12 ? "12h" : "24h"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid max-h-80 gap-2 overflow-y-auto pr-1">
              {slots.state === "loading" &&
                Array.from({ length: 4 }, (_, i) => <span key={i} className="h-11 animate-pulse rounded-xl bg-line" />)}
              {slots.state === "error" && (
                <div className="text-sm text-muted">
                  <p>{slots.message}</p>
                  <button type="button" onClick={load} className="mt-3 underline underline-offset-4">
                    Try again
                  </button>
                </div>
              )}
              {slots.state === "ready" && slots.slots.length === 0 && (
                <p className="text-sm text-muted">
                  No open times right now. Email{" "}
                  <a href={`mailto:${ownerEmail}`} className="underline underline-offset-4">
                    {ownerEmail}
                  </a>{" "}
                  instead.
                </p>
              )}
              {slots.state === "ready" &&
                daySlots.map((s) => (
                  <button
                    key={s.toISOString()}
                    type="button"
                    onClick={() => {
                      setSlot(s);
                      setError(null);
                      setStep("details");
                    }}
                    className="rounded-xl border border-line py-2.5 text-sm font-medium transition-[background-color,border-color,translate] hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--fg)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--fg)_5%,var(--bg))]"
                  >
                    {time(s)}
                  </button>
                ))}
            </div>
            {error && step === "pick" && (
              <p role="alert" className="mt-4 rounded-xl bg-[color-mix(in_srgb,var(--signal)_10%,var(--bg))] px-3 py-2.5 text-sm">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-[18px] shrink-0">
      <path d={d} />
    </svg>
  );
}
