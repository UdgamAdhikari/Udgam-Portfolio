import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteInquiry, RetryNotification, StatusButtons } from "@/components/admin/InquiryControls";
import { DateTime, PageHeader, Panel, Pill } from "@/components/admin/ui";
import { TYPE_LABELS } from "@/lib/contact-schema";
import { getInquiry, setInquiryStatus } from "@/server/admin/inquiries";
import { requireAdminPage } from "@/server/auth/guard";
import { db } from "@/server/db/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inquiry" };

const DETAIL_LABELS: Record<string, string> = {
  role: "Role",
  employment: "Employment",
  budget: "Budget",
  timeline: "Timeline",
  collabKind: "Kind",
  link: "Link",
};

export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  let inquiry = await getInquiry(db(), id);
  if (!inquiry) notFound();

  // Opening a new inquiry counts as reading it.
  if (inquiry.status === "new") {
    await setInquiryStatus(db(), inquiry.id, "read");
    inquiry = { ...inquiry, status: "read" };
  }

  const mailto = `mailto:${encodeURIComponent(inquiry.email)}?subject=${encodeURIComponent(`Re: ${inquiry.subject}`)}`;
  const details = Object.entries(inquiry.details).filter(([, v]) => v);

  return (
    <>
      <Link href="/admin/inquiries" className="label mb-4 inline-flex min-h-11 items-center text-muted hover:text-fg">
        ← All inquiries
      </Link>
      <PageHeader title={inquiry.subject} eyebrow={TYPE_LABELS[inquiry.type]}>
        <Pill tone={inquiry.status}>{inquiry.status}</Pill>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Panel title="Message">
            {/* Rendered as text: visitor input is never interpreted as HTML. */}
            <p className="text-lg leading-relaxed break-words whitespace-pre-wrap">{inquiry.message}</p>
          </Panel>

          <Panel title="Reply">
            <a
              href={mailto}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-fg px-6 text-sm text-bg hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              Reply by email ↗
            </a>
            <p className="mt-3 max-w-[60ch] text-sm text-muted">
              This opens your own mail app; the dashboard doesn&apos;t send replies. After you&apos;ve actually replied, mark the
              inquiry as replied below — that status is set by hand and only records what you did.
            </p>
          </Panel>

          <Panel title="Status">
            <StatusButtons id={inquiry.id} status={inquiry.status} />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="From">
            <dl className="space-y-3">
              <div>
                <dt className="label text-muted">Name</dt>
                <dd>{inquiry.name}</dd>
              </div>
              <div>
                <dt className="label text-muted">Email</dt>
                <dd className="break-all">{inquiry.email}</dd>
              </div>
              {inquiry.company && (
                <div>
                  <dt className="label text-muted">Company</dt>
                  <dd>{inquiry.company}</dd>
                </div>
              )}
              {details.map(([key, value]) => (
                <div key={key}>
                  <dt className="label text-muted">{DETAIL_LABELS[key] ?? key}</dt>
                  <dd className="break-words">{value}</dd>
                </div>
              ))}
              <div>
                <dt className="label text-muted">Received</dt>
                <dd>
                  <DateTime value={inquiry.createdAt} />
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Notification email">
            <p className="flex items-center gap-2">
              <Pill tone={inquiry.notification}>{inquiry.notification}</Pill>
              {inquiry.notifiedAt && (
                <span className="text-sm text-muted">
                  <DateTime value={inquiry.notifiedAt} />
                </span>
              )}
            </p>
            <p className="mt-2 text-sm text-muted">
              Attempts: {inquiry.notificationAttempts}. This is the email to you about the inquiry, not a reply to the visitor.
            </p>
            {inquiry.notificationError && <p className="mt-2 text-sm break-words text-signal">{inquiry.notificationError}</p>}
            {inquiry.notification !== "sent" && (
              <div className="mt-4">
                <RetryNotification id={inquiry.id} />
              </div>
            )}
          </Panel>

          <Panel title="Delete">
            <p className="mb-3 text-sm text-muted">Removes the message and the visitor&apos;s details permanently.</p>
            <DeleteInquiry id={inquiry.id} />
          </Panel>
        </div>
      </div>
    </>
  );
}
