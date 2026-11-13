import Link from "next/link";
import ProjectEditor from "@/components/admin/ProjectEditor";
import { EMPTY_PROJECT } from "@/components/admin/constants";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/server/auth/guard";

export const dynamic = "force-dynamic";
export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireAdminPage();
  return (
    <>
      <Link href="/admin/projects" className="label mb-4 inline-flex min-h-11 items-center text-muted hover:text-fg">
        ← All projects
      </Link>
      <PageHeader title="New project" eyebrow="Draft — not public until you publish it" />
      <ProjectEditor id={null} initial={EMPTY_PROJECT} />
    </>
  );
}
