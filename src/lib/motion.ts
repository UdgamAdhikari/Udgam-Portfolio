// Shared mutable scroll state — written by ScrollTrigger in App,
// read every frame by the 3D scene without re-rendering React.
export const scrollState = {
  progress: 0, // 0 at top of page, 1 at bottom
};

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isTouchDevice = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
