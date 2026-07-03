import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { prefersReducedMotion } from "../lib/motion";

export default function Preloader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setVisible(false);
      onDone();
      return;
    }
    let value = 0;
    const interval = setInterval(() => {
      value = Math.min(value + Math.random() * 22 + 8, 100);
      setProgress(Math.floor(value));
      if (value >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setVisible(false);
          onDone();
        }, 300);
      }
    }, 110);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            className="font-display text-3xl font-bold tracking-tight text-white"
          >
            UA<span className="text-accent">.</span>
          </motion.span>

          <div className="mt-8 h-px w-48 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-accent to-pink-500"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>

          <span className="mt-4 font-display text-xs font-medium tabular-nums tracking-[0.3em] text-white/40">
            {progress}%
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
