import Link from "next/link";
import { MoveButtons, PublishToggle } from "@/components/admin/ProjectControls";
import { EmptyState, PageHeader, Pill, primaryButtonClass } from "@/components/admin/ui";
import { requireAdminPage } from "@/server/auth/guard";
import { listProjects } from "@/server/content/repo";
import { db } from "@/server/db/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  await requireAdminPage();
  const projects = await listProjects(db());

  return (
    <>
      <PageHeader title="Projects" eyebrow={`${projects.filter((p) => p.published).length} published · ${projects.length} total`}>
        <Link href="/admin/projects/new" className={primaryButtonClass}>
          New project
        </Link>
      </PageHeader>
      <p className="-mt-4 mb-6 text-sm text-muted">The order here is the order on the site. Featured projects get a case-study page.</p>

      {projects.length === 0 ? (
        <EmptyState title="No projects yet.">Create one, then publish it when it&apos;s ready.</EmptyState>
      ) : (
        <ol className="divide-y divide-line rounded-2xl border border-line">
          {projects.map((project, i) => (
            <li key={project.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <span className="label w-8 text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/projects/${project.id}`} className="text-lg underline-offset-4 hover:text-signal hover:underline">
                  {project.title}
                </Link>
                <span className="mt-1 flex flex-wrap gap-1">
                  <Pill tone={project.published ? "published" : "draft"}>{project.published ? "Published" : "Draft"}</Pill>
                  {project.featured && <Pill tone="featured">Featured</Pill>}
                  <span className="text-sm text-muted">/{project.slug}</span>
                </span>
              </div>
              <MoveButtons id={project.id} title={project.title} first={i === 0} last={i === projects.length - 1} />
              <PublishToggle id={project.id} published={project.published} title={project.title} />
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
