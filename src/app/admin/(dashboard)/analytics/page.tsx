import Link from "next/link";
import TrafficChart from "@/components/admin/TrafficChart";
import { EmptyState, PageHeader, Panel, Stat } from "@/components/admin/ui";
import { analyticsSummary } from "@/server/analytics";
import { requireAdminPage } from "@/server/auth/guard";
import { listProjects } from "@/server/content/repo";
import { db } from "@/server/db/client";
import { env } from "@/server/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

const RANGES = [7, 30, 90] as const;

function Ranked({ rows, empty }: { rows: { label: string; value: number; note?: string }[]; empty: string }) {
  if (rows.length === 0) return <p className="text-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ol className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="relative overflow-hidden rounded-lg px-3 py-2">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-line" style={{ width: `${(r.value / max) * 100}%` }} />
          <span className="relative flex justify-between gap-4">
            <span className="min-w-0 truncate">
              {r.label}
              {r.note && <span className="ml-2 text-sm text-muted">{r.note}</span>}
            </span>
            <span className="tabular-nums">{r.value}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdminPage();
  const requested = Number((await searchParams).days);
  const days = RANGES.includes(requested as (typeof RANGES)[number]) ? requested : 30;
  const [summary, projects] = await Promise.all([analyticsSummary(db(), days), listProjects(db())]);
  const titles = new Map(projects.map((p) => [p.slug, p.title]));
  const hasData = summary.pageviews > 0 || summary.submissions > 0 || summary.contactStarts > 0;

  return (
    <>
      <PageHeader title="Analytics" eyebrow={`Last ${days} days`}>
        <nav aria-label="Date range" className="flex gap-1">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/analytics?days=${r}`}
              aria-current={r === days ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm ${r === days ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}
            >
              {r} days
            </Link>
          ))}
        </nav>
      </PageHeader>

      {!hasData ? (
        <EmptyState title="No visits recorded yet.">Numbers appear here as real visitors arrive. Nothing is estimated or filled in.</EmptyState>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Page views" value={summary.pageviews} />
            <Stat label="Daily visitors" value={summary.dailyVisitors} note="Summed per day; a returning visitor counts once per day." />
            <Stat label="Contact submissions" value={summary.submissions} />
            <Stat
              label="Form starts → sent"
              value={`${summary.contactStarts} → ${summary.submissions}`}
              note={summary.contactStarts ? `${Math.round((summary.submissions / summary.contactStarts) * 100)}% completed` : "No form starts tracked"}
            />
          </div>

          <Panel title="Traffic">
            <TrafficChart series={summary.series} />
          </Panel>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Top pages">
              <Ranked rows={summary.topPages.map((p) => ({ label: p.path, value: p.views }))} empty="No page views yet." />
            </Panel>
            <Panel title="Popular projects (case-study views)">
              <Ranked
                rows={summary.topProjects.map((p) => ({ label: titles.get(p.slug) ?? p.slug, value: p.views, note: `${p.visitors} visitors` }))}
                empty="No case studies viewed yet."
              />
            </Panel>
            <Panel title="Referrers">
              <Ranked rows={summary.referrers.map((r) => ({ label: r.host, value: r.views }))} empty="No external referrers yet." />
            </Panel>
            <Panel title="Devices">
              <Ranked rows={summary.devices.map((d) => ({ label: d.device, value: d.views }))} empty="No data yet." />
            </Panel>
            <Panel title="Interactions">
              <Ranked
                rows={summary.interactions.map((i) => ({
                  label: i.type === "cv_download" ? "CV opened" : `Outbound: ${i.target}`,
                  value: i.total,
                }))}
                empty="No outbound clicks or CV opens yet."
              />
            </Panel>
          </div>
        </div>
      )}

      <p className="mt-10 max-w-[70ch] text-sm text-muted">
        Privacy: first-party and cookieless. No IP addresses, cookies or full referrer URLs are stored; visitors are counted with a hash that
        rotates daily, so they can&apos;t be followed across days. Browsers sending Global Privacy Control or Do Not Track are not recorded
        at all. Events are deleted after {env().ANALYTICS_RETENTION_DAYS} days.
      </p>
    </>
  );
}
