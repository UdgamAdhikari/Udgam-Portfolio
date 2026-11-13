"use client";

/* eslint-disable react-hooks/immutability -- three.js materials are mutable GPU
   objects; they are created once and only changed inside useFrame, never during render. */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { getControls, type Theme } from "@/lib/controls";
import { PIECES, PLATE, STAGES, type PieceSpec } from "./stages";
import StageProps from "./StageProps";
import Label from "./Label";

// ── Materials ────────────────────────────────────────────────────
// Matte ceramic in the site's two inks; the theme re-glazes them in place.

type Swatch = "plate" | "clay" | "ink" | "signal" | "line";
const PALETTE: Record<Theme, Record<Swatch, string>> = {
  paper: { plate: "#d9d5cd", clay: "#f6f3ec", ink: "#2a2927", signal: "#da593d", line: "#8a867e" },
  graphite: { plate: "#3a3936", clay: "#4a4844", ink: "#e9e5dd", signal: "#f0532f", line: "#9a968d" },
};

type Materials = Record<Swatch, THREE.MeshStandardMaterial> & { stem: THREE.MeshBasicMaterial; glow: THREE.MeshBasicMaterial };

function useMaterials(): Materials {
  const mats = useMemo(() => {
    const { theme } = getControls();
    const std = (s: Swatch, roughness: number) => new THREE.MeshStandardMaterial({ color: PALETTE[theme][s], roughness, metalness: 0 });
    return {
      plate: std("plate", 0.9),
      clay: std("clay", 0.82),
      ink: std("ink", 0.7),
      signal: std("signal", 0.55),
      line: std("line", 0.9),
      stem: new THREE.MeshBasicMaterial({ color: PALETTE[theme].line, transparent: true, opacity: 0 }),
      glow: new THREE.MeshBasicMaterial({ color: PALETTE[theme].signal, transparent: true, opacity: 0, toneMapped: false }),
    };
  }, []);
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  return mats;
}

const damp = THREE.MathUtils.damp;
const smoothing = () => (getControls().motion === 0 ? 40 : 18);

interface SceneState {
  stage: RefObject<number>;
  /** Pointer-driven extra rotation, in radians (already clamped). */
  spin: RefObject<{ x: number; y: number }>;
}

// Plain names for each module, shown on it during Break down.
const PLAIN: Record<string, string> = {
  header: "Top bar",
  sidebar: "Menu",
  cardA: "Highlights",
  cardB: "Stats",
  list: "Your content",
  button: "Call to action",
};

// ── One module of the product ────────────────────────────────────

