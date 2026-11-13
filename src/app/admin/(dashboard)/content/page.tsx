import ContentEditors from "@/components/admin/ContentEditors";
import { CONTENT_SECTIONS } from "@/components/admin/constants";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/server/auth/guard";
import { listExperience, readSettings } from "@/server/content/repo";
import { db } from "@/server/db/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content" };

export default async function ContentPage() {
  await requireAdminPage();
  const [settings, experience] = await Promise.all([readSettings(db()), listExperience(db())]);

  return (
    <>
      <PageHeader title="Content" eyebrow="Saved changes go live immediately" />
      <nav aria-label="Sections on this page" className="z-10 -mx-4 mb-8 overflow-x-auto border-b border-line bg-bg px-4 py-2 lg:sticky lg:top-0">
        <ul className="flex gap-1">
          {CONTENT_SECTIONS.map(([id, label]) => (
            <li key={id} className="shrink-0">
              <a href={`#${id}`} className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-muted hover:bg-line hover:text-fg">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <ContentEditors
        settings={settings}
        experience={experience.map(({ id, period, title, place, kind, points }) => ({ id, period, title, place, kind, points }))}
      />
    </>
  );
}
