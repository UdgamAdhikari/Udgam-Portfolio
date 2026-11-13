import { z } from "zod";

/**
 * One schema for the contact form, used by the browser for inline errors and
 * by the server as the source of truth. Messages are written for visitors.
 */

export const INQUIRY_TYPES = ["hiring", "project", "collaboration", "other"] as const;
export type InquiryType = (typeof INQUIRY_TYPES)[number];

export const BUDGETS = ["Under $1k", "$1k – $5k", "$5k – $15k", "$15k+", "Not sure yet"] as const;
export const TIMELINES = ["As soon as possible", "Within a month", "1 – 3 months", "Flexible"] as const;
export const EMPLOYMENT = ["Full-time", "Part-time", "Contract", "Internship"] as const;
export const COLLAB_KINDS = ["Open source", "Talk or workshop", "Writing", "Something else"] as const;

// Control characters other than tab/newline have no business in a message.
const clean = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();

const text = (label: string, max: number) =>
  z.string({ error: `${label} is required.` }).transform(clean).pipe(z.string().max(max, `${label} must be ${max} characters or fewer.`));

const optionalText = (label: string, max: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? clean(v) : ""))
    .pipe(z.string().max(max, `${label} must be ${max} characters or fewer.`));

const optionalUrl = z
  .string()
  .optional()
  .transform((v) => (v ? clean(v) : ""))
  .refine((v) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+$/i.test(v), "Enter a full link starting with https://")
  .pipe(z.string().max(300, "That link is too long."));

const oneOf = <T extends readonly [string, ...string[]]>(values: T, label: string) =>
  z
    .string()
    .optional()
    .transform((v) => v ?? "")
    .refine((v) => v === "" || (values as readonly string[]).includes(v), `Choose one of the listed ${label}.`);

export const identityFields = {
  name: text("Your name", 100).pipe(z.string().min(2, "Tell me your name (at least 2 characters).")),
  email: z
    .string({ error: "Your email is required." })
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.email("That doesn't look like an email address — check for typos.").max(254, "That email is too long.")),
  company: optionalText("Company", 120),
};

export const detailFields = {
  role: optionalText("Role", 120),
  employment: oneOf(EMPLOYMENT, "options"),
  budget: oneOf(BUDGETS, "budgets"),
  timeline: oneOf(TIMELINES, "timelines"),
  collabKind: oneOf(COLLAB_KINDS, "options"),
  link: optionalUrl,
};

export const MESSAGE_MIN = 20;
export const MESSAGE_MAX = 5000;

export const messageField = text("A message", MESSAGE_MAX).pipe(
  z.string().min(MESSAGE_MIN, `Write a little more — at least ${MESSAGE_MIN} characters, so I can reply usefully.`),
);

export const contactSchema = z
  .object({
    type: z.enum(INQUIRY_TYPES, { error: "Choose what you're getting in touch about." }),
    ...identityFields,
    ...detailFields,
    message: messageField,
  })
  .superRefine((value, ctx) => {
    if (value.type === "hiring" && value.role.length < 2) {
      ctx.addIssue({ code: "custom", path: ["role"], message: "Which role are you hiring for?" });
    }
  });

export type ContactInput = z.input<typeof contactSchema>;
export type ContactData = z.output<typeof contactSchema>;

/** Fields the server needs besides the form itself. */
export const submissionEnvelope = z.object({
  idempotencyKey: z.string().regex(/^[A-Za-z0-9-]{16,64}$/, "Invalid submission key."),
  formToken: z.string().min(10).max(400),
  /** Honeypot: hidden from people, filled by naive bots. */
  website: z.string().max(200).optional().default(""),
  turnstileToken: z.string().max(4096).optional(),
});

/** Which detail questions apply to an inquiry type, in display order. */
export const DETAIL_FIELDS: Record<InquiryType, (keyof typeof detailFields)[]> = {
  hiring: ["role", "employment", "link"],
  project: ["budget", "timeline", "link"],
  collaboration: ["collabKind", "link"],
  other: [],
};

export const TYPE_LABELS: Record<InquiryType, string> = {
  hiring: "A role on your team",
  project: "A project to build",
  collaboration: "A collaboration",
  other: "Something else",
};

export function subjectFor(data: Pick<ContactData, "type" | "name" | "company" | "role">): string {
  const who = data.company || data.name;
  switch (data.type) {
    case "hiring":
      return `Hiring: ${data.role || "a role"} at ${who}`;
    case "project":
      return `Project inquiry from ${who}`;
    case "collaboration":
      return `Collaboration idea from ${who}`;
    default:
      return `Message from ${who}`;
  }
}

/** Flatten Zod issues to { field: firstMessage } for inline errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
