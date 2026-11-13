"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import * as THREE from "three";
import { getControls, setControls, type Theme } from "@/lib/controls";
import { profile } from "@/data/content";

// ── Palette ──────────────────────────────────────────────────────
// Parts are matte clay. In graphite the light and dark parts swap, the
// same way the page inverts, so the bench always reads as one object.

type Swatch = "clay" | "ink" | "groove" | "signal";

const PALETTE: Record<Theme, Record<Swatch, string> & { shadow: number }> = {
  paper: { clay: "#f7f5f0", ink: "#2b2a28", groove: "#d3cec3", signal: "#e0482a", shadow: 0.17 },
  graphite: { clay: "#3b3a37", ink: "#e9e5dd", groove: "#4b4945", signal: "#f0532f", shadow: 0.5 },
};

type Materials = Record<Swatch, THREE.MeshStandardMaterial>;

function useMaterials(): Materials {
  const mats = useMemo(() => {
    const { theme } = getControls();
    const make = (swatch: Swatch, roughness: number) =>
      new THREE.MeshStandardMaterial({ color: PALETTE[theme][swatch], roughness, metalness: 0 });
    return {
      clay: make("clay", 0.85),
      ink: make("ink", 0.7),
      groove: make("groove", 0.9),
      signal: make("signal", 0.6),
    };
  }, []);

  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  return mats;
}

/** Eases every material toward the active theme, so a theme change reads as a re-glaze. */
function PaletteDriver({ mats }: { mats: Materials }) {
  const target = useMemo(() => new THREE.Color(), []);
  useFrame((_, dt) => {
    const { theme, motion } = getControls();
    const k = motion === 0 ? 1 : 1 - Math.exp(-dt * 5);
    (["clay", "ink", "groove", "signal"] as const).forEach((swatch) => {
      mats[swatch].color.lerp(target.set(PALETTE[theme][swatch]), k);
    });
  });
  return null;
}

// ── Stage context ────────────────────────────────────────────────

interface Stage {
  mats: Materials;
  /** Pointer position on the bench, in the parts' local space; null when away. */
  pointer: RefObject<THREE.Vector3 | null>;
  /** 0 = scattered on the bench, 1 = assembled into the panel. */
  progress: RefObject<number>;
}

const StageContext = createContext<Stage | null>(null);
const useStage = () => {
  const stage = useContext(StageContext);
  if (!stage) throw new Error("Part rendered outside the bench");
  return stage;
};

const damp = THREE.MathUtils.damp;
type Vec3 = [number, number, number];

/** Eases a 0–1 value in and out, so parts accelerate off the bench and settle into place. */
const settle = (x: number) => x * x * (3 - 2 * x);

// ── Part: shared behaviour ───────────────────────────────────────
// Every part drops onto the bench in turn, floats a little, leans toward
// the pointer like a weak magnet, and lifts when hovered. When the stage is
// assembling, each part travels in turn from its bench pose to its slot.

interface Pose {
  rest: Vec3;
  rotation: Vec3;
}

interface PartProps {
  index: number;
  rest: Vec3;
  rotation?: Vec3;
  /** Where the part sits in the assembled panel, if this stage assembles. */
  slot?: Pose;

  /** Interactive parts get a pointer cursor and a press handler. */
  onPress?: () => void;
  children: ReactNode;
}

