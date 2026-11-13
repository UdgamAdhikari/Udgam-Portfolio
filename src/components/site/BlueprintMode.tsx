"use client";

import { useEffect, useState } from "react";

// Easter egg: press B (or triple-click the name in the header) to see the
// page as a drawing — the layout grid, and the component behind each part.

export function toggleBlueprint() {
  const root = document.documentElement;
  if (root.dataset.blueprint) delete root.dataset.blueprint;
  else root.dataset.blueprint = "on";
  window.dispatchEvent(new Event("blueprint"));
}

export default function BlueprintMode() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const sync = () => setOn(Boolean(document.documentElement.dataset.blueprint));
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key.toLowerCase() !== "b" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      toggleBlueprint();
    };
    window.addEventListener("blueprint", sync);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("blueprint", sync);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <>
      {on && (
        <div aria-hidden="true" className="blueprint-grid pointer-events-none fixed inset-0 z-50 px-4 sm:px-8 lg:px-12">
          <div className="grid h-full grid-cols-4 gap-x-4 lg:grid-cols-12 lg:gap-x-12">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className="h-full border-x border-signal/25 bg-signal/[0.03] max-lg:[&:nth-child(n+5)]:hidden" />
            ))}
          </div>
        </div>
      )}
      <p role="status" className="label fixed right-4 bottom-4 z-50 bg-fg px-3 py-2 text-bg empty:hidden">
        {on ? "Blueprint mode · press B to leave" : ""}
      </p>
    </>
  );
}
