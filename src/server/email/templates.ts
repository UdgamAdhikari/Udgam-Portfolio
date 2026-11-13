import "server-only";
import type { Inquiry } from "@/server/db/schema";
import { TYPE_LABELS } from "@/lib/contact-schema";

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const DETAIL_LABELS: Record<string, string> = {
  role: "Role",
  employment: "Employment",
  budget: "Budget",
  timeline: "Timeline",
  collabKind: "Kind",
  link: "Link",
};

/** The owner's notification. Every visitor-supplied value is escaped. */
export function ownerNotification(inquiry: Inquiry, adminUrl: string) {
  const rows: [string, string][] = [
    ["Type", TYPE_LABELS[inquiry.type]],
    ["Name", inquiry.name],
    ["Email", inquiry.email],
    ...(inquiry.company ? ([["Company", inquiry.company]] as [string, string][]) : []),
    ...Object.entries(inquiry.details)
      .filter(([, v]) => v)
      .map(([k, v]) => [DETAIL_LABELS[k] ?? k, v] as [string, string]),
  ];
  const text = [
    `New inquiry: ${inquiry.subject}`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    inquiry.message,
    "",
    `Open in the dashboard: ${adminUrl}`,
    "Reply to this email to answer them directly.",
  ].join("\n");

  const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#161615;max-width:620px">
<p style="font:12px monospace;text-transform:uppercase;color:#6b6a66">New inquiry</p>
<h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(inquiry.subject)}</h1>
<table style="border-collapse:collapse;font-size:14px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#6b6a66">${escapeHtml(k)}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`,
    )
    .join("")}</table>
<div style="margin:20px 0;padding:16px;border-left:3px solid #e2401c;white-space:pre-wrap;font-size:15px;line-height:1.5">${escapeHtml(inquiry.message)}</div>
<p style="font-size:13px"><a href="${escapeHtml(adminUrl)}">Open in the dashboard</a> · Reply to this email to answer directly.</p>
</body></html>`;

  return { subject: `[Portfolio] ${inquiry.subject}`, text, html };
}

/**
 * The optional visitor confirmation. It deliberately contains no text the
 * visitor typed (not even their name), so the form can't be used to make
 * this address send someone else arbitrary content.
 */
export function visitorConfirmation(ownerName: string, replyWithin: string) {
  const text = `Thanks for getting in touch — your message reached ${ownerName}.\n\nI read every message myself and usually reply ${replyWithin}. If you didn't send a message through ${ownerName}'s portfolio, you can ignore this email.`;
  const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#161615;max-width:560px">
<p>Thanks for getting in touch — your message reached ${escapeHtml(ownerName)}.</p>
<p>I read every message myself and usually reply ${escapeHtml(replyWithin)}.</p>
<p style="color:#6b6a66;font-size:13px">If you didn't send a message through ${escapeHtml(ownerName)}'s portfolio, you can ignore this email.</p>
</body></html>`;
  return { subject: "Your message was received", text, html };
}
