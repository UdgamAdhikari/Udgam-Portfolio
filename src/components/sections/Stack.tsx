import type { CSSProperties } from "react";
import { STACK_ICONS as ICONS } from "@/lib/stack-icons";
import type { StackItem } from "@/data/content";

/** Brand colours too close to black or white vanish in one of the two themes; those stay in ink. */
function hoverColour(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.08 && luminance < 0.85 ? `#${hex}` : undefined;
}

/**
 * One logo in the carousel: the mark on its own, no box, with its name
 * small underneath. Hovering brings up the brand colour. A tool without an
 * official mark has its name set as type in the logo's place.
 */
function Tile({ item }: { item: StackItem }) {
  const icon = item.icon ? ICONS[item.icon] : undefined;
  const brand = icon && hoverColour(icon.hex);
  return (
    <li
      className="group/tile flex w-28 shrink-0 flex-col items-center gap-4 sm:w-40"
      style={brand ? ({ "--brand": brand } as CSSProperties) : undefined}
    >
      <span className="grid h-14 place-items-center transition-transform duration-300 group-hover/tile:-translate-y-1 sm:h-20">
        {icon ? (
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="size-12 transition-colors duration-300 group-hover/tile:text-(--brand,var(--fg)) sm:size-16"
          >
            <path d={icon.path} />
          </svg>
        ) : (
          <span aria-hidden="true" className="font-display text-2xl leading-none font-[660] [font-variation-settings:'wdth'_110] sm:text-3xl">
            {item.name}
          </span>
        )}
      </span>
      <span className="label whitespace-nowrap text-muted transition-colors duration-300 group-hover/tile:text-fg">{item.name}</span>
    </li>
  );
}

/** One row of the carousel: two identical copies, shifted by half for a seamless loop. */
function Row({ items, reverse, label }: { items: StackItem[]; reverse?: boolean; label?: string }) {
  return (
    <div
      className="marquee overflow-hidden py-8 sm:py-10 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
      aria-hidden={label ? undefined : true}
      data-row={reverse ? "2" : "1"}
    >
      <div className="marquee-track flex w-max" data-reverse={reverse ? "" : undefined}>
        <ul aria-label={label} className="flex items-center">
          {items.map((item) => (
            <Tile key={item.name} item={item} />
          ))}
        </ul>
        <ul aria-hidden="true" data-copy className="flex items-center">
          {items.map((item) => (
            <Tile key={item.name} item={item} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Stack({ stack }: { stack: StackItem[] }) {
  // The second row starts halfway through the list, so the rows never line up.
  const half = Math.ceil(stack.length / 2);
  const shifted = [...stack.slice(half), ...stack.slice(0, half)];

  return (
    <section id="stack" aria-labelledby="stack-title" className="border-t border-line py-16 lg:py-24">
      <div className="grid items-end gap-6 px-4 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12">
        <h2
          id="stack-title"
          className="font-display text-[clamp(2.75rem,7vw,7rem)] leading-[0.9] font-[640] tracking-[-0.025em] [font-variation-settings:'wdth'_112] lg:col-span-8"
        >
          The toolkit
          <span className="ml-[0.2em] inline-block align-top text-[0.32em] font-[400] whitespace-nowrap text-muted tabular-nums">
            ( {stack.length} )
          </span>
        </h2>
        <p className="max-w-[40ch] text-lg leading-snug text-pretty lg:col-span-4">
          What I build with every day, and the tools around it, from the first commit to deployment.
        </p>
      </div>

      <div
        data-part="Stack · carousel"
        className="mt-12 border-y border-line lg:mt-16"
      >
        <Row items={stack} label="Technologies I use" />
        <div className="border-t border-line" />
        <Row items={shifted} reverse />
      </div>

    </section>
  );
}
