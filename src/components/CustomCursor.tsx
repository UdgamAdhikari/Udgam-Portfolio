import { useEffect, useRef } from "react";
import { isTouchDevice, prefersReducedMotion } from "../lib/motion";

// A dot that trails the pointer and grows over interactive elements.
export default function CustomCursor() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTouchDevice() || prefersReducedMotion()) return;
    const el = ring.current;
    if (!el) return;
    document.body.classList.add("custom-cursor-active");

    let x = -100, y = -100, tx = -100, ty = -100;
    let scale = 1, tScale = 1;
    let raf: number;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const target = e.target as HTMLElement;
      tScale = target.closest("a, button, [data-cursor='grow']") ? 2.6 : 1;
    };

    const loop = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      scale += (tScale - scale) * 0.18;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      document.body.classList.remove("custom-cursor-active");
    };
  }, []);

  if (typeof window !== "undefined" && (isTouchDevice() || prefersReducedMotion())) {
    return null;
  }

  return (
    <div
      ref={ring}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[90] hidden h-8 w-8 rounded-full border border-accent/70 mix-blend-difference md:block"
    />
  );
}
