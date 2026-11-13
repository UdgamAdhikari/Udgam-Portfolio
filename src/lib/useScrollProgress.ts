import { useEffect, useRef } from "react";

/**
 * Tracks how far the viewport has travelled through a tall element:
 * 0 when its top reaches the top of the viewport, 1 when its bottom reaches
 * the bottom. Written to a ref (read every frame by WebGL) and reported via
 * `onChange` only when the value moves, so React re-renders stay rare.
 */
export function useScrollProgress<T extends HTMLElement>(onChange?: (progress: number) => void) {
  const ref = useRef<T>(null);
  const progress = useRef(0);
  const callback = useRef(onChange);

  useEffect(() => {
    callback.current = onChange;
  });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const value = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : rect.top <= 0 ? 1 : 0;
      if (value !== progress.current) {
        progress.current = value;
        callback.current?.(value);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  return { ref, progress };
}
