"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import WebGLBoundary from "@/components/three/WebGLBoundary";
import type { SceneState } from "./ProcessScene";

// three.js loads only when the section is near; the page paints without it.
const ProcessScene = dynamic(() => import("./ProcessScene"), { ssr: false });

let webgl: boolean | undefined;
function hasWebGL() {
  if (webgl === undefined) {
    try {
      const canvas = document.createElement("canvas");
      webgl = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}
const noSubscribe = () => () => {};

/**
 * Hosts the Process Machine canvas: mounts it when the section approaches,
 * pauses rendering off-screen, and swaps in `fallback` without WebGL.
 */
export default function ProcessStage({ state, fallback }: { state: SceneState; fallback: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Probed once on the client; the server assumes support.
  const supported = useSyncExternalStore(noSubscribe, hasWebGL, () => true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { rootMargin: "300px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  if (visible && !mounted) setMounted(true);

  return (
    <div ref={ref} className="absolute inset-0">
      {!supported ? fallback : mounted && (
        <WebGLBoundary fallback={fallback}>
          <ProcessScene active={visible} state={state} />
        </WebGLBoundary>
      )}
    </div>
  );
}