function Part({ index, rest, rotation = [0, 0, 0], slot, onPress, children }: PartProps) {
  const ref = useRef<THREE.Group>(null);
  const hovered = useRef(false);
  const pressed = useRef(false);
  const startedAt = useRef<number | null>(null);
  const { pointer, progress } = useStage();

  useFrame((state, dt) => {
    const group = ref.current;
    if (!group) return;
    const { motion } = getControls();
    const t = state.clock.elapsedTime;
    startedAt.current ??= t;
    const since = t - startedAt.current;

    // Entrance: each part waits its turn above the bench, then drops in.
    const waiting = motion > 0 && since < 0.15 + index * 0.08;
    const drop = waiting ? 3.5 : 0;

    // Assembly: parts leave the bench one after another across the scroll.
    const a = slot ? settle(THREE.MathUtils.clamp(progress.current * 1.6 - index * 0.07, 0, 1)) : 0;
    const lerp = THREE.MathUtils.lerp;
    const target: Vec3 = slot ? [0, 1, 2].map((i) => lerp(rest[i]!, slot.rest[i]!, a)) as Vec3 : rest;
    const turn: Vec3 = slot ? [0, 1, 2].map((i) => lerp(rotation[i]!, slot.rotation[i]!, a)) as Vec3 : rotation;
    const loose = 1 - a;

    let pullX = 0;
    let pullZ = 0;
    const p = pointer.current;
    if (p) {
      const dx = p.x - target[0];
      const dz = p.z - target[2];
      const falloff = Math.exp(-(dx * dx + dz * dz) / 2.4);
      pullX = dx * falloff * 0.32 * loose;
      pullZ = dz * falloff * 0.32 * loose;
    }

    // An arc lifts each part over its neighbours on the way to its slot.
    const arc = Math.sin(a * Math.PI) * 1.2;
    const float = Math.sin(t * 0.8 + index * 1.7) * 0.07 * motion * loose;
    const lift = hovered.current ? (slot && a > 0.5 ? 0.08 : 0.2) : 0;
    const press = pressed.current ? -0.12 : 0;
    const lambda = motion === 0 ? 30 : waiting ? 100 : 7;

    group.position.x = damp(group.position.x, target[0] + pullX, lambda, dt);
    group.position.y = damp(group.position.y, target[1] + arc + float + lift + press + drop, lambda, dt);
    group.position.z = damp(group.position.z, target[2] + pullZ, lambda, dt);

    const wobble = Math.sin(t * 0.6 + index) * 0.04 * motion * loose;
    group.rotation.x = damp(group.rotation.x, turn[0] + pullZ * 0.5, lambda, dt);
    group.rotation.y = damp(group.rotation.y, turn[1] + wobble, lambda, dt);
    group.rotation.z = damp(group.rotation.z, turn[2] - pullX * 0.5, lambda, dt);
  });

  const interactive = Boolean(onPress);

  return (
    <group
      ref={ref}
      position={[rest[0], rest[1] + 3.5, rest[2]]}
      rotation={rotation}
      onPointerOver={(e) => {
        e.stopPropagation();
        hovered.current = true;
        if (interactive) document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hovered.current = false;
        pressed.current = false;
        document.body.style.cursor = "";
      }}
      onPointerDown={interactive ? () => (pressed.current = true) : undefined}
      onPointerUp={interactive ? () => (pressed.current = false) : undefined}
      onClick={
        onPress
          ? (e) => {
              e.stopPropagation();
              onPress();
            }
          : undefined
      }
    >
      {children}
    </group>
  );
}

// ── Working parts ────────────────────────────────────────────────

/** The theme switch. Flipping it re-glazes the whole site. */
function TogglePart(props: Omit<PartProps, "children" | "onPress">) {
  const { mats } = useStage();
  const knob = useRef<THREE.Mesh>(null);
  const track = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.6 }), []);
  useEffect(() => () => track.dispose(), [track]);

  useFrame((_, dt) => {
    const { theme, motion } = getControls();
    const on = theme === "graphite";
    const k = motion === 0 ? 1 : 1 - Math.exp(-dt * 12);
    if (knob.current) knob.current.position.x += ((on ? 0.42 : -0.42) - knob.current.position.x) * k;
    track.color.lerp(on ? mats.signal.color : mats.groove.color, k);
  });

  return (
    <Part
      {...props}
      onPress={() => setControls({ theme: getControls().theme === "graphite" ? "paper" : "graphite" })}
    >
      <group scale={[1, 0.32, 1]}>
        <mesh rotation-z={Math.PI / 2} material={track} castShadow receiveShadow>
          <capsuleGeometry args={[0.42, 0.84, 8, 32]} />
        </mesh>
      </group>
      <mesh ref={knob} position={[-0.42, 0.2, 0]} scale={[1, 0.62, 1]} material={mats.clay} castShadow>
        <sphereGeometry args={[0.34, 40, 24]} />
      </mesh>
    </Part>
  );
}

const SLIDER_LENGTH = 3;

