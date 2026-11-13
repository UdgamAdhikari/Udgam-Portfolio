import type { Project } from "@/data/content";
import WorkIndex from "./WorkIndex";

// Printed in the other ink: the one dark band on a paper page (and the one
// light band in graphite), so the work reads as its own chapter.
export default function Work({ projects }: { projects: Project[] }) {
  return (
    <section id="work" aria-labelledby="work-title" className="inverse">
      <div className="px-4 pt-16 pb-20 sm:px-8 lg:px-12 lg:pt-24 lg:pb-28">
        <div className="mb-12 grid items-end gap-6 lg:mb-16 lg:grid-cols-12 lg:gap-12">
          <h2
            id="work-title"
            className="font-display text-[clamp(2.75rem,8vw,8.5rem)] leading-[0.88] font-[640] tracking-[-0.025em] [font-variation-settings:'wdth'_112] lg:col-span-9"
          >
            Selected work
            {/* The count sits raised beside the heading, like a figure reference. */}
            <span className="ml-[0.2em] inline-block align-top text-[0.32em] font-[400] whitespace-nowrap text-muted tabular-nums">
              ( {String(projects.length).padStart(2, "0")} )
            </span>
          </h2>
          <p className="max-w-[40ch] text-lg leading-snug text-pretty lg:col-span-3">
            Scroll through them one at a time. The first two have full case studies; the rest link to their code.
          </p>
        </div>
        <WorkIndex projects={projects} />
      </div>
    </section>
  );
}
