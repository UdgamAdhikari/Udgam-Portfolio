"use client";

import { useSyncExternalStore } from "react";

// One shared one-second ticker for both clocks.
let now = 0;
const listeners = new Set<() => void>();
let timer: number | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    now = Date.now();
    timer = window.setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.clearInterval(timer);
  };
}

const format = (ms: number, timeZone?: string) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", timeZone })
    .format(ms)
    .toLowerCase();

/** "Udgam's local time" and the visitor's own, ticking every second. */
export function FooterClocks({ firstName }: { firstName: string }) {
  const ms = useSyncExternalStore(subscribe, () => now, () => 0);
  return (
    <dl className="grid gap-1 text-lg">
      <dt className="font-medium uppercase">{firstName}&apos;s local time</dt>
      <dd className="text-muted tabular-nums">{ms ? format(ms, "Asia/Kathmandu") : "—"}</dd>
      <dt className="mt-2 font-medium uppercase">Your local time</dt>
      <dd className="text-muted tabular-nums">{ms ? format(ms) : "—"}</dd>
    </dl>
  );
}

/** The round back-to-top key. */
export function BackToTop() {
  return (
    <a
      href="#main"
      aria-label="Back to top"
      className="grid size-20 place-items-center rounded-full bg-[color-mix(in_srgb,var(--fg)_14%,var(--bg))] text-fg transition-[translate,background-color] duration-300 hover:-translate-y-1 hover:bg-fg hover:text-bg"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className="size-8">
        <path d="M12 20V4M5 11l7-7 7 7" />
      </svg>
    </a>
  );
}
