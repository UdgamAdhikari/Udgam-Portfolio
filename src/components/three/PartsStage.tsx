"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { StageVariant } from "./PartsScene";

// three.js stays out of the initial bundle: the headline paints first.
const PartsCanvas = dynamic(() => import("./PartsCanvas"), { ssr: false });

interface Props {
  variant?: StageVariant;
  progress?: RefObject<number>;
}

export default function PartsStage({ variant, progress }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Mount the scene shortly before it scrolls into view, and stop rendering
  // entirely while it is out of view.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), {
      rootMargin: "200px 0px",
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const [mounted, setMounted] = useState(false);
  if (visible && !mounted) setMounted(true);

  return (
    <div ref={ref} className="relative h-full w-full">
      {mounted && <PartsCanvas active={visible} variant={variant} progress={progress} />}
    </div>
  );
}
