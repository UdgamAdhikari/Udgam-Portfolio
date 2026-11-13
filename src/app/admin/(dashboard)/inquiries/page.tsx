import Link from "next/link";
import { DateTime, EmptyState, inputClass, PageHeader, Pill, buttonClass } from "@/components/admin/ui";
import { INQUIRY_TYPES, TYPE_LABELS } from "@/lib/contact-schema";
import { INQUIRY_STATUSES, inquiryFilter, listInquiries, PAGE_SIZE } from "@/server/admin/inquiries";
import { requireAdminPage } from "@/server/auth/guard";
import { db } from "@/server/db/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inquiries" };

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function InquiriesPage({ searchParams }: { searchParams: Search }) {
  await requireAdminPage();
  const raw = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
  const filter = inquiryFilter.parse({ type: one(raw.type), status: one(raw.status), q: one(raw.q), page: one(raw.page) });
  const { rows, total } = await listInquiries(db(), filter);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (filter.type) params.set("type", filter.type);
    if (filter.status) params.set("status", filter.status);
    if (filter.q) params.set("q", filter.q);
    params.set("page", String(page));
    return `/admin/inquiries?${params}`;
  };

  return (
    <>
      <PageHeader title="Inquiries" eyebrow={`${total} ${filter.status ?? "open (not archived)"}`} />

      <form method="get" role="search" className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <div>
          <label htmlFor="q" className="label text-muted">
            Search name, email or subject
          </label>
          <input id="q" name="q" type="search" defaultValue={filter.q ?? ""} maxLength={100} className={inputClass} />
        </div>
        <div>
          <label htmlFor="type" className="label text-muted">
            Type
          </label>
          <select id="type" name="type" defaultValue={filter.type ?? ""} className={inputClass}>
            <option value="">All types</option>
            {INQUIRY_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="label text-muted">
            Status
          </label>
          <select id="status" name="status" defaultValue={filter.status ?? ""} className={inputClass}>
            <option value="">Open (not archived)</option>
            {INQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0]!.toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={buttonClass}>
            Filter
          </button>
          {(filter.q || filter.type || filter.status) && (
            <Link href="/admin/inquiries" className="inline-flex min-h-11 items-center px-2 text-sm text-muted hover:text-fg">
              Reset
            </Link>
          )}
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No inquiries match.">
          {filter.q || filter.type || filter.status ? "Try a different filter." : "Messages from the contact form will appear here."}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[640px] text-left">
            <caption className="sr-only">Inquiries, newest first</caption>
            <thead className="label text-muted">
              <tr className="border-b border-line">
                <th scope="col" className="px-4 py-3 font-normal">Received</th>
                <th scope="col" className="px-4 py-3 font-normal">From</th>
                <th scope="col" className="px-4 py-3 font-normal">Subject</th>
                <th scope="col" className="px-4 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row.id} className={row.status === "new" ? "font-medium" : undefined}>
                  <td className="px-4 py-3 align-top text-sm whitespace-nowrap text-muted">
                    <DateTime value={row.createdAt} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="block">{row.name}</span>
                    <span className="block text-sm text-muted">{row.email}</span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/admin/inquiries/${row.id}`} className="underline-offset-4 hover:text-signal hover:underline">
                      {row.subject}
                    </Link>
                    <span className="block text-sm text-muted">{TYPE_LABELS[row.type]}</span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="flex flex-wrap gap-1">
                      <Pill tone={row.status}>{row.status}</Pill>
                      {row.notification === "failed" && <Pill tone="failed">email failed</Pill>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
          {filter.page > 1 ? (
            <Link href={pageHref(filter.page - 1)} className={buttonClass}>
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="label text-muted">
            Page {filter.page} of {pages}
          </span>
          {filter.page < pages ? (
            <Link href={pageHref(filter.page + 1)} className={buttonClass}>
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
