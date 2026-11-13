"use client";

import { setControls, useControls } from "@/lib/controls";

// The HTML twins of the working parts on the bench, as one compact strip.
// They share one store, so keyboard and screen-reader users get exactly the
// same controls as the 3D toggle and slider.
export default function ControlPanel() {
  const { theme, motion } = useControls();
  const graphite = theme === "graphite";
  const percent = Math.round(motion * 100);

  return (
    <section aria-labelledby="controls-title" className="border-t border-line pt-4">
      <h2 id="controls-title" className="label text-muted">
        These parts work <span className="hidden lg:inline">— here, or on the bench →</span>
      </h2>

      <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-2">
        <div className="flex items-center gap-3">
          <span className="label" id="theme-label">
            Theme
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={graphite}
            aria-labelledby="theme-label"
            onClick={() => setControls({ theme: graphite ? "paper" : "graphite" })}
            className="flex min-h-11 items-center gap-2.5"
          >
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
                graphite ? "bg-signal" : "bg-line"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-bg shadow-sm transition-transform duration-300 ease-(--ease-settle) ${
                  graphite ? "translate-x-5" : ""
                }`}
              />
            </span>
            <span className="label w-16 text-left">{graphite ? "Graphite" : "Paper"}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="motion" className="label">
            Motion
          </label>
          <input
            id="motion"
            type="range"
            min={0}
            max={100}
            step={5}
            value={percent}
            onChange={(e) => setControls({ motion: Number(e.target.value) / 100 })}
            aria-valuetext={percent === 0 ? "Still" : `${percent} percent`}
            className="h-11 w-32 cursor-ew-resize accent-(--signal)"
          />
          <output htmlFor="motion" className="label w-10 tabular-nums">
            {percent === 0 ? "Still" : `${percent}%`}
          </output>
        </div>
      </div>
    </section>
  );
}
