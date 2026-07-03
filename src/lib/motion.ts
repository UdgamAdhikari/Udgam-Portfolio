import type Lenis from "lenis";

// Shared mutable scroll state — written by ScrollTrigger in App,
// read every frame by the 3D scene without re-rendering React.
export const scrollState = {
  progress: 0, // 0 at top of page, 1 at bottom
};

// The active Lenis instance (null when reduced motion disables it).
// Anchor navigation must go through Lenis while it's running — native
// smooth scrolling fights its per-frame scroll writes.
export let lenis: Lenis | null = null;
export const setLenis = (instance: Lenis | null) => {
  lenis = instance;
};

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isTouchDevice = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
