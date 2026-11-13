"use client";

/* eslint-disable react-hooks/immutability -- three.js objects are mutated only inside useFrame. */

import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { getControls } from "@/lib/controls";
import Label, { type LabelTone } from "./Label";
import { PIECES, PLATE } from "./stages";

// One scene of props per stage, so each step shows what it means:
// 01 a brief under a magnifier · 02 every module labelled · 03 a database
// streaming data into the list · 04 test results · 05 a live launch.

const damp = THREE.MathUtils.damp;

/** Pops its children in (scale) when `on`, and out otherwise. */
function Appear({ on, children, position, delay = 0 }: { on: boolean; children: ReactNode; position?: [number, number, number]; delay?: number }) {
  const ref = useRef<THREE.Group>(null);
  const since = useRef(0);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    since.current = on ? since.current + dt : 0;
    const target = on && since.current > delay ? 1 : 0.0001;
    const k = getControls().motion === 0 ? 40 : 20;
    g.scale.setScalar(damp(g.scale.x, target, k, dt));
    g.visible = g.scale.x > 0.01;
  });
  return (
    <group ref={ref} position={position} scale={0.0001}>
      {children}
    </group>
  );
}

/** A label shown while its stage is active. */
function Tag({ on, children, tone = "ink", position }: { on: boolean; children: string; tone?: LabelTone; position: [number, number, number] }) {
  const live = useRef(on);
  useEffect(() => {
    live.current = on;
  }, [on]);
  return <Label text={children} tone={tone} position={position} show={() => live.current} />;
}

function useMats() {
  return useMemo(
    () => ({
      paper: new THREE.MeshStandardMaterial({ color: "#fbfaf6", roughness: 0.9 }),
      ink: new THREE.MeshStandardMaterial({ color: "#2a2927", roughness: 0.6 }),
      signal: new THREE.MeshStandardMaterial({ color: "#da593d", roughness: 0.5 }),
      glass: new THREE.MeshStandardMaterial({ color: "#cfe3ea", roughness: 0.1, transparent: true, opacity: 0.45 }),
      metal: new THREE.MeshStandardMaterial({ color: "#8a867e", roughness: 0.35, metalness: 0.4 }),
      ok: new THREE.MeshBasicMaterial({ color: "#16a34a", toneMapped: false }),
      ring: new THREE.MeshBasicMaterial({ color: "#da593d", transparent: true, opacity: 0, toneMapped: false, side: THREE.DoubleSide }),
    }),
    [],
  );
}

// 01 — a brief on paper, read through a magnifier that slowly scans it.
function Brief({ on, mats }: { on: boolean; mats: ReturnType<typeof useMats> }) {
  const lens = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (lens.current) {
      const t = clock.elapsedTime * 0.6 * getControls().motion;
      lens.current.position.set(Math.sin(t) * 0.5, 0.55, Math.cos(t * 0.8) * 0.4);
    }
  });
  return (
    <Appear on={on} position={[-PLATE[0] / 2 - 1.3, 1.1, 0.6]}>
      <group rotation={[-0.25, 0.35, 0.1]}>
        <RoundedBox args={[1.9, 0.04, 2.5]} radius={0.02} material={mats.paper} castShadow />
        {[0.95, 0.8, 0.9, 0.6, 0.85, 0.5].map((w, i) => (
          <mesh key={i} position={[-0.75 + w * 0.7, 0.03, -0.95 + i * 0.32]} material={i === 0 ? mats.signal : mats.ink}>
            <boxGeometry args={[w * 1.4, 0.01, i === 0 ? 0.12 : 0.07]} />
          </mesh>
        ))}
        <group ref={lens}>
          <mesh rotation-x={-Math.PI / 2} material={mats.metal}>
            <torusGeometry args={[0.42, 0.05, 16, 48]} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} material={mats.glass}>
            <circleGeometry args={[0.4, 40]} />
          </mesh>
          <mesh position={[0.55, 0, 0.55]} rotation={[0, Math.PI / 4, Math.PI / 2]} material={mats.ink}>
            <cylinderGeometry args={[0.06, 0.06, 0.7, 16]} />
          </mesh>
        </group>
      </group>
      <Tag on={on} position={[0, 1.4, -1]}>Your goals · your users</Tag>
    </Appear>
  );
}

