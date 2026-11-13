/**
 * The contact panel's own backdrop, deliberately unlike the rest of the page
 * (no parts, no bench): a fine dot grid, a dial of concentric rings centred
 * on the call button, and a warm glow rising from below. Pure CSS/SVG in the
 * theme's own colours, so it follows paper/graphite and costs no image.
 * The dial is a separate piece (<ContactDial />) so it can be anchored to
 * the call button itself, wherever the layout puts it.
 */
export default function ContactBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Warm light from below the button. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_100%,color-mix(in_srgb,var(--signal)_26%,transparent),transparent_70%)]" />
      {/* Cool light from above, so the top doesn't go flat. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,color-mix(in_srgb,var(--fg)_9%,transparent),transparent_70%)]" />

      {/* Dot grid, fading out towards the edges. */}
      <div className="absolute inset-0 bg-[radial-gradient(color-mix(in_srgb,var(--fg)_22%,transparent)_1px,transparent_1.3px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_65%_60%_at_50%_50%,#000_20%,transparent_75%)]" />

      {/* Keep the edges quiet so the text stays readable. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_85%_at_50%_50%,transparent_55%,var(--bg)_100%)]" />
    </div>
  );
}

const TICKS = Array.from({ length: 72 }, (_, i) => i);

/**
 * Concentric rings and a tick dial, centred on its (relative) parent. The
 * tick ring turns very slowly and stops when motion is set to still.
 */
export function ContactDial() {
  return (
    <svg
      aria-hidden="true"
      viewBox="-500 -500 1000 1000"
      className="pointer-events-none absolute top-1/2 left-1/2 -z-10 w-[min(1000px,190vw)] -translate-x-1/2 -translate-y-1/2 text-fg"
    >
      <g fill="none" stroke="currentColor">
        <circle r="150" strokeOpacity="0.16" />
        <circle r="230" strokeOpacity="0.12" strokeDasharray="2 10" />
        <circle r="320" strokeOpacity="0.1" />
        <circle r="440" strokeOpacity="0.07" strokeDasharray="1 7" />
      </g>
      {/* Rotate about the dial's centre (0,0), not the corner of the view box. */}
      <g
        style={{ transformBox: "view-box", transformOrigin: "0px 0px" }}
        className="motion-safe:animate-[spin_180s_linear_infinite] [:root[data-motion='0']_&]:animate-none"
      >
        {TICKS.map((i) => (
          <line
            key={i}
            x1="0"
            y1={i % 6 === 0 ? -336 : -328}
            x2="0"
            y2="-320"
            stroke="currentColor"
            strokeOpacity={i % 6 === 0 ? 0.32 : 0.14}
            transform={`rotate(${i * 5})`}
          />
        ))}
        {/* One lit marker on the dial, in the signal colour. */}
        {/* Starts lower right, clear of the heading, even when motion is still. */}
        <circle cx="0" cy="-320" r="4" fill="var(--signal)" transform="rotate(130)" />
      </g>
      {/* Crosshair through the centre. */}
      <g stroke="currentColor" strokeOpacity="0.08">
        <line x1="-500" y1="0" x2="-170" y2="0" />
        <line x1="170" y1="0" x2="500" y2="0" />
      </g>
    </svg>
  );
}
