import { useSyncExternalStore } from "react";
import { STORAGE_KEY } from "./controls-boot";

// The site's two user-facing settings. They are driven both by the HTML
// controls and by the 3D parts on the bench, so they live in one tiny store
// that the WebGL loop can read every frame without re-rendering React.

export type Theme = "paper" | "graphite";

export interface Controls {
  theme: Theme;
  /** 0 = still, 1 = full motion. */
  motion: number;
}

const SERVER_DEFAULT: Controls = { theme: "paper", motion: 1 };

let state: Controls = SERVER_DEFAULT;
let hydrated = false;
const listeners = new Set<() => void>();

// The inline boot script in the root layout has already resolved the stored
// or system preference onto <html>; read it back rather than re-deriving it.
function readFromDocument() {
  if (hydrated || typeof document === "undefined") return;
  hydrated = true;
  const root = document.documentElement;
  const motion = Number(root.dataset.motion);
  state = {
    theme: root.dataset.theme === "graphite" ? "graphite" : "paper",
    motion: Number.isFinite(motion) ? motion : 1,
  };
}

function applyToDocument() {
  const root = document.documentElement;
  root.dataset.theme = state.theme;
  root.dataset.motion = String(state.motion);
  root.style.setProperty("--motion", String(state.motion));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode); the setting still applies.
  }
}

export function getControls(): Controls {
  readFromDocument();
  return state;
}

export function setControls(patch: Partial<Controls>) {
  readFromDocument();
  const next = { ...state, ...patch };
  if (next.theme === state.theme && next.motion === state.motion) return;
  state = next;
  applyToDocument();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useControls() {
  return useSyncExternalStore(subscribe, getControls, () => SERVER_DEFAULT);
}
