import type { CSSProperties } from "react";
import { STACK_ICONS as ICONS } from "@/lib/stack-icons";
import type { SkillGroup, StackItem } from "@/data/content";

// Skill names (as written in skillGroups) → simple-icons slugs, where one exists.
const SKILL_ICON: Record<string, string> = {
  "JavaScript (ES6+)": "javascript",
  TypeScript: "typescript",
  HTML5: "html5",
  CSS3: "css",
  React: "react",
  "Next.js": "nextdotjs",
  "Tailwind CSS": "tailwindcss",
  "shadcn/ui": "shadcnui",
  "Node.js": "nodedotjs",
  "Express.js (beginner)": "express",
  "React Context API": "react",
  PostgreSQL: "postgresql",
  MongoDB: "mongodb",
  "Git & GitHub": "github",
  Docker: "docker",
  Linux: "linux",
  Vercel: "vercel",
  Postman: "postman",
};

/** Brand colours too close to black or white vanish in one of the two themes; those stay in ink. */
function hoverColour(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.08 && luminance < 0.85 ? `#${hex}` : undefined;
}

function Tile({ item }: { item: StackItem }) {
  const icon = item.icon ? ICONS[item.icon] : undefined;
  const brand = icon && hoverColour(icon.hex);
  return (
    <li
      className="group/tile grid size-32 shrink-0 place-items-center content-center gap-3 rounded-2xl border border-line bg-[color-mix(in_srgb,var(--fg)_5%,var(--bg))] transition-[translate,border-color] duration-300 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--fg)_35%,transparent)] sm:size-40"
      style={brand ? ({ "--brand": brand } as CSSProperties) : undefined}
    >
      {icon ? (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="size-10 transition-colors duration-300 group-hover/tile:text-(--brand,var(--fg)) sm:size-12"
        >
          <path d={icon.path} />
        </svg>
      ) : (
        // No official mark: the name is set as the logo.
        <span aria-hidden="true" className="font-display text-2xl leading-none font-[660] [font-variation-settings:'wdth'_110] sm:text-3xl">
          {item.name}
        </span>
      )}
      {icon ? <span className="label text-muted">{item.name}</span> : <span className="sr-only">{item.name}</span>}
    </li>
  );
}

/** One row of the carousel: two identical copies, shifted by half for a seamless loop. */
function Row({ items, reverse, label }: { items: StackItem[]; reverse?: boolean; label?: string }) {
  return (
    <div
      className="marquee overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]"
      aria-hidden={label ? undefined : true}
      data-row={reverse ? "2" : "1"}
    >
      <div className="marquee-track flex w-max" data-reverse={reverse ? "" : undefined}>
        <ul aria-label={label} className="flex gap-4 pr-4">
          {items.map((item) => (
            <Tile key={item.name} item={item} />
          ))}
        </ul>
        <ul aria-hidden="true" data-copy className="flex gap-4 pr-4">
          {items.map((item) => (
            <Tile key={item.name} item={item} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Stack({ stack, skillGroups }: { stack: StackItem[]; skillGroups: SkillGroup[] }) {
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

      <div data-part="Stack · carousel" className="mt-12 space-y-4 lg:mt-16">
        <Row items={stack} label="Technologies I use" />
        <Row items={shifted} reverse />
      </div>

      {/* The same toolkit, grouped: one card per area, skills as chips. */}
      <div className="mt-16 px-4 sm:px-8 lg:mt-24 lg:px-12">
        <h3 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] leading-none font-[600] tracking-[-0.02em] [font-variation-settings:'wdth'_108]">
          Grouped by what it&apos;s for
        </h3>
        <ul data-part="Spec sheet · cards" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {skillGroups.map((group, i) => (
            <li
              key={group.title}
              className="group flex flex-col rounded-3xl border border-line bg-[color-mix(in_srgb,var(--fg)_4%,var(--bg))] p-6 transition-[translate,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--fg)_30%,transparent)] hover:shadow-[0_24px_50px_-30px_rgb(0_0_0/0.45)]"
            >
              <div className="flex items-baseline justify-between">
                <span className="label text-muted tabular-nums">( {String(i + 1).padStart(2, "0")} )</span>
                <span className="label text-muted tabular-nums">{group.skills.length} skills</span>
              </div>
              <h4 className="mt-6 font-display text-2xl leading-tight font-[600] [font-variation-settings:'wdth'_104]">{group.title}</h4>
              <ul className="mt-5 flex flex-wrap gap-2">
                {group.skills.map((skill) => {
                  const icon = ICONS[SKILL_ICON[skill] ?? ""];
                  return (
                    <li key={skill} className="flex items-center gap-1.5 rounded-full border border-line bg-bg px-3 py-1.5 text-sm">
                      {icon && (
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-3.5 text-muted">
                          <path d={icon.path} />
                        </svg>
                      )}
                      {skill}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
