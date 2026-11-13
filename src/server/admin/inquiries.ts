import "server-only";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { INQUIRY_TYPES } from "@/lib/contact-schema";
import type { Db } from "@/server/db/client";
import { inquiries } from "@/server/db/schema";

export const INQUIRY_STATUSES = ["new", "read", "replied", "archived"] as const;

export const inquiryFilter = z.object({
  type: z.enum(INQUIRY_TYPES).optional().catch(undefined),
  status: z.enum(INQUIRY_STATUSES).optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).default(1).catch(1),
});

export type InquiryFilter = z.output<typeof inquiryFilter>;
export const PAGE_SIZE = 25;

/** Escape LIKE wildcards so a search for "100%" means the literal text. */
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function listInquiries(db: Db, filter: InquiryFilter) {
  const where: SQL[] = [];
  if (filter.type) where.push(eq(inquiries.type, filter.type));
  if (filter.status) where.push(eq(inquiries.status, filter.status));
  else where.push(or(eq(inquiries.status, "new"), eq(inquiries.status, "read"), eq(inquiries.status, "replied"))!);
  if (filter.q) {
    const pattern = `%${likeEscape(filter.q)}%`;
    where.push(or(ilike(inquiries.name, pattern), ilike(inquiries.email, pattern), ilike(inquiries.subject, pattern))!);
  }
  const condition = and(...where);
  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: inquiries.id,
        type: inquiries.type,
        name: inquiries.name,
        email: inquiries.email,
        company: inquiries.company,
        subject: inquiries.subject,
        status: inquiries.status,
        notification: inquiries.notification,
        createdAt: inquiries.createdAt,
      })
      .from(inquiries)
      .where(condition)
      .orderBy(desc(inquiries.createdAt))
      .limit(PAGE_SIZE)
      .offset((filter.page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(inquiries).where(condition),
  ]);
  return { rows, total: Number(total?.n ?? 0) };
}

export async function getInquiry(db: Db, id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const [row] = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
  return row ?? null;
}

export async function inquiryCounts(db: Db) {
  const rows = await db.select({ status: inquiries.status, n: count() }).from(inquiries).groupBy(inquiries.status);
  const out = { new: 0, read: 0, replied: 0, archived: 0 };
  for (const r of rows) out[r.status] = Number(r.n);
  return out;
}

export async function setInquiryStatus(db: Db, id: string, status: (typeof INQUIRY_STATUSES)[number]) {
  const [row] = await db.update(inquiries).set({ status, updatedAt: new Date() }).where(eq(inquiries.id, id)).returning({ id: inquiries.id });
  return Boolean(row);
}

export async function deleteInquiry(db: Db, id: string) {
  const rows = await db.delete(inquiries).where(eq(inquiries.id, id)).returning({ id: inquiries.id });
  return rows.length > 0;
}
