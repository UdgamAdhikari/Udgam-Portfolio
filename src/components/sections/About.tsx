import type { Settings } from "@/lib/content-schema";

// Text only: the photo lives in the hero, so this section is the voice.
export default function About({ about }: { about: Settings["about"] }) {
  return (
    <section id="about" aria-labelledby="about-title" className="px-4 py-16 sm:px-8 lg:px-12 lg:py-24">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <h2
          id="about-title"
          className="font-display text-[clamp(2.25rem,5vw,5rem)] leading-[0.94] font-[640] tracking-[-0.02em] text-balance [font-variation-settings:'wdth'_108] lg:col-span-5"
        >
          {about.title}
        </h2>
        <div className="space-y-5 text-lg leading-relaxed text-pretty sm:text-xl lg:col-span-6 lg:col-start-7">
          {about.paragraphs.map((paragraph, i) => (
            <p key={paragraph} className={i === 0 ? "" : "text-muted"}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
