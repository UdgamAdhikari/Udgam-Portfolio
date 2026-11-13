import Image from "next/image";
import type { Settings } from "@/lib/content-schema";
import type { SiteProfile } from "@/server/content/site";
import PartsStage from "@/components/three/PartsStage";
import BookButton from "@/components/booking/BookButton";
import ControlPanel from "./ControlPanel";
import FittedHeadline from "./FittedHeadline";

// The introduction: who (the name fitted to the full column, and a photo),
// what (role, one line, a short intro), where to go next (work or email) —
// and the bench of working parts beside it.
export default function Hero({ hero, profile }: { hero: Settings["hero"]; profile: SiteProfile }) {
  return (
    <section
      id="parts"
      aria-labelledby="hero-title"
      className="flex flex-col px-4 pt-4 pb-12 sm:px-8 lg:min-h-[calc(100svh-5.5rem)] lg:px-12 lg:pb-10"
    >
      <div data-part="FittedHeadline · h1">
        <FittedHeadline id="hero-title" lines={hero.name} />
      </div>

      <div className="mt-8 grid flex-1 gap-8 lg:mt-10 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col lg:col-span-4">
          <p className="label text-muted">{hero.eyebrow}</p>
          <p className="mt-5 font-display text-[clamp(2rem,3.6vw,3.5rem)] leading-[0.98] font-[620] tracking-[-0.015em] text-balance [font-variation-settings:'wdth'_108]">
            {hero.tagline}
          </p>
          <p className="mt-5 max-w-[42ch] text-lg leading-snug text-pretty text-muted sm:text-xl">{hero.intro}</p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a
              href="#work"
              className="inline-flex min-h-12 items-center gap-3 rounded-full bg-fg px-7 text-lg text-bg transition-transform duration-200 hover:-translate-y-0.5"
            >
              See selected work <span aria-hidden="true">↓</span>
            </a>
            <BookButton className="inline-flex min-h-12 items-center text-lg underline decoration-line decoration-2 underline-offset-[6px] transition-colors hover:decoration-signal">
              Get in touch
            </BookButton>
          </div>

          <div data-part="ControlPanel · HTML twins" className="mt-auto pt-10">
            <ControlPanel />
          </div>
        </div>

        {/* The person, in colour. */}
        <figure data-part="Portrait" className="max-w-sm lg:col-span-3 lg:max-w-none lg:self-start">
          <div className="group overflow-hidden rounded-2xl bg-line">
            <Image
              src={profile.photo}
              alt={`Portrait of ${profile.name}`}
              width={1200}
              height={1228}
              sizes="(min-width: 1024px) 24vw, 90vw"
              priority
              className="aspect-[4/5] h-auto w-full object-cover object-[50%_40%] transition-[scale] duration-700 ease-(--ease-settle) group-hover:scale-[1.02]"
            />
          </div>
          <figcaption className="label mt-3 flex justify-between text-muted">
            <span>{profile.name}</span>
            <span>{profile.location}</span>
          </figcaption>
        </figure>

        {/* The bench: below on small screens, beside the photo on large ones. */}
        <div
          data-part="PartsStage · bench"
          className="relative h-[62vw] max-h-[420px] min-h-[280px] lg:col-span-5 lg:h-auto lg:max-h-none lg:min-h-[440px]"
        >
          <PartsStage />
        </div>
      </div>
    </section>
  );
}
