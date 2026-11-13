"use client";

import { useRef, type ReactNode } from "react";

// The right side of "How I work": an exploded 3D view of one interface. Each
// step of the process is a layer of the same app — brief, components, data,
// performance, live — stacked in space. The active step's layer lifts out and
// lights up; the stack tilts toward the pointer. Pure CSS 3D transforms.

const LAYERS = ["Brief", "Components", "Data", "Refine", "Ship"];

function Brief() {
  return (
    <div className="grid h-full grid-cols-[1fr_1.6fr] gap-3 p-5">
      <span className="row-span-3 rounded-md border border-dashed border-current opacity-50" />
      <span className="h-6 rounded-md border border-dashed border-current opacity-50" />
      <span className="rounded-md border border-dashed border-current opacity-50" />
      <span className="h-6 w-1/2 rounded-md border border-dashed border-current opacity-50" />
    </div>
  );
}

function Components() {
  return (
    <div className="grid h-full grid-cols-3 content-center gap-3 p-5">
      {["<Card />", "<Input />", "<Toggle />", "<Button />", "<List />", "<Nav />"].map((c) => (
        <span key={c} className="grid h-12 place-items-center rounded-lg bg-current/10 font-mono text-[10px]">
          {c}
        </span>
      ))}
    </div>
  );
}

function Data() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 p-5">
      {[0.9, 0.7, 0.5].map((o, i) => (
        <span key={i} className="flex items-center gap-3">
          <span className="size-7 shrink-0 rounded-md bg-signal" style={{ opacity: o }} />
          <span className="h-2.5 flex-1 rounded bg-current/25" />
        </span>
      ))}
      <span className="mt-1 self-start rounded bg-current/10 px-2 py-1 font-mono text-[10px]">GET /api 200</span>
    </div>
  );
}

function Refine() {
  return (
    <div className="flex h-full items-end justify-center gap-2.5 p-6">
      {[40, 62, 48, 78, 92, 70, 96].map((h, i) => (
        <span key={i} className="w-5 rounded-t bg-current/30" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

function Ship() {
  return (
    <div className="grid h-full place-items-center">
      <span className="grid size-16 place-items-center rounded-full bg-emerald-500/90 text-2xl text-white shadow-lg">✓</span>
    </div>
  );
}

const CONTENT: ReactNode[] = [<Brief key="b" />, <Components key="c" />, <Data key="d" />, <Refine key="r" />, <Ship key="s" />];

export default function ProcessVisual({ step, done }: { step: number; done: boolean }) {
  const scene = useRef<HTMLDivElement>(null);
  const active = done ? -1 : step;

  // Pointer tilt, written straight to CSS variables (no re-renders).
  const onMove = (e: React.PointerEvent) => {
    const el = scene.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--tx", String((e.clientX - r.left) / r.width - 0.5));
    el.style.setProperty("--ty", String((e.clientY - r.top) / r.height - 0.5));
  };
  const onLeave = () => {
    scene.current?.style.setProperty("--tx", "0");
    scene.current?.style.setProperty("--ty", "0");
  };

  return (
    <div
      ref={scene}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      aria-hidden="true"
      className="relative grid h-full min-h-[340px] place-items-center [perspective:1600px]"
    >
      <div
        className="relative h-[min(44vw,300px)] w-[min(70vw,420px)] transition-transform duration-700 ease-(--ease-settle) [transform-style:preserve-3d]"
        style={{
          transform: `rotateX(calc(58deg + var(--ty, 0) * -10deg * var(--motion))) rotateZ(calc(-38deg + var(--tx, 0) * 12deg * var(--motion)))`,
        }}
      >
        {LAYERS.map((name, i) => {
          const lit = i === active;
          const passed = done || i < active;
          // Layers spread apart as the process advances; when done they settle into one tight stack.
          // Layers not reached yet wait above the stack, invisible, and drop in on their step.
          const upcoming = !done && i > active;
          const z = done ? i * 14 : upcoming ? i * 46 + 160 : i * 46 + (lit ? 40 : 0);
          return (
            <div
              key={name}
              className={`absolute inset-0 rounded-2xl border transition-[transform,background-color,border-color,color,opacity,box-shadow] duration-700 ease-(--ease-settle) ${
                lit
                  ? "border-signal bg-bg text-fg shadow-[0_40px_60px_-20px_rgb(0_0_0/0.45)]"
                  : passed
                    ? "border-line bg-[color-mix(in_srgb,var(--fg)_8%,var(--bg))] text-fg/70 shadow-[0_20px_40px_-25px_rgb(0_0_0/0.35)]"
                    : "border-line bg-bg text-muted opacity-0"
              }`}
              style={{ transform: `translateZ(${z}px)` }}
            >
              {CONTENT[i]}
              {/* Edge tag: which step this layer is. */}
              <span
                className={`label absolute -top-3 left-4 rounded-full px-2 py-0.5 text-[10px] transition-colors duration-500 ${
                  lit ? "bg-signal text-white" : "bg-fg text-bg"
                }`}
              >
                {String(i + 1).padStart(2, "0")} {name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
