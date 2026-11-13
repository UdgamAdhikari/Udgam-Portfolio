"use client";

import { useState, type RefObject } from "react";
import PartsScene, { type StageVariant } from "./PartsScene";
import PartsFallback from "./PartsFallback";
import WebGLBoundary from "./WebGLBoundary";

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

interface Props {
  active: boolean;
  variant?: StageVariant;
  progress?: RefObject<number>;
}

// Client-only (loaded with ssr: false), so probing WebGL during render is safe.
export default function PartsCanvas(props: Props) {
  const [supported] = useState(hasWebGL);
  if (!supported) return <PartsFallback />;
  return (
    <WebGLBoundary fallback={<PartsFallback />}>
      <PartsScene {...props} />
    </WebGLBoundary>
  );
}
