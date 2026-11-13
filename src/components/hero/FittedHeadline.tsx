"use client";

import { useEffect, useRef } from "react";
import { getControls } from "@/lib/controls";

const MIN_WDTH = 62;
const MAX_WDTH = 125;

/**
 * Sets each line on one row and fits the longest one to the column by
 * changing the face's width axis, not its size — the headline is a
 * responsive layout you can watch. Size only shrinks when even the
 * narrowest width can't fit (small phones).
 */
export default function FittedHeadline({ id, lines }: { id: string; lines: string[] }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const heading = ref.current;
    if (!heading) return;
    const spans = Array.from(heading.querySelectorAll<HTMLSpanElement>("[data-line]"));
    let first = true;
    let frame = 0;

    const widest = (wdth: number) => {
      heading.style.fontVariationSettings = `"wdth" ${wdth}`;
      return Math.max(...spans.map((span) => span.getBoundingClientRect().width));
    };

    const measure = () => {
      const available = heading.clientWidth;
      heading.style.transition = "none";
      heading.style.setProperty("--fit-scale", "1");

      let lo = MIN_WDTH;
      let hi = MAX_WDTH;
      if (widest(lo) > available) {
        heading.style.setProperty("--fit-scale", String(available / widest(lo)));
        hi = lo;
      }
      for (let i = 0; i < 9 && hi - lo > 0.5; i++) {
        const mid = (lo + hi) / 2;
        if (widest(mid) <= available) lo = mid;
        else hi = mid;
      }
      const target = Math.floor(lo * 10) / 10;

      // First fit: open from the narrowest cut to the fitted width.
      const motion = getControls().motion;
      if (first && motion > 0) {
        heading.style.fontVariationSettings = `"wdth" ${MIN_WDTH}`;
        void heading.offsetWidth;
        heading.style.transition = `font-variation-settings ${1.3 * motion}s var(--ease-settle)`;
      }
      heading.style.fontVariationSettings = `"wdth" ${target}`;
      first = false;
    };

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    document.fonts.ready.then(() => observer.observe(heading));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div>
      {/* Only the glyphs take the pointer, never the empty width beside them. */}
      <h1
        id={id}
        ref={ref}
        className="pointer-events-none relative z-10 font-display text-[calc(var(--headline-size)*var(--fit-scale,1))] leading-[0.86] font-[640] tracking-[-0.025em]"
        style={{ fontVariationSettings: '"wdth" 92' }}
      >
        {lines.map((line, i) => {
          const last = i === lines.length - 1 && line.endsWith(".");
          return (
            <span key={line} data-line className="pointer-events-auto block w-fit whitespace-nowrap">
              {last ? (
                <>
                  {line.slice(0, -1)}
                  <span className="text-signal">.</span>
                </>
              ) : (
                line
              )}
            </span>
          );
        })}
      </h1>
    </div>
  );
}