// 03 — a database beside the panel, a cable into the list, packets flowing.
function DataFlow({ on, mats }: { on: boolean; mats: ReturnType<typeof useMats> }) {
  const start = new THREE.Vector3(PLATE[0] / 2 + 1.4, 0.9, 1.6);
  const list = PIECES.find((p) => p.id === "list")!;
  const end = new THREE.Vector3(list.home[0] + list.size[0] / 2, 0.75, list.home[2]);
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3([start, new THREE.Vector3(start.x - 0.4, 1.6, start.z - 0.2), new THREE.Vector3(end.x + 0.5, 1.4, end.z), end]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 48, 0.025, 8, false), [curve]);
  const packets = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.35 * Math.max(getControls().motion, 0.15);
    packets.current.forEach((m, i) => {
      if (m) m.position.copy(curve.getPointAt((t + i / 4) % 1));
    });
  });
  return (
    <Appear on={on}>
      <group position={[start.x, 0, start.z]}>
        {[0, 0.42, 0.84].map((y) => (
          <mesh key={y} position={[0, y + 0.18, 0]} material={mats.ink} castShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.34, 40]} />
          </mesh>
        ))}
        {[0, 0.42, 0.84].map((y) => (
          <mesh key={`r${y}`} position={[0, y + 0.36, 0]} material={mats.signal}>
            <cylinderGeometry args={[0.56, 0.56, 0.03, 40]} />
          </mesh>
        ))}
      </group>
      <mesh geometry={tube} material={mats.metal} />
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          ref={(m) => {
            packets.current[i] = m;
          }}
          material={mats.signal}
        >
          <sphereGeometry args={[0.08, 16, 12]} />
        </mesh>
      ))}
      <Tag on={on} tone="signal" position={[start.x, 1.75, start.z]}>Your data, live</Tag>
    </Appear>
  );
}

// 05 — launch: a ring pulse rising off the plate, and a Live badge.
function Launch({ on, mats }: { on: boolean; mats: ReturnType<typeof useMats> }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const r = ring.current;
    if (!r) return;
    const p = on ? (clock.elapsedTime * 0.5 * Math.max(getControls().motion, 0.2)) % 1 : 0;
    r.scale.setScalar(1 + p * 0.6);
    r.position.y = p * 1.5;
    mats.ring.opacity = on ? (1 - p) * 0.7 : 0;
  });
  return (
    <>
      <mesh ref={ring} rotation-x={-Math.PI / 2} material={mats.ring}>
        <ringGeometry args={[3.6, 3.68, 64]} />
      </mesh>
      <Tag on={on} tone="ok" position={[0, 1.6, -PLATE[2] / 2]}>● Live for your users</Tag>
    </>
  );
}


export default function StageProps({ stage }: { stage: number }) {
  const mats = useMats();
  return (
    <>
      <Brief on={stage === 0} mats={mats} />

      <DataFlow on={stage === 2} mats={mats} />

      {/* 04 — the checks that make it exact. */}
      <Tag on={stage === 3} tone="ok" position={[-PLATE[0] / 2 + 0.6, 0.5, -PLATE[2] / 2 - 0.6]}>✓ Phone · tablet · laptop</Tag>
      <Tag on={stage === 3} tone="ok" position={[0.4, 0.5, -PLATE[2] / 2 - 0.6]}>✓ Loads fast</Tag>
      <Tag on={stage === 3} tone="ok" position={[PLATE[0] / 2 - 0.4, 0.5, -PLATE[2] / 2 - 0.6]}>✓ Easy for everyone</Tag>

      <Launch on={stage === 4} mats={mats} />
    </>
  );
}