function Piece({ spec, index, mats, state }: { spec: PieceSpec; index: number; mats: Materials; state: SceneState }) {
  const group = useRef<THREE.Group>(null);
  const stem = useRef<THREE.Mesh>(null);
  const socket = useRef<THREE.Mesh>(null);
  const last = useRef({ stage: -1, at: 0 });

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const stage = state.stage.current;
    const t = clock.elapsedTime;
    if (stage !== last.current.stage) last.current = { stage, at: t };
    // Stagger: each piece starts a beat after the one before, so moves read as a sequence.
    if (getControls().motion > 0 && t - last.current.at < index * 0.015) return;

    const config = STAGES[stage]!;
    const pose = config.pieces[spec.id];
    const k = smoothing();
    const bob = config.ship === 0 && pose.offset[1] > 0 ? Math.sin(t * 1.1 + index) * 0.04 * getControls().motion : 0;
    g.position.x = damp(g.position.x, spec.home[0] + pose.offset[0], k, dt);
    g.position.y = damp(g.position.y, spec.home[1] + pose.offset[1] + bob, k, dt);
    g.position.z = damp(g.position.z, spec.home[2] + pose.offset[2], k, dt);
    g.rotation.x = damp(g.rotation.x, pose.rotation[0], k, dt);
    g.rotation.y = damp(g.rotation.y, pose.rotation[1], k, dt);
    g.rotation.z = damp(g.rotation.z, pose.rotation[2], k, dt);

    // Stem: a hairline from the lifted piece down to its place on the plate.
    const s = stem.current;
    if (s) {
      const h = Math.max(0.001, g.position.y - spec.home[1]);
      s.scale.y = h;
      s.position.set(g.position.x, spec.home[1] + h / 2, g.position.z);
    }
    if (socket.current) socket.current.position.set(spec.home[0], 0.012, spec.home[2]);
  });

  const material = mats[spec.tone];
  return (
    <>
      <group ref={group} position={[spec.home[0], spec.home[1] + 2, spec.home[2]]}>
        <RoundedBox args={spec.size} radius={0.05} smoothness={4} material={material} castShadow />
        <Label text={PLAIN[spec.id]!} position={[0, 0.45, 0]} show={() => state.stage.current === 1} />
        {/* Surface detail, so each module reads as a UI part. */}
        {spec.id === "list" &&
          [-0.28, 0, 0.28].map((z, i) => (
            <mesh key={z} position={[-1.4 + i * 0.05, spec.size[1] / 2 + 0.01, z]} material={mats.signal}>
              <boxGeometry args={[0.22, 0.02, 0.18]} />
            </mesh>
          ))}
        {spec.id === "list" &&
          [-0.28, 0, 0.28].map((z, i) => (
            <mesh key={`l${z}`} position={[0.2 - i * 0.25, spec.size[1] / 2 + 0.01, z]} material={mats.line}>
              <boxGeometry args={[2.6 - i * 0.5, 0.015, 0.07]} />
            </mesh>
          ))}
        {(spec.id === "cardA" || spec.id === "cardB") && (
          <>
            <mesh position={[0, spec.size[1] / 2 + 0.01, -0.18]} material={mats.plate}>
              <boxGeometry args={[1.5, 0.015, 0.5]} />
            </mesh>
            {spec.id === "cardB" &&
              [0.5, 0.8, 0.35, 0.95].map((h, i) => (
                <mesh key={i} position={[-0.5 + i * 0.33, spec.size[1] / 2 + 0.01 + h * 0.12, 0.3]} material={mats.ink}>
                  <boxGeometry args={[0.16, h * 0.24, 0.16]} />
                </mesh>
              ))}
          </>
        )}
        {spec.id === "sidebar" &&
          [-0.9, -0.55, -0.2, 0.15].map((z) => (
            <mesh key={z} position={[0, spec.size[1] / 2 + 0.01, z]} material={mats.line}>
              <boxGeometry args={[0.9, 0.015, 0.1]} />
            </mesh>
          ))}
      </group>
      <mesh ref={stem} material={mats.stem}>
        <boxGeometry args={[0.012, 1, 0.012]} />
      </mesh>
      {/* Socket: where the module connects, lit during Build. */}
      <mesh ref={socket} rotation-x={-Math.PI / 2} material={mats.glow}>
        <circleGeometry args={[0.09, 24]} />
      </mesh>
    </>
  );
}

