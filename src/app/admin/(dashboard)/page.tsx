import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { DateTime, EmptyState, PageHeader, Panel, Pill, Stat } from "@/components/admin/ui";
import { TYPE_LABELS } from "@/lib/contact-schema";
import { inquiryCounts, listInquiries } from "@/server/admin/inquiries";
import { analyticsSummary } from "@/server/analytics";
import { requireAdminPage } from "@/server/auth/guard";
import { db } from "@/server/db/client";
import { inquiries } from "@/server/db/schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "Overview" };

export default async function Overview() {
  await requireAdminPage();
  const [counts, latest, week, failed] = await Promise.all([
    inquiryCounts(db()),
    listInquiries(db(), { status: "new", page: 1 }),
    analyticsSummary(db(), 7),
    db()
      .select({ id: inquiries.id, subject: inquiries.subject, createdAt: inquiries.createdAt, error: inquiries.notificationError })
      .from(inquiries)
      .where(eq(inquiries.notification, "failed"))
      .orderBy(desc(inquiries.createdAt))
      .limit(10),
  ]);

  return (
    <>
      <PageHeader title="Overview" eyebrow="Dashboard" />

      {failed.length > 0 && (
        <div role="alert" className="mb-8 rounded-2xl border border-signal p-5">
          <p className="font-medium text-signal">
            {failed.length} inquir{failed.length === 1 ? "y" : "ies"} saved, but the notification email failed
          </p>
          <p className="mt-1 text-sm text-muted">The messages are safe in the database. Open one to retry the email.</p>
          <ul className="mt-3 space-y-1">
            {failed.map((f) => (
              <li key={f.id}>
                <Link href={`/admin/inquiries/${f.id}`} className="underline underline-offset-4 hover:text-signal">
                  {f.subject}
                </Link>{" "}
                <span className="text-sm text-muted">
                  · <DateTime value={f.createdAt} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="New" value={counts.new} />
        <Stat label="Read" value={counts.read} />
        <Stat label="Replied" value={counts.replied} />
        <Stat label="Archived" value={counts.archived} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Panel title="Latest new inquiries" actions={<Link href="/admin/inquiries" className="label text-muted hover:text-fg">All inquiries →</Link>}>
          {latest.rows.length === 0 ? (
            <EmptyState title="Nothing new.">New messages from the contact form appear here.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {latest.rows.slice(0, 5).map((row) => (
                <li key={row.id}>
                  <Link href={`/admin/inquiries/${row.id}`} className="flex min-h-11 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 hover:text-signal">
                    <span>
                      {row.subject}
                      <span className="ml-2 text-sm text-muted">{TYPE_LABELS[row.type]}</span>
                    </span>
                    <span className="text-sm text-muted">
                      <DateTime value={row.createdAt} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Last 7 days" actions={<Link href="/admin/analytics" className="label text-muted hover:text-fg">Analytics →</Link>}>
          {week.pageviews === 0 && week.submissions === 0 ? (
            <EmptyState title="No visits recorded yet." />
          ) : (
            <dl className="grid grid-cols-3 gap-4">
              <div>
                <dt className="label text-muted">Page views</dt>
                <dd className="mt-1 font-display text-3xl tabular-nums">{week.pageviews}</dd>
              </div>
              <div>
                <dt className="label text-muted">Daily visitors</dt>
                <dd className="mt-1 font-display text-3xl tabular-nums">{week.dailyVisitors}</dd>
              </div>
              <div>
                <dt className="label text-muted">Submissions</dt>
                <dd className="mt-1 font-display text-3xl tabular-nums">{week.submissions}</dd>
              </div>
            </dl>
          )}
          <p className="mt-4 text-sm text-muted">
            <Pill tone="sent">Cookieless</Pill> Visitors are counted per day; the same person on two days counts twice.
          </p>
        </Panel>
      </div>
    </>
  );
}
