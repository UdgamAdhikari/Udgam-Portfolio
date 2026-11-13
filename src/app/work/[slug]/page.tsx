import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TO_CONFIRM } from "@/data/content";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import Pending from "@/components/site/Pending";
import FittedHeadline from "@/components/hero/FittedHeadline";
import ProjectVisual from "@/components/site/ProjectVisual";
import Markdown from "@/components/content/Markdown";
import { getProjects } from "@/server/content/public";
import { getCaseStudy, getSite } from "@/server/content/site";

// Published case studies are prerendered; ones published later from the
// dashboard render on first request and are cached from then on.
export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.filter((p) => p.featured).map(({ slug }) => ({ slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const [project, site] = await Promise.all([getCaseStudy(slug), getSite()]);
  if (!project) return {};
  const name = site.profile.name;
  return {
    title: `${project.title} — ${name}`,
    description: project.summary,
    alternates: { canonical: `/work/${slug}` },
    openGraph: {
      type: "article",
      url: `/work/${slug}`,
      title: `${project.title} — case study by ${name}`,
      description: project.summary,
      images: project.image ? [{ url: project.image.src }] : undefined,
    },
  };
}

export default async function CaseStudy({ params }: Params) {
  const { slug } = await params;
  const [project, site] = await Promise.all([getCaseStudy(slug), getSite()]);
  if (!project) notFound();

  const caseStudies = site.projects.filter((p) => p.featured);
  const index = Math.max(0, caseStudies.findIndex((p) => p.slug === slug));
  const next = caseStudies[(index + 1) % caseStudies.length] ?? project;

  return (
    <>
      <Header home={false} profile={site.profile} />
      <main id="main" className="px-4 pt-6 pb-16 sm:px-8 lg:px-12 lg:pt-10">
        <Link href="/#work" className="label inline-flex min-h-11 items-center text-muted hover:text-fg">
          ← All work
        </Link>
        <p className="label mt-6 mb-3 text-muted">Case study · {String(index + 1).padStart(2, "0")}</p>
        <FittedHeadline id="case-title" lines={[project.title]} />

        <dl className="mt-10 grid gap-x-12 gap-y-4 border-t border-line pt-5 sm:grid-cols-3">
          <div>
            <dt className="label text-muted">Stack</dt>
            <dd className="mt-1 text-lg leading-snug">
              {project.technologies.map((t, i) => (
                <span key={t}>
                  {i > 0 && " · "}
                  {t === TO_CONFIRM ? <Pending>To confirm</Pending> : t}
                </span>
              ))}
            </dd>
          </div>
          <div>
            <dt className="label text-muted">Links</dt>
            <dd className="label mt-2 flex flex-wrap gap-x-5 gap-y-2">
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                  Live site ↗
                </a>
              )}
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                  Code ↗
                </a>
              )}
            </dd>
          </div>
          <div>
            <dt className="label text-muted">Summary</dt>
            <dd className="mt-1 text-lg leading-snug text-pretty">{project.summary}</dd>
          </div>
        </dl>

        <figure className="mt-12 aspect-[16/9] overflow-hidden rounded-2xl border border-line">
          <ProjectVisual project={project} sizes="100vw" priority logoClassName="w-[clamp(3.5rem,12%,8rem)]" />
        </figure>

        <article data-part="Case study · Markdown" className="mt-16 grid lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7 lg:col-start-4">
            <Markdown>{project.body}</Markdown>
          </div>
        </article>

        {project.gallery.length > 0 && (
          <section aria-label="Screenshots" className="mt-16 grid gap-6 sm:grid-cols-2">
            {project.gallery.map((shot) => (
              <figure key={shot.src} className="overflow-hidden rounded-2xl border border-line">
                <Image src={shot.src} width={shot.width} height={shot.height} alt={shot.alt ?? ""} sizes="(min-width: 640px) 50vw, 100vw" className="h-auto w-full" />
                {shot.alt && <figcaption className="label border-t border-line px-4 py-3 text-muted">{shot.alt}</figcaption>}
              </figure>
            ))}
          </section>
        )}

        {next.slug !== project.slug && (
        <a
          href={`/work/${next.slug}`}
          className="group mt-24 block border-t border-line pt-6"
        >
          <span className="label text-muted">Next case study →</span>
          <span className="mt-3 block font-display text-[clamp(2rem,6vw,5.5rem)] leading-[0.95] font-[640] [font-variation-settings:'wdth'_100] transition-[font-variation-settings] duration-500 group-hover:[font-variation-settings:'wdth'_120]">
            {next.title}
          </span>
        </a>
        )}
      </main>
      <Footer home={false} profile={site.profile} projects={site.projects} />
    </>
  );
}