/** The motion slider. Dragging it sets how much the whole site moves. */
function SliderPart(props: Omit<PartProps, "children" | "onPress">) {
  const { mats } = useStage();
  const root = useRef<THREE.Group>(null);
  const handle = useRef<THREE.Group>(null);
  const fill = useRef<THREE.Mesh>(null);
  const dragging = useRef(false);
  const plane = useMemo(() => new THREE.Plane(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const { motion } = getControls();
    const x = -SLIDER_LENGTH / 2 + motion * SLIDER_LENGTH;
    if (handle.current) handle.current.position.x = damp(handle.current.position.x, x, 18, dt);
    if (fill.current && handle.current) {
      const width = Math.max(0.001, handle.current.position.x + SLIDER_LENGTH / 2);
      fill.current.scale.x = width;
      fill.current.position.x = -SLIDER_LENGTH / 2 + width / 2;
    }
  });

  const update = (e: ThreeEvent<PointerEvent>) => {
    if (!root.current) return;
    // Project the pointer onto the slider's own horizontal plane, then read x.
    const origin = root.current.getWorldPosition(hit);
    plane.set(new THREE.Vector3(0, 1, 0), -origin.y);
    if (!e.ray.intersectPlane(plane, hit)) return;
    const local = root.current.worldToLocal(hit);
    const value = THREE.MathUtils.clamp(local.x / SLIDER_LENGTH + 0.5, 0, 1);
    setControls({ motion: Math.round(value * 20) / 20 });
  };

  return (
    <Part {...props}>
      <group
        ref={root}
        onPointerDown={(e) => {
          e.stopPropagation();
          (e.target as unknown as Element).setPointerCapture(e.pointerId);
          dragging.current = true;
          update(e);
        }}
        onPointerMove={(e) => dragging.current && update(e)}
        onPointerUp={(e) => {
          dragging.current = false;
          (e.target as unknown as Element).releasePointerCapture(e.pointerId);
        }}
        onPointerOver={() => (document.body.style.cursor = "ew-resize")}
      >
        <RoundedBox args={[SLIDER_LENGTH, 0.1, 0.22]} radius={0.05} material={mats.groove} receiveShadow />
        <mesh ref={fill} position={[0, 0.02, 0]} material={mats.signal}>
          <boxGeometry args={[1, 0.11, 0.18]} />
        </mesh>
        <group ref={handle} position={[SLIDER_LENGTH / 2, 0.12, 0]}>
          <mesh material={mats.clay} castShadow>
            <cylinderGeometry args={[0.27, 0.27, 0.24, 48]} />
          </mesh>
          <mesh position={[0, 0.01, 0]} material={mats.ink}>
            <cylinderGeometry args={[0.07, 0.07, 0.25, 24]} />
          </mesh>
        </group>
        {/* A wider invisible hit area so the slider is easy to grab. */}
        <mesh visible={false}>
          <boxGeometry args={[SLIDER_LENGTH + 0.6, 0.6, 0.9]} />
        </mesh>
      </group>
    </Part>
  );
}

/** Draws a label once the mono face has loaded, as a white-on-clear texture the material can tint. */
function useLabelTexture(text: string) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: THREE.CanvasTexture | null = null;
    const family =
      getComputedStyle(document.documentElement).getPropertyValue("--font-plex-mono").trim() || "monospace";
    const font = `500 88px ${family}`;

    // The family list includes a local fallback face that may not exist, which
    // rejects the load; draw with whatever resolved either way.
    const primary = `500 88px ${family.split(",")[0]}`;
    document.fonts.load(primary).catch(() => undefined).then(() => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.font = font;
      ctx.letterSpacing = "6px";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 512, 132);
      created = new THREE.CanvasTexture(canvas);
      created.colorSpace = THREE.SRGBColorSpace;
      created.anisotropy = 4;
      setTexture(created);
    });

    return () => {
      cancelled = true;
      created?.dispose();
    };
  }, [text]);

  return texture;
}

/** The contact button. It opens an email, like its HTML twin. */
function ButtonPart(props: Omit<PartProps, "children" | "onPress">) {
  const { mats } = useStage();
  const texture = useLabelTexture("SAY HELLO →");
  const label = useRef<THREE.MeshBasicMaterial>(null);

  // The label is printed in the clay colour, so it inverts with the theme.
  useFrame(() => label.current?.color.copy(mats.clay.color));

  return (
    <Part
      {...props}
      onPress={() => {
        window.setTimeout(() => (window.location.href = `mailto:${profile.email}`), 180);
      }}
    >
      <RoundedBox args={[2.2, 0.34, 0.86]} radius={0.12} smoothness={6} material={mats.ink} castShadow />
      {texture && (
        <mesh position={[0, 0.172, 0.02]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.9, 0.475]} />
          <meshBasicMaterial ref={label} map={texture} transparent toneMapped={false} />
        </mesh>
      )}
    </Part>
  );
}

