"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { assembly } from "@/data/content";
import ProcessStage from "@/components/process/ProcessStage";
import { useScrollProgress } from "@/lib/useScrollProgress";
import ProcessVisual from "./ProcessVisual";

const notes = assembly.notes;
const COUNT = notes.length;
const pad = (i: number) => String(i + 1).padStart(2, "0");
const clamp = (v: number, a: number) => Math.max(-a, Math.min(a, v));

/**
 * How I build: five stages driving one 3D assembly. The section is a short
 * pinned track — scrolling advances the stage; clicking (or arrow keys)
 * jumps the scroll to that stage, so scroll and selection never disagree.
 * Hovering a stage previews its pose; dragging turns the model.
 */
export default function Assembly() {
  const [active, setActive] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);
  const stage = useRef(0);
  const spin = useRef({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const { ref: track } = useScrollProgress<HTMLDivElement>((p) => {
    const next = Math.min(COUNT - 1, Math.floor(p * COUNT));
    setActive((current) => (current === next ? current : next));
  });

  // The scene reads the stage from a ref every frame: no re-render of the canvas.
  useEffect(() => {
    stage.current = preview ?? active;
  }, [active, preview]);

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + travel * ((i + 0.5) / COUNT), behavior: "smooth" });
    setActive(i);
  };

  const onKey = (e: KeyboardEvent, i: number) => {
    const delta = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + COUNT) % COUNT;
    buttons.current[next]?.focus();
    goTo(next);
  };

  // Direct manipulation: drag to turn (limited, springs back on release).
  // Touch only rotates horizontally, so vertical swipes still scroll the page.
  const onDown = (e: PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    if (d) {
      spin.current.y = clamp((e.clientX - d.x) * 0.006, 0.7);
      spin.current.x = e.pointerType === "mouse" ? clamp((e.clientY - d.y) * 0.003, 0.22) : 0;
    } else if (e.pointerType === "mouse") {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      spin.current.y = ((e.clientX - r.left) / r.width - 0.5) * 0.2;
    }
  };
  const release = () => {
    drag.current = null;
    spin.current = { x: 0, y: 0 };
  };

  const shown = preview ?? active;
  const current = notes[shown]!;

  return (
    <section id="assembly" aria-labelledby="assembly-title" className="border-t border-line">
      <div ref={track} className="relative h-[340svh] lg:h-[420svh]">
        <div className="sticky top-0 grid h-svh grid-rows-[auto_minmax(0,1fr)_auto_auto] gap-y-4 px-4 pt-8 pb-6 sm:px-8 lg:grid-cols-12 lg:grid-rows-1 lg:gap-x-12 lg:px-12 lg:py-12">
          {/* Zone A + B: heading and the stage navigation. */}
          <div className="flex flex-col lg:col-span-5 lg:justify-between">
            <header>
              <p className="label flex items-center gap-2 text-muted">
                <span className="tabular-nums">{pad(shown)} / {pad(COUNT - 1)}</span>
                <span aria-hidden="true" className="h-px w-8 bg-line" />
                Process
              </p>
              <h2
                id="assembly-title"
                className="mt-3 font-display text-[clamp(2.75rem,6vw,6rem)] leading-[0.88] font-[660] tracking-[-0.03em] [font-variation-settings:'wdth'_112]"
              >
                {assembly.title}
                <span className="text-signal">.</span>
              </h2>
              <p className="mt-3 text-lg text-muted sm:text-xl">{assembly.lede}</p>
            </header>

            <ol aria-label="Stages" className="mt-8 hidden lg:block">
              {notes.map((note, i) => {
                const on = i === active;
                return (
                  <li key={note.part} className="border-t border-line last:border-b">
                    <button
                      ref={(el) => {
                        buttons.current[i] = el;
                      }}
                      type="button"
                      aria-current={on ? "step" : undefined}
                      onClick={() => goTo(i)}
                      onKeyDown={(e) => onKey(e, i)}
                      onPointerEnter={(e) => e.pointerType === "mouse" && setPreview(i)}
                      onPointerLeave={() => setPreview(null)}
                      className="group relative grid w-full grid-cols-[3rem_1fr] gap-x-2 py-4 text-left transition-colors duration-200"
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute top-0 left-0 h-px bg-signal transition-[width] duration-500 ease-(--ease-settle) ${on ? "w-full" : "w-0"}`}
                      />
                      <span className={`font-mono text-sm tabular-nums transition-colors ${on ? "text-signal" : "text-muted group-hover:text-fg"}`}>
                        {pad(i)}
                      </span>
                      <span>
                        <span className="flex items-baseline gap-3">
                          <span
                            className={`font-display text-xl leading-tight font-[620] transition-colors duration-200 [font-variation-settings:'wdth'_104] ${
                              on ? "text-fg" : "text-fg/75 group-hover:text-fg"
                            }`}
                          >
                            {note.part}
                          </span>
                          <span className="label text-muted">{note.title}</span>
                        </span>
                        <span
                          className={`grid transition-[grid-template-rows,opacity] duration-400 ease-(--ease-settle) ${
                            on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <span className="overflow-hidden">
                            <span className="block max-w-[44ch] pt-2 text-base leading-snug text-pretty text-muted">{note.body}</span>
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <p className="label mt-6 hidden items-center gap-2 text-muted lg:flex">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="size-4">
                <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" />
              </svg>
              {assembly.hint}
            </p>
          </div>

          {/* Zone C: the assembly, with the stage numeral set large behind it. */}
          <div
            data-part="ProcessMachine · 3D"
            className="relative min-h-0 cursor-grab touch-pan-y select-none active:cursor-grabbing lg:col-span-7"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={release}
            onPointerCancel={release}
            onPointerLeave={release}
          >
            <span
              key={shown}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 right-0 animate-[booking-in_0.6s_var(--ease-settle)] font-display text-[clamp(7rem,18vw,18rem)] leading-none font-[700] text-transparent [-webkit-text-stroke:1px_var(--line)]"
            >
              {pad(shown)}
            </span>
            {/* Caption: says in words what the model is showing right now. */}
            <div
              key={`cap-${shown}`}
              className="pointer-events-none absolute bottom-2 left-0 z-10 max-w-sm animate-[booking-in_0.5s_var(--ease-settle)] border-l-2 border-signal pl-4 max-lg:hidden"
            >
              <p className="label text-signal">Now showing · {pad(shown)}</p>
              <p className="mt-1.5 font-display text-2xl leading-tight font-[620] [font-variation-settings:'wdth'_104]">{current.caption[0]}</p>
              <p className="mt-1 text-base leading-snug text-muted">{current.caption[1]}</p>
            </div>
            <ProcessStage
              state={{ stage, spin }}
              stageIndex={shown}
              fallback={<ProcessVisual step={shown} done={shown === COUNT - 1} />}
            />
          </div>

          {/* Mobile: the active stage, then a touch-friendly selector. */}
          <div aria-live="polite" className="lg:hidden">
            <p className="flex items-baseline gap-3">
              <span className="font-mono text-sm text-signal tabular-nums">{pad(shown)}</span>
              <span className="font-display text-2xl font-[620] [font-variation-settings:'wdth'_104]">{current.part}</span>
              <span className="label text-muted">{current.title}</span>
            </p>
            <p className="mt-2 text-base leading-snug text-pretty text-muted">{current.body}</p>
          </div>
          <ol aria-label="Stages" className="flex gap-1.5 lg:hidden">
            {notes.map((note, i) => (
              <li key={note.part} className="flex-1">
                <button
                  type="button"
                  aria-current={i === active ? "step" : undefined}
                  aria-label={`${pad(i)} ${note.part}`}
                  onClick={() => goTo(i)}
                  className={`label w-full rounded-full border py-2.5 text-[10px] transition-colors ${
                    i === active ? "border-fg bg-fg text-bg" : "border-line text-muted"
                  }`}
                >
                  {pad(i)}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
