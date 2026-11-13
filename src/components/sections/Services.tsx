import { services } from "@/data/content";
import { STACK_ICONS } from "@/lib/stack-icons";

const pad = (i: number) => String(i + 1).padStart(2, "0");

// One small mark per service, drawn from the parts on the bench.
const GLYPHS = [
  // card
  <svg key="card" viewBox="0 0 32 32">
    <rect x="5" y="4" width="22" height="24" rx="3" fill="currentColor" />
    <rect x="9" y="8" width="14" height="7" rx="1" fill="var(--bg)" opacity="0.5" />
    <rect x="9" y="19" width="12" height="2" rx="1" fill="var(--bg)" opacity="0.5" />
    <rect x="9" y="23" width="8" height="2" rx="1" fill="var(--bg)" opacity="0.5" />
  </svg>,
  // toggle
  <svg key="toggle" viewBox="0 0 32 32">
    <rect x="2" y="9" width="28" height="14" rx="7" fill="currentColor" />
    <circle cx="23" cy="16" r="5" fill="var(--bg)" opacity="0.6" />
  </svg>,
  // radio / data
  <svg key="radio" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="12" fill="currentColor" />
    <circle cx="16" cy="16" r="4.5" fill="var(--bg)" opacity="0.6" />
  </svg>,
  // slider
  <svg key="slider" viewBox="0 0 32 32">
    <rect x="2" y="14" width="28" height="4" rx="2" fill="currentColor" opacity="0.5" />
    <rect x="2" y="14" width="18" height="4" rx="2" fill="currentColor" />
    <circle cx="20" cy="16" r="6" fill="currentColor" />
  </svg>,
  // checkbox
  <svg key="check" viewBox="0 0 32 32">
    <rect x="4" y="4" width="24" height="24" rx="6" fill="currentColor" />
    <path d="M10 16.5l4 4 8-9" fill="none" stroke="var(--bg)" strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
];

/**
 * What I do, as a ledger of full-width rows: a large index on the left, and
 * on the right the title, a short paragraph and a numbered list of what that
 * work covers. Printed in the other ink, like the Work band.
 */
export default function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="inverse [--service-row:5.75rem] px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="grid items-end gap-6 lg:grid-cols-12 lg:gap-12">
        <h2
          id="services-title"
          className="font-display text-[clamp(2.75rem,7vw,7rem)] leading-[0.9] font-[640] tracking-[-0.025em] [font-variation-settings:'wdth'_112] lg:col-span-7"
        >
          {services.title}
          <span className="ml-[0.2em] inline-block align-top text-[0.32em] font-[400] whitespace-nowrap text-muted tabular-nums">
            ( {String(services.items.length).padStart(2, "0")} )
          </span>
        </h2>
        <p className="max-w-[42ch] text-lg leading-snug text-pretty text-muted lg:col-span-5">{services.lede}</p>
      </div>

      <ol className="mt-16 lg:mt-24" style={{ ["--n" as string]: services.items.length }}>
        {services.items.map((service, i) => (
          <li
            key={service.title}
            data-part="Services · page"
            // Each row pins one header-height below the last, so earlier
            // services fold into a stack of titles while the current one opens.
            style={{ ["--i" as string]: i }}
            className="group grid gap-x-12 border-t border-line bg-bg lg:sticky lg:top-[calc(var(--i)*var(--service-row)+1.5rem)] lg:h-[calc(100svh-1.5rem-var(--i)*var(--service-row))] lg:overflow-hidden lg:grid-cols-12 lg:content-start"
          >
            <p
              aria-hidden="true"
              className="flex items-center pt-6 font-display text-[clamp(2.5rem,3.6vw,3.5rem)] leading-none font-[460] tracking-[-0.02em] tabular-nums lg:col-span-4 lg:h-(--service-row) lg:pt-0"
            >
              ( {pad(i)} )
            </p>

            <div className="pb-16 lg:col-span-8 lg:pb-0">
              <div className="flex items-center justify-between gap-6 pt-3 lg:h-(--service-row) lg:pt-0">
                <h3 className="font-display text-[clamp(2rem,3.6vw,3.5rem)] leading-[1] font-[540] tracking-[-0.02em] text-balance [font-variation-settings:'wdth'_100] lg:truncate">
                  {service.title}
                </h3>
                <span
                  aria-hidden="true"
                  className="size-9 shrink-0 text-muted transition-[color,rotate] duration-700 ease-(--ease-settle) group-hover:rotate-[20deg] group-hover:text-signal lg:mr-[10%] lg:size-10"
                >
                  {GLYPHS[i % GLYPHS.length]}
                </span>
              </div>

              <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-pretty text-muted">{service.summary}</p>

              <ol className="mt-8 max-w-4xl">
                {service.points.map((point, j) => (
                  <li
                    key={point}
                    className="grid grid-cols-[2.5rem_1fr] items-baseline border-b border-line py-3.5 last:border-b-0 sm:grid-cols-[3rem_1fr]"
                  >
                    <span className="text-lg text-muted tabular-nums">{pad(j)}</span>
                    <span className="text-lg leading-snug font-medium sm:text-xl">{point}</span>
                  </li>
                ))}
              </ol>

              <ul aria-label={`Tools for ${service.title}`} className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                {service.tools.map((slug) => {
                  const icon = STACK_ICONS[slug];
                  if (!icon) return null;
                  return (
                    <li key={slug} className="label flex items-center gap-2 text-muted">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-3.5">
                        <path d={icon.path} />
                      </svg>
                      {icon.title}
                    </li>
                  );
                })}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