// ── Decorative parts ─────────────────────────────────────────────

function InputPart(props: Omit<PartProps, "children" | "onPress">) {
  const { mats } = useStage();
  const caret = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (caret.current) caret.current.visible = getControls().motion === 0 || clock.elapsedTime % 1.1 < 0.6;
  });
  return (
    <Part {...props}>
      <RoundedBox args={[2.8, 0.2, 0.64]} radius={0.08} material={mats.clay} castShadow receiveShadow />
      <mesh ref={caret} position={[-1.0, 0.12, 0]} material={mats.signal}>
        <boxGeometry args={[0.045, 0.05, 0.3]} />
      </mesh>
    </Part>
  );
}

function CardPart(props: Omit<PartProps, "children" | "onPress">) {
  const { mats } = useStage();
  return (
    <Part {...props}>
      <RoundedBox args={[1.7, 0.1, 2.1]} radius={0.045} material={mats.clay} castShadow receiveShadow />
      <mesh position={[0, 0.056, -0.5]} material={mats.groove}>
        <boxGeometry args={[1.4, 0.015, 0.8]} />
      </mesh>
      {[1.3, 1.0, 0.65].map((width, i) => (
        <mesh key={i} position={[-0.7 + width / 2, 0.056, 0.2 + i * 0.22]} material={mats.ink}>
          <boxGeometry args={[width, 0.015, 0.08]} />
        </mesh>
      ))}
    </Part>
  );
}

// A tick drawn on the lid as two strokes: short down-stroke, long up-stroke.
const CHECK_STROKES = (() => {
  const points: [number, number][] = [
    [-0.17, -0.01],
    [-0.05, 0.11],
    [0.18, -0.14],
  ];
  return points.slice(1).map(([x, z], i) => {
    const [px, pz] = points[i]!;
    const dx = x - px;
    const dz = z - pz;
    return {
      position: [(x + px) / 2, 0.3, (z + pz) / 2] as Vec3,
      angle: -Math.atan2(dz, dx),
      length: Math.hypot(dx, dz) + 0.06,
    };
  });
})();

function CheckboxPart(props: Omit<PartProps, "children" | "onPress">) {
  const { mats } = useStage();
  return (
    <Part {...props}>
      <RoundedBox args={[0.58, 0.58, 0.58]} radius={0.12} material={mats.signal} castShadow />
      {CHECK_STROKES.map((stroke, i) => (
        <mesh key={i} position={stroke.position} rotation-y={stroke.angle} material={mats.clay}>
          <boxGeometry args={[stroke.length, 0.04, 0.075]} />
        </mesh>
      ))}
    </Part>
  );
}

function RadioPart(props: Omit<PartProps, "children" | "onPress">) {
  const { mats } = useStage();
  return (
    <Part {...props}>
      <mesh material={mats.clay} castShadow>
        <cylinderGeometry args={[0.38, 0.38, 0.14, 48]} />
      </mesh>
      <mesh material={mats.ink}>
        <cylinderGeometry args={[0.15, 0.15, 0.16, 32]} />
      </mesh>
    </Part>
  );
}

function ChipPart(props: Omit<PartProps, "children" | "onPress">) {
  const { mats } = useStage();
  return (
    <Part {...props}>
      <group scale={[1, 0.3, 1]}>
        <mesh rotation-z={Math.PI / 2} material={mats.ink} castShadow>
          <capsuleGeometry args={[0.26, 0.7, 6, 24]} />
        </mesh>
      </group>
      <mesh position={[-0.35, 0.09, 0]} material={mats.signal}>
        <cylinderGeometry args={[0.07, 0.07, 0.04, 20]} />
      </mesh>
    </Part>
  );
}

function SpinnerPart(props: Omit<PartProps, "children" | "onPress">) {
  const { mats } = useStage();
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.z -= dt * 1.4 * getControls().motion;
  });
  return (
    <Part {...props}>
      <mesh rotation-x={-Math.PI / 2} material={mats.groove} castShadow>
        <torusGeometry args={[0.34, 0.07, 16, 48]} />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.01, 0]} material={mats.ink}>
        <torusGeometry args={[0.34, 0.075, 16, 48, Math.PI * 0.6]} />
      </mesh>
    </Part>
  );
}

