import { useRef, ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { isTouchDevice, prefersReducedMotion } from "../lib/motion";

// Wraps a button/link so it gently pulls toward the cursor.
export default function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 15, mass: 0.2 });
  const sy = useSpring(y, { stiffness: 180, damping: 15, mass: 0.2 });

  const disabled = isTouchDevice() || prefersReducedMotion();

  const onMouseMove = (e: React.MouseEvent) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.35);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.35);
  };

  const onMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ x: sx, y: sy }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}