function Assembly({ state, stageIndex }: { state: SceneState; stageIndex: number }) {
  const mats = useMaterials();
  const root = useRef<THREE.Group>(null);
  const edge = useRef<THREE.MeshBasicMaterial>(null);
  const guide = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }), []);
  useEffect(() => () => guide.dispose(), [guide]);
  const target = useMemo(() => new THREE.Color(), []);
  const { viewport, size } = useThree();
  const compact = size.width < 640;
  const scale = Math.min(1, viewport.width / (compact ? 8.6 : 9));

  useFrame((frame, dt) => {
    const stage = state.stage.current;
    const config = STAGES[stage]!;
    const { theme, motion } = getControls();
    const k = smoothing();
    const kc = motion === 0 ? 40 : 12;

    // Camera glides between framings (a little slower than the pieces).
    const cam = frame.camera;
    cam.position.x = damp(cam.position.x, config.camera[0], kc, dt);
    cam.position.y = damp(cam.position.y, config.camera[1], kc, dt);
    cam.position.z = damp(cam.position.z, config.camera[2], kc, dt);
    cam.lookAt(0, 0.6, 0);

    const g = root.current;
    if (g) {
      g.rotation.y = damp(g.rotation.y, config.yaw + state.spin.current.y, 5, dt);
      g.rotation.x = damp(g.rotation.x, state.spin.current.x, 5, dt);
      const s = scale * (1 + config.ship * 0.03);
      g.scale.setScalar(damp(g.scale.x, s, k, dt));
    }

    // Overlays fade with their stage.
    mats.stem.opacity = damp(mats.stem.opacity, config.annotations * 0.55, k, dt);
    mats.glow.opacity = damp(mats.glow.opacity, config.connectors, k, dt);
    guide.opacity = damp(guide.opacity, config.guides * 0.7, k, dt);
    if (edge.current) edge.current.opacity = damp(edge.current.opacity, config.ship, k, dt);
    // The button warms up on Ship.
    mats.signal.emissive.set(PALETTE[theme].signal);
    mats.signal.emissiveIntensity = damp(mats.signal.emissiveIntensity, config.ship * 0.35, k, dt);

    // Re-glaze on theme change.
    const ease = motion === 0 ? 1 : 1 - Math.exp(-dt * 5);
    (["plate", "clay", "ink", "signal", "line"] as const).forEach((s) => mats[s].color.lerp(target.set(PALETTE[theme][s]), ease));
    mats.stem.color.lerp(target.set(PALETTE[theme].line), ease);
    guide.color.copy(mats.stem.color);
    mats.glow.color.lerp(target.set(PALETTE[theme].signal), ease);
    if (edge.current) edge.current.color.lerp(target.set(PALETTE[theme].signal), ease);
  });

  const [w, h, d] = PLATE;
  return (
    <group ref={root}>
      <RoundedBox args={PLATE} radius={0.08} smoothness={4} position={[0, -h / 2, 0]} material={mats.plate} receiveShadow castShadow />
      {/* Shipped edge: a thin accent band around the plate. */}
      <mesh position={[0, -h / 2, 0]}>
        <boxGeometry args={[w + 0.06, 0.05, d + 0.06]} />
        <meshBasicMaterial ref={edge} transparent opacity={0} toneMapped={false} />
      </mesh>
      {PIECES.map((spec, i) => (
        <Piece key={spec.id} spec={spec} index={i} mats={mats} state={state} />
      ))}
      <GuidesLayer material={guide} />
      <StageProps stage={stageIndex} />
    </group>
  );
}

/** Measurement guides; they share one material so a single opacity fades them all. */
function GuidesLayer({ material }: { material: THREE.MeshBasicMaterial }) {
  const [w, , d] = PLATE;
  const ticks = Array.from({ length: 13 }, (_, i) => -w / 2 + (i * w) / 12);
  return (
    <group position={[0, 0.02, 0]}>
      <mesh position={[0, 0, d / 2 + 0.4]} material={material}>
        <boxGeometry args={[w, 0.01, 0.014]} />
      </mesh>
      {ticks.map((x, i) => (
        <mesh key={x} position={[x, 0, d / 2 + 0.4]} material={material}>
          <boxGeometry args={[0.014, 0.01, i % 3 === 0 ? 0.26 : 0.12]} />
        </mesh>
      ))}
      <mesh position={[w / 2 + 0.4, 0, 0]} material={material}>
        <boxGeometry args={[0.014, 0.01, d]} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => -d / 2 + (i * d) / 8).map((z, i) => (
        <mesh key={z} position={[w / 2 + 0.4, 0, z]} material={material}>
          <boxGeometry args={[i % 4 === 0 ? 0.26 : 0.12, 0.01, 0.014]} />
        </mesh>
      ))}
    </group>
  );
}

export default function ProcessScene({ active, state, stageIndex }: { active: boolean; state: SceneState; stageIndex: number }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [6.4, 6.2, 7.4], fov: 30 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}
    >
      <hemisphereLight args={["#ffffff", "#d9d3c7", 1.2]} />
      <directionalLight position={[4, 9, 6]} intensity={2.1} />
      <Assembly state={state} stageIndex={stageIndex} />
      <ContactShadows position={[0, -0.25, 0]} scale={14} blur={2.6} opacity={0.32} far={4} resolution={512} />
    </Canvas>
  );
}

export type { SceneState };
