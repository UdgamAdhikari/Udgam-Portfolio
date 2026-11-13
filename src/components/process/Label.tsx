"use client";

/* eslint-disable react-hooks/immutability -- three.js objects are mutated only inside useFrame. */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getControls } from "@/lib/controls";

const TONES = {
  ink: { bg: "#1f1e1c", fg: "#f3f0e9" },
  signal: { bg: "#da593d", fg: "#ffffff" },
  ok: { bg: "#15803d", fg: "#ffffff" },
} as const;

export type LabelTone = keyof typeof TONES;

/** Draws a pill-shaped label into a texture (once per text). */
function useLabelTexture(text: string, tone: LabelTone) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-plex-mono").split(",")[0]?.trim() || "monospace";
    const font = `500 30px ${family}`;
    ctx.font = font;
    const label = text.toUpperCase();
    const width = Math.ceil(ctx.measureText(label).width + label.length * 3 + 44);
    canvas.width = width;
    canvas.height = 56;
    ctx.font = font;
    ctx.letterSpacing = "3px";
    ctx.fillStyle = TONES[tone].bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, 56, 28);
    ctx.fill();
    ctx.fillStyle = TONES[tone].fg;
    ctx.textBaseline = "middle";
    ctx.fillText(label, 22, 30);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return { texture: t, aspect: width / 56 };
  }, [text, tone]);
  useEffect(() => () => texture.texture.dispose(), [texture]);
  return texture;
}

/**
 * A label that always faces the camera and fades in while `show()` is true.
 * Drawn in WebGL, so it stays pinned to its 3D anchor and costs no DOM.
 */
export default function Label({
  text,
  show,
  tone = "ink",
  position = [0, 0, 0],
  height = 0.022,
}: {
  text: string;
  show: () => boolean;
  tone?: LabelTone;
  position?: [number, number, number];
  height?: number;
}) {
  const { texture, aspect } = useLabelTexture(text, tone);
  const sprite = useRef<THREE.Sprite>(null);
  const material = useMemo(() => new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0, depthTest: false, toneMapped: false, sizeAttenuation: false }), [texture]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, dt) => {
    const target = show() ? 1 : 0;
    const k = getControls().motion === 0 ? 40 : 22;
    material.opacity = THREE.MathUtils.damp(material.opacity, target, k, dt);
    if (sprite.current) sprite.current.visible = material.opacity > 0.01;
  });

  return <sprite ref={sprite} position={position} scale={[height * aspect, height, 1]} material={material} renderOrder={10} />;
}
