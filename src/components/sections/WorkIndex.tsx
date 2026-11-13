import { TO_CONFIRM, type Project } from "@/data/content";
import Pending from "@/components/site/Pending";
import ProjectVisual from "@/components/site/ProjectVisual";

export const projectHref = (project: Project) =>
  project.featured ? `/work/${project.slug}` : (project.liveUrl ?? project.githubUrl ?? "#");

const pad = (i: number) => String(i + 1).padStart(2, "0");

function Stack({ technologies }: { technologies: string[] }) {
  return (
    <ul className="label flex flex-wrap gap-2">
      {technologies.map((t) => (
        <li key={t}>
          {t === TO_CONFIRM ? <Pending>Stack to confirm</Pending> : <span className="inline-block rounded-full border border-line px-2.5 py-1">{t}</span>}
        </li>
      ))}
    </ul>
  );
}

/**
 * Every project as its own page in a stack. On large screens each row pins
 * one header-height below the previous one, so earlier projects fold into a
 * pile of titles while the current one opens beneath them. Each row is
 * self-contained: number, title, summary, stack, links and screenshot.
 */
export default function WorkIndex({ projects }: { projects: Project[] }) {
  return (
    <ol data-part="WorkIndex · stack" className="[--work-row:5.75rem]" style={{ ["--n" as string]: projects.length }}>
      {projects.map((project, i) => {
        const external = !project.featured;
        const href = projectHref(project);
        const linkProps = external ? { target: "_blank", rel: "noreferrer" } : {};
        return (
          <li
            key={project.slug}
            style={{ ["--i" as string]: i }}
            className="group border-t border-line bg-bg pb-16 lg:sticky lg:top-[calc(var(--i)*var(--work-row)+1.5rem)] lg:h-[calc(100svh-1.5rem-var(--i)*var(--work-row))] lg:overflow-hidden lg:pb-0"
          >
            {/* Header row: what stays visible once the next project covers this one. */}
            <div className="grid items-center gap-x-12 py-5 lg:h-(--work-row) lg:grid-cols-12 lg:py-0">
              <p aria-hidden="true" className="font-display text-[clamp(2.25rem,3.4vw,3.25rem)] leading-none font-[460] tracking-[-0.02em] tabular-nums lg:col-span-4">
                ( {pad(i)} )
              </p>
              <div className="mt-2 flex items-center justify-between gap-6 lg:col-span-8 lg:mt-0">
                <h3 className="font-display text-[clamp(2rem,3.4vw,3.25rem)] leading-[1] font-[540] tracking-[-0.02em] [font-variation-settings:'wdth'_100] lg:truncate">
                  <a href={href} {...linkProps} className="underline-offset-[6px] hover:underline">
                    {project.title}
                  </a>
                </h3>
                <span aria-hidden="true" className="label shrink-0 text-muted transition-colors group-hover:text-signal lg:mr-[4%]">
                  {external ? "Side project ↗" : "Case study →"}
                </span>
              </div>
            </div>

            {/* The project itself. */}
            <div className="grid gap-8 pt-4 lg:grid-cols-12 lg:gap-12">
              <div className="flex flex-col lg:col-span-4 lg:col-start-1">
                <p className="max-w-[40ch] text-lg leading-relaxed text-pretty text-muted">{project.summary}</p>
                <div className="mt-6">
                  <Stack technologies={project.technologies} />
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                  {project.featured ? (
                    <a href={href} className="inline-flex min-h-11 items-center gap-3 rounded-full bg-fg px-6 text-bg transition-transform duration-200 hover:-translate-y-0.5">
                      Read case study <span aria-hidden="true">→</span>
                      <span className="sr-only"> for {project.title}</span>
                    </a>
                  ) : (
                    project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-3 rounded-full bg-fg px-6 text-bg transition-transform duration-200 hover:-translate-y-0.5">
                        View code <span aria-hidden="true">↗</span>
                      </a>
                    )
                  )}
                  {project.liveUrl && (
                    <a href={project.liveUrl} target="_blank" rel="noreferrer" className="label underline-offset-4 hover:underline">
                      Live site ↗
                    </a>
                  )}
                </div>
              </div>

              <a
                href={href}
                {...linkProps}
                tabIndex={-1}
                aria-hidden="true"
                className="relative block aspect-[16/10] overflow-hidden rounded-2xl border border-line lg:col-span-8 lg:aspect-auto lg:h-[calc(100svh-1.5rem-var(--n)*var(--work-row)-3rem)] [&_img]:transition-transform [&_img]:duration-700 [&_img]:ease-(--ease-settle) group-hover:[&_img]:scale-[1.03]"
              >
                <ProjectVisual project={project} sizes="(min-width: 1024px) 62vw, 100vw" />
              </a>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
