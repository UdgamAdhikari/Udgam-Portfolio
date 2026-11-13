import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectEditor from "@/components/admin/ProjectEditor";
import { DeleteProject, PublishToggle } from "@/components/admin/ProjectControls";
import { PageHeader, Panel, Pill } from "@/components/admin/ui";
import { requireAdminPage } from "@/server/auth/guard";
import { getProject } from "@/server/content/repo";
import { db } from "@/server/db/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit project" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const { created } = await searchParams;
  const project = UUID.test(id) ? await getProject(db(), id) : null;
  if (!project) notFound();

  return (
    <>
      <Link href="/admin/projects" className="label mb-4 inline-flex min-h-11 items-center text-muted hover:text-fg">
        ← All projects
      </Link>
      <PageHeader title={project.title} eyebrow={`/work/${project.slug}`}>
        <Pill tone={project.published ? "published" : "draft"}>{project.published ? "Published" : "Draft"}</Pill>
        {project.published && project.featured && (
          <a href={`/work/${project.slug}`} target="_blank" rel="noreferrer" className="label text-muted hover:text-fg">
            View live ↗
          </a>
        )}
      </PageHeader>

      {created && (
        <p role="status" className="mb-6 rounded-lg border border-line px-4 py-3 text-sm">
          Draft created. It isn&apos;t on the site until you publish it.
        </p>
      )}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <ProjectEditor
          id={project.id}
          initial={{
            title: project.title,
            slug: project.slug,
            summary: project.summary,
            body: project.body,
            technologies: project.technologies,
            githubUrl: project.githubUrl ?? "",
            liveUrl: project.liveUrl ?? "",
            featured: project.featured,
            cover: project.cover,
            gallery: project.gallery,
          }}
        />
        <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <Panel title="Visibility">
            <p className="mb-3 text-sm text-muted">
              {project.published ? "Live on the site. Saved edits appear immediately." : "Draft: visitors can't see it."}
            </p>
            <PublishToggle id={project.id} published={project.published} />
          </Panel>
          <Panel title="Delete">
            <DeleteProject id={project.id} />
          </Panel>
        </div>
      </div>
    </>
  );
}
