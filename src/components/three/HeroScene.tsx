import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState, prefersReducedMotion, isTouchDevice } from "../../lib/motion";

// Soft round sprite so particles render as glowing dots, not squares
function makeDotTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.4)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function Starfield({ reduced, mobile }: { reduced: boolean; mobile: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const near = useRef<THREE.Points>(null!);
  const mouse = useRef({ x: 0, y: 0 });

  const texture = useMemo(makeDotTexture, []);
  const count = mobile ? 200 : 600;

  const [farPositions, nearPositions] = useMemo(() => {
    const make = (n: number, spread: number, depth: number) => {
      const arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        arr[i * 3] = (Math.random() - 0.5) * spread;
        arr[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.7;
        arr[i * 3 + 2] = -Math.random() * depth;
      }
      return arr;
    };
    return [make(count, 26, 14), make(Math.floor(count / 3), 20, 8)];
  }, [count]);

  const farMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.07,
        map: texture,
        color: new THREE.Color("#8b5cf6"),
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    [texture]
  );

  const nearMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.12,
        map: texture,
        color: new THREE.Color("#ec4899"),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    [texture]
  );

  useFrame((state, delta) => {
    // Lerped mouse parallax
    mouse.current.x = THREE.MathUtils.damp(mouse.current.x, state.pointer.x, 2.5, delta);
    mouse.current.y = THREE.MathUtils.damp(mouse.current.y, state.pointer.y, 2.5, delta);

    const p = scrollState.progress;

    if (group.current) {
      group.current.rotation.y = mouse.current.x * 0.08 + (reduced ? 0 : state.clock.elapsedTime * 0.008);
      group.current.rotation.x = -mouse.current.y * 0.05;
      // Gentle upward drift as the page scrolls, so the field feels alive across sections
      group.current.position.y = p * 3;
    }

    // Accent particles slowly shift hue from pink (top) toward cyan (bottom)
    if (near.current) {
      (near.current.material as THREE.PointsMaterial).color.setHSL(0.9 - p * 0.4, 0.7, 0.65);
    }
  });

  return (
    <group ref={group}>
      <points material={farMaterial}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[farPositions, 3]} />
        </bufferGeometry>
      </points>
      <points ref={near} material={nearMaterial}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nearPositions, 3]} />
        </bufferGeometry>
      </points>
    </group>
  );
}

// Fixed full-screen ambient particle field behind the page
export default function HeroScene() {
  const reduced = prefersReducedMotion();
  const mobile = isTouchDevice();

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        frameloop={reduced ? "demand" : "always"}
        eventSource={document.body}
        eventPrefix="client"
      >
        <Starfield reduced={reduced} mobile={mobile} />
      </Canvas>
    </div>
  );
}
