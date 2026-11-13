"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Intro.module.css";

// Matches the progress line in Intro.module.css (0.1s delay, 1.5s fill).
const COUNT_DELAY_MS = 100;
const COUNT_MS = 1500;
// Letters start rising after the frame begins drawing, one every 45ms.
const LETTER_START_S = 0.25;
const LETTER_STEP_S = 0.045;

// Played once per page load: going back to the home page from a case study
// (a client-side navigation) doesn't replay it.
let played = false;

/**
 * Opening screen on a full page load, in black and white: the name and
 * "@Portfolio" are set letter by letter, with the role and a counter under
 * them, then the screen splits open to reveal the site. Decorative only
 * (aria-hidden, never blocks clicks); skipped entirely when motion is set
 * to still or the visitor prefers reduced motion.
 */
export default function Intro({ name, role }: { name: string; role: string }) {
  // Read once when it mounts: on the first load this is false (and so matches
  // the server HTML); later re-renders must not see the flag set below.
  const [alreadyPlayed] = useState(() => played);
  const [gone, setGone] = useState(false);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (alreadyPlayed) return;
    played = true;
    let frame = 0;
    // The bar starts on first paint, which can be well before this script
    // runs, so read its own clock and the number catches up with it.
    const bar = barRef.current?.getAnimations?.()[0];
    const start = performance.now() + COUNT_DELAY_MS;
    const tick = (now: number) => {
      const barTime = typeof bar?.currentTime === "number" ? bar.currentTime : null;
      // The animation's clock includes its 0.1s delay.
      const elapsed = barTime !== null ? barTime - COUNT_DELAY_MS : now - start;
      const t = Math.min(1, Math.max(0, elapsed / COUNT_MS));
      // Same ease as the bar, so the number and the line agree.
      const eased = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      if (countRef.current) countRef.current.textContent = String(Math.round(eased * 100)).padStart(3, "0");
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [alreadyPlayed]);

  if (alreadyPlayed || gone) return null;

  let index = 0;
  const words = name.split(" ").map((word) =>
    word.split("").map((char) => ({ char, delay: LETTER_START_S + index++ * LETTER_STEP_S })),
  );
  // The second line starts while the name is finishing, a little faster.
  const handle = "@Portfolio".split("").map((char, i) => ({ char, delay: 0.55 + i * 0.03 }));

  return (
    <div aria-hidden="true" className={styles.root}>
      <span className={`${styles.half} ${styles.top}`} />
      <span
        className={`${styles.half} ${styles.bottom}`}
        // The last thing to finish: then the intro is removed.
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) setGone(true);
        }}
      />

      <div className={styles.frame}>
        <p className={styles.name}>
          {words.map((letters, w) => (
            <span key={w} className={styles.word}>
              {letters.map(({ char, delay }, c) => (
                <span key={c} className={styles.char} style={{ animationDelay: `${delay}s` }}>
                  {char}
                </span>
              ))}
            </span>
          ))}
        </p>
        <p className={`${styles.name} ${styles.handle}`}>
          <span className={styles.word}>
            {handle.map(({ char, delay }, c) => (
              <span key={c} className={styles.char} style={{ animationDelay: `${delay}s` }}>
                {char}
              </span>
            ))}
          </span>
        </p>

        <div className={styles.meta}>
          <span>{role}</span>
          <span ref={countRef} className={styles.count}>
            000
          </span>
        </div>
        <div className={styles.track}>
          <span ref={barRef} className={styles.bar} />
        </div>
      </div>
    </div>
  );
}
