"use client";

import { useControls } from "@/lib/controls";

// Shown when WebGL is unavailable or the scene fails: the same three working
// parts as a technical line drawing that tracks the real settings.
export default function PartsFallback() {
  const { theme, motion } = useControls();
  const knobX = theme === "graphite" ? 134 : 82;
  const handleX = 60 + motion * 240;

  return (
    <svg
      viewBox="0 0 400 240"
      className="absolute inset-0 m-auto h-full max-h-80 w-full text-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden="true"
    >
      <rect x="60" y="40" width="96" height="44" rx="22" fill={theme === "graphite" ? "var(--signal)" : "none"} />
      <circle cx={knobX} cy="62" r="16" fill="var(--bg)" />
      <line x1="60" y1="130" x2="300" y2="130" />
      <line x1="60" y1="130" x2={handleX} y2="130" stroke="var(--signal)" strokeWidth="3" />
      <circle cx={handleX} cy="130" r="13" fill="var(--bg)" />
      <rect x="220" y="170" width="140" height="44" rx="10" />
      <text x="290" y="197" textAnchor="middle" fontSize="11" letterSpacing="1.5" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">
        SAY HELLO →
      </text>
      <g fontFamily="var(--font-mono)" fontSize="9" letterSpacing="1" fill="currentColor" stroke="none">
        <text x="170" y="66">THEME</text>
        <text x="324" y="133">MOTION</text>
      </g>
    </svg>
  );
}
