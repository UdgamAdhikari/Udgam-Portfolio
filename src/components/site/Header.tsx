"use client";

import { useEffect, useRef, useState } from "react";
import { sections, type SectionId } from "@/data/content";
import type { SiteProfile } from "@/server/content/site";
import { useKathmanduTime } from "@/lib/useKathmanduTime";
import { toggleBlueprint } from "./BlueprintMode";

const RING = 2 * Math.PI * 27;

/**
 * The editorial bar at the top of the page, and the round index button that
 * takes over once it scrolls away. The button's rim doubles as the reading
 * ruler: it fills with the signal colour as you move down the page.
 * On case-study pages (`home={false}`) links point back to the home page.
 */
export default function Header({ home = true, profile }: { home?: boolean; profile: SiteProfile }) {
  const [current, setCurrent] = useState<SectionId | null>(null);
  const [docked, setDocked] = useState(false);
  const [open, setOpen] = useState(false);
  const ring = useRef<SVGCircleElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const clicks = useRef<number[]>([]);
  const time = useKathmanduTime();

  // Scroll: dock the round button once the bar is gone, and fill its rim.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      if (ring.current) ring.current.style.strokeDashoffset = String(RING * (1 - progress));
      setDocked(window.scrollY > 120);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!home) return;
    // A section is "current" while it crosses a line a third of the way down.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(entry.target.id as SectionId);
        }
      },
      { rootMargin: "-33% 0px -66% 0px" },
    );
    sections.forEach(({ id }) => {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, [home]);

  // The open index behaves like a dialog: focus moves in, Escape closes it,
  // the page underneath stops scrolling, and focus returns to the button.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const trigger = button.current;
    return () => {
      root.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  // Three clicks on the name within a second opens blueprint mode.
  const onNameClick = () => {
    const now = performance.now();
    clicks.current = [...clicks.current.filter((t) => now - t < 1000), now];
    if (clicks.current.length >= 3) {
      clicks.current = [];
      toggleBlueprint();
    }
  };

  const href = (id: string) => (home ? `#${id}` : `/#${id}`);

  return (
    <>
      <header
        data-part="Header · editorial bar"
        className="relative z-40 grid grid-cols-[1fr_auto] items-start gap-6 px-4 pt-5 pb-4 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:pt-7"
      >
        <a
          href="#main"
          className="label absolute top-2 left-4 -translate-y-20 bg-fg px-3 py-2 text-bg focus:translate-y-0"
        >
          Skip to content
        </a>

        <a
          href={home ? "#parts" : "/"}
          onClick={onNameClick}
          className="font-display text-xl leading-none font-[680] tracking-[-0.01em] [font-variation-settings:'wdth'_112] lg:col-span-3"
        >
          <span className="text-signal">©</span> {profile.name}
        </a>

        <p className="label hidden leading-relaxed text-muted lg:col-span-4 lg:block">
          {profile.role}
          <br />
          Kathmandu{time && <span className="tabular-nums"> · {time} local time</span>}
        </p>

        <nav aria-label="Sections" className="hidden justify-self-end lg:col-span-5 lg:block">
          <ul className="flex flex-wrap justify-end gap-x-2 text-[1.35rem] leading-tight">
            {sections.map(({ id, label }, i) => (
              <li key={id}>
                <a
                  href={href(id)}
                  aria-current={current === id ? "location" : undefined}
                  className="decoration-signal decoration-2 underline-offset-[6px] transition-colors hover:underline aria-[current]:underline"
                >
                  {label}
                </a>
                {i < sections.length - 1 && <span aria-hidden="true">,</span>}
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* The round index button: always present on small screens, docked in
          on large ones once the bar above has scrolled away. */}
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="site-index"
        aria-label={open ? "Close the index" : "Open the index"}
        onClick={() => setOpen((o) => !o)}
        className={`fixed top-4 right-4 z-[55] grid size-14 place-items-center rounded-full bg-fg text-bg shadow-[0_0_0_1.5px_color-mix(in_srgb,var(--bg)_55%,transparent),0_10px_30px_-12px_rgb(0_0_0/0.5)] transition-[scale,opacity] duration-500 ease-(--ease-settle) sm:right-8 lg:top-6 lg:right-12 ${
          docked || open ? "scale-100 opacity-100" : "lg:pointer-events-none lg:scale-50 lg:opacity-0"
        }`}
      >
        <svg viewBox="0 0 60 60" className="absolute inset-[-2px] -rotate-90" aria-hidden="true">
          <circle
            ref={ring}
            cx="30"
            cy="30"
            r="27"
            fill="none"
            stroke="var(--signal)"
            strokeWidth="2"
            strokeDasharray={RING}
            strokeDashoffset={RING}
          />
        </svg>
        <span aria-hidden="true" className="relative block h-3 w-6">
          <span
            className={`absolute left-0 h-px w-6 bg-current transition-transform duration-300 ${open ? "top-1.5 rotate-45" : "top-0.5"}`}
          />
          <span
            className={`absolute left-0 h-px w-6 bg-current transition-transform duration-300 ${open ? "top-1.5 -rotate-45" : "top-2.5"}`}
          />
        </span>
      </button>

      {open && (
        <div
          id="site-index"
          role="dialog"
          aria-modal="true"
          aria-label="Site index"
          className="inverse fixed inset-0 z-50 flex flex-col overflow-y-auto px-4 pt-24 pb-8 sm:px-8 lg:px-12"
        >
          <p className="label text-muted">Index</p>
          <ol className="mt-6 flex-1">
            {sections.map(({ id, number, label }, i) => (
              <li key={id}>
                <a
                  ref={i === 0 ? firstLink : undefined}
                  href={href(id)}
                  onClick={() => setOpen(false)}
                  aria-current={current === id ? "location" : undefined}
                  className="group grid grid-cols-[4.5rem_1fr_auto] items-baseline border-t border-line py-3 sm:grid-cols-[7rem_1fr_auto] lg:py-4"
                >
                  <span className="text-xl text-muted tabular-nums sm:text-2xl">( {number} )</span>
                  <span className="font-display text-[clamp(2.25rem,7vw,6rem)] leading-[0.95] font-[620] [font-variation-settings:'wdth'_100] transition-[font-variation-settings] duration-500 ease-(--ease-settle) group-hover:[font-variation-settings:'wdth'_122] group-focus-visible:[font-variation-settings:'wdth'_122] group-aria-[current]:text-signal">
                    {label}
                  </span>
                  <span aria-hidden="true" className="text-2xl text-muted transition-transform group-hover:translate-x-1 group-hover:text-signal">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ol>
          <div className="label mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5 text-muted">
            <a href={`mailto:${profile.email}`} className="hover:text-fg">
              {profile.email}
            </a>
            {profile.social.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="hover:text-fg">
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