// ── Layouts ──────────────────────────────────────────────────────
// Rest positions are composed by hand for two stage shapes. Working parts
// sit nearest the viewer; decorative parts frame them.

type PartKind = "card" | "input" | "toggle" | "slider" | "button" | "checkbox" | "radio" | "chip" | "spinner";
type Layout = Record<PartKind, Pose>;

const WIDE: Layout = {
  input: { rest: [1.4, 0.55, -1.9], rotation: [0, -0.1, 0] },
  spinner: { rest: [4.0, 0.8, -1.7], rotation: [0.25, 0, 0.2] },
  radio: { rest: [-0.9, 0.9, -1.2], rotation: [0.4, 0, 0.3] },
  chip: { rest: [3.0, 0.85, -0.3], rotation: [0, 0.45, 0.15] },
  card: { rest: [-2.9, 0.45, 0.6], rotation: [0, 0.38, 0.06] },
  toggle: { rest: [0.3, 0.6, 0.15], rotation: [0, 0.18, 0] },
  checkbox: { rest: [-1.9, 0.75, 2.3], rotation: [0.3, 0.6, 0.2] },
  slider: { rest: [0.6, 0.45, 1.85], rotation: [0, -0.06, 0] },
  button: { rest: [3.4, 0.6, 1.3], rotation: [0, -0.32, 0] },
};

const COMPACT: Layout = {
  input: { rest: [0.1, 0.55, -2.7], rotation: [0, -0.1, 0] },
  card: { rest: [-1.5, 0.45, -1.1], rotation: [0, 0.32, 0.06] },
  spinner: { rest: [1.6, 0.8, -1.5], rotation: [0.25, 0, 0.2] },
  toggle: { rest: [0.9, 0.6, 0.0], rotation: [0, -0.15, 0] },
  chip: { rest: [-1.4, 0.85, 0.9], rotation: [0, 0.45, 0.15] },
  slider: { rest: [0, 0.45, 1.9], rotation: [0, -0.04, 0] },
  button: { rest: [0.5, 0.6, 3.1], rotation: [0, -0.12, 0] },
  checkbox: { rest: [-1.7, 0.75, 2.9], rotation: [0.3, 0.6, 0.2] },
  radio: { rest: [1.7, 0.9, 1.0], rotation: [0.4, 0, 0.3] },
};

// The assembled panel: a small dashboard laid out on a base plate whose top
// sits at y = PLATE_TOP. Each y is the plate top plus the part's half-height.
const PLATE_TOP = 0.3;
const flat = (x: number, lift: number, z: number): Pose => ({ rest: [x, PLATE_TOP + lift, z], rotation: [0, 0, 0] });

const ASSEMBLED: Layout = {
  input: flat(-0.9, 0.1, -1.55),
  radio: flat(1.35, 0.07, -1.55),
  spinner: flat(2.65, 0.08, -1.55),
  card: flat(-2.3, 0.05, 0.45),
  toggle: flat(0.05, 0.14, -0.4),
  chip: flat(1.75, 0.08, -0.4),
  checkbox: flat(2.95, 0.29, -0.4),
  slider: flat(0.95, 0.05, 0.75),
  button: flat(1.6, 0.17, 1.75),
};

/** The base plate the panel is assembled on. It grows in as the parts arrive. */
function Plate() {
  const { mats, progress } = useStage();
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const group = ref.current;
    if (!group) return;
    const grown = settle(THREE.MathUtils.clamp(progress.current * 2.2 - 0.15, 0, 1));
    const s = damp(group.scale.x, Math.max(grown, 0.0001), 10, dt);
    group.scale.set(s, s, s);
    group.visible = s > 0.002;
  });
  return (
    <group ref={ref} position={[0.3, PLATE_TOP - 0.07, 0.05]} scale={0.0001}>
      <RoundedBox args={[7.4, 0.14, 4.6]} radius={0.06} material={mats.groove} receiveShadow castShadow />
    </group>
  );
}

const ORDER: PartKind[] = ["input", "card", "toggle", "slider", "button", "radio", "chip", "spinner", "checkbox"];
const COMPONENTS: Record<PartKind, (p: Omit<PartProps, "children" | "onPress">) => ReactNode> = {
  card: CardPart,
  input: InputPart,
  toggle: TogglePart,
  slider: SliderPart,
  button: ButtonPart,
  checkbox: CheckboxPart,
  radio: RadioPart,
  chip: ChipPart,
  spinner: SpinnerPart,
};

// ── Bench ────────────────────────────────────────────────────────

const BENCH_HEIGHT = 0.6;

export type StageVariant = "bench" | "assembly";

interface BenchProps {
  variant: StageVariant;
  inside: RefObject<boolean>;
  progress: RefObject<number>;
}

function Bench({ variant, inside, progress }: BenchProps) {
  const mats = useMaterials();
  const shadow = useRef<THREE.ShadowMaterial>(null);
  const { size, viewport } = useThree();
  const compact = size.width < 640;
  const layout = compact ? COMPACT : WIDE;
  const assembles = variant === "assembly";
  const scale = compact
    ? Math.min(assembles ? 0.8 : 1, viewport.width / (assembles ? 8.6 : 5.4))
    : Math.min(1.05, viewport.width / 10.4);

  const pointer = useRef<THREE.Vector3 | null>(null);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -BENCH_HEIGHT), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    // Pointer → bench plane, expressed in the parts' (scaled) local space.
    if (inside.current) {
      raycaster.setFromCamera(state.pointer, state.camera);
      pointer.current = raycaster.ray.intersectPlane(plane, hit) ? hit.divideScalar(scale) : null;
    } else {
      pointer.current = null;
    }

    const { motion, theme } = getControls();
    const material = shadow.current;
    if (material) {
      const k = motion === 0 ? 1 : 1 - Math.exp(-dt * 5);
      material.opacity += (PALETTE[theme].shadow - material.opacity) * k;
    }

    // A slight camera drift toward the pointer gives the bench depth. As the
    // panel assembles the camera rises to look down on it like a plan view.
    const a = assembles ? settle(THREE.MathUtils.clamp(progress.current * 1.4, 0, 1)) : 0;
    const px = inside.current ? state.pointer.x : 0;
    const py = inside.current ? state.pointer.y : 0;
    const lambda = motion === 0 ? 30 : 3;
    state.camera.position.x = damp(state.camera.position.x, px * 0.6 * motion, lambda, dt);
    state.camera.position.y = damp(state.camera.position.y, 7.2 + a * 2.2 + py * 0.4 * motion, lambda, dt);
    state.camera.position.z = damp(state.camera.position.z, 7.6 - a * 3.4, lambda, dt);
    // Aim a little in front of centre so the parts sit high in the frame.
    state.camera.lookAt(0, 0.4, (compact ? 0.4 : 1.1) * (1 - a));
  });

  const stage = useMemo(() => ({ mats, pointer, progress }), [mats, progress]);

  return (
    <StageContext.Provider value={stage}>
      <PaletteDriver mats={mats} />
      <hemisphereLight args={["#ffffff", "#d9d3c7", 1.15]} />
      <directionalLight
        castShadow
        position={[3.5, 9, 5]}
        intensity={2.3}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={6}
      />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial ref={shadow} opacity={PALETTE[getControls().theme].shadow} />
      </mesh>
      <group scale={scale}>
        {assembles && <Plate />}
        {ORDER.map((kind, index) => {
          const Component = COMPONENTS[kind];
          return (
            <Component
              key={`${kind}-${compact}`}
              index={index}
              {...layout[kind]}
              slot={assembles ? ASSEMBLED[kind] : undefined}
            />
          );
        })}
      </group>
    </StageContext.Provider>
  );
}

const AT_REST = { current: 0 };

interface PartsSceneProps {
  active: boolean;
  variant?: StageVariant;
  /** Scroll-driven assembly progress, written by the section that owns the stage. */
  progress?: RefObject<number>;
}

export default function PartsScene({ active, variant = "bench", progress = AT_REST }: PartsSceneProps) {
  const inside = useRef(false);

  return (
    <div
      className="absolute inset-0 touch-pan-y"
      aria-hidden="true"
      onPointerEnter={() => (inside.current = true)}
      onPointerLeave={() => {
        inside.current = false;
        document.body.style.cursor = "";
      }}
    >
      <Canvas
        shadows="percentage"
        dpr={[1, 1.75]}
        frameloop={active ? "always" : "never"}
        camera={{ position: [0, 7.2, 7.6], fov: 30 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}
      >
        <Bench variant={variant} inside={inside} progress={progress} />
      </Canvas>
    </div>
  );
}
