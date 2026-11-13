import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
  dataType: () => "bytea",
  fromDriver: (value) => (Buffer.isBuffer(value) ? value : Buffer.from(value)),
});

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

// ── Inquiries ───────────────────────────────────────────────────────────────

export const inquiryType = pgEnum("inquiry_type", ["hiring", "project", "collaboration", "other"]);
export const inquiryStatus = pgEnum("inquiry_status", ["new", "read", "replied", "archived"]);
/** Whether the owner was notified by email. Separate from `status`: a sent
 * notification is not a reply, and a reply is only ever marked by hand. */
export const notificationStatus = pgEnum("notification_status", ["pending", "sent", "failed"]);

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Client-generated per form session; makes retries and double clicks safe. */
    idempotencyKey: text("idempotency_key").notNull(),
    /** sha256 of the normalised payload: detects the same message sent twice. */
    contentHash: text("content_hash").notNull(),
    type: inquiryType("type").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    company: text("company"),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    /** Answers to the questions specific to the inquiry type. */
    details: jsonb("details").$type<Record<string, string>>().notNull().default({}),
    status: inquiryStatus("status").notNull().default("new"),
    notification: notificationStatus("notification").notNull().default("pending"),
    notificationError: text("notification_error"),
    notificationAttempts: integer("notification_attempts").notNull().default(0),
    notifiedAt: ts("notified_at"),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("inquiries_idempotency_key").on(t.idempotencyKey),
    index("inquiries_content_hash").on(t.contentHash, t.createdAt),
    index("inquiries_status_created").on(t.status, t.createdAt),
  ],
);

// ── Content ────────────────────────────────────────────────────────────────

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind", { enum: ["image", "document"] }).notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    width: integer("width"),
    height: integer("height"),
    sha256: text("sha256").notNull(),
    originalName: text("original_name").notNull(),
    storage: text("storage", { enum: ["db", "s3"] }).notNull(),
    /** Object key for s3; null when the bytes live in `data`. */
    objectKey: text("object_key"),
    data: bytea("data"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("assets_sha256").on(t.sha256)],
);

export type ImageRef = { src: string; width: number; height: number; alt?: string; assetId?: string };

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    /** Case-study body as Markdown. Raw HTML is never rendered. */
    body: text("body").notNull().default(""),
    technologies: jsonb("technologies").$type<string[]>().notNull().default([]),
    githubUrl: text("github_url"),
    liveUrl: text("live_url"),
    cover: jsonb("cover").$type<ImageRef | null>(),
    gallery: jsonb("gallery").$type<ImageRef[]>().notNull().default([]),
    featured: boolean("featured").notNull().default(false),
    published: boolean("published").notNull().default(false),
    position: integer("position").notNull().default(0),
    publishedAt: ts("published_at"),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("projects_slug").on(t.slug), index("projects_position").on(t.position)],
);

export const experience = pgTable("experience", {
  id: uuid("id").primaryKey().defaultRandom(),
  period: text("period").notNull(),
  title: text("title").notNull(),
  place: text("place").notNull(),
  kind: text("kind", { enum: ["Work", "Study"] }).notNull(),
  points: jsonb("points").$type<string[]>().notNull().default([]),
  position: integer("position").notNull().default(0),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

/** Singleton documents (profile, hero, about, skills, SEO …), each validated
 * by its own Zod schema in src/lib/content-schema.ts. */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

// ── Security ───────────────────────────────────────────────────────────────

export const sessions = pgTable(
  "sessions",
  {
    /** sha256 of the cookie token; the token itself is never stored. */
    id: text("id").primaryKey(),
    createdAt: ts("created_at").notNull().defaultNow(),
    lastSeenAt: ts("last_seen_at").notNull().defaultNow(),
    expiresAt: ts("expires_at").notNull(),
    userAgent: text("user_agent"),
  },
  (t) => [index("sessions_expires").on(t.expiresAt)],
);

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: ts("window_start").notNull(),
});

// ── Analytics (cookieless, no IPs stored) ─────────────────────────────────

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    type: text("type", { enum: ["pageview", "project_view", "cv_download", "outbound", "contact_start"] }).notNull(),
    path: text("path").notNull(),
    /** Referrer host only, never the full URL. */
    referrer: text("referrer"),
    target: text("target"),
    device: text("device", { enum: ["mobile", "tablet", "desktop"] }),
    /** HMAC(daily salt, ip + user agent): counts unique visitors per day and
     * cannot be linked across days or reversed to an IP. */
    visitor: text("visitor").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("analytics_day_type").on(t.day, t.type)],
);

// ── Bookings (call scheduler) ──────────────────────────────────────────────

export const bookingStatus = pgEnum("booking_status", ["confirmed", "cancelled"]);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    startsAt: ts("starts_at").notNull(),
    endsAt: ts("ends_at").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    notes: text("notes").notNull().default(""),
    status: bookingStatus("status").notNull().default("confirmed"),
    notification: notificationStatus("notification").notNull().default("pending"),
    notificationError: text("notification_error"),
    createdAt: ts("created_at").notNull().defaultNow(),
    cancelledAt: ts("cancelled_at"),
  },
  (t) => [
    // A slot can hold one confirmed booking; a cancelled one frees it again.
    uniqueIndex("bookings_confirmed_start").on(t.startsAt).where(sql`${t.status} = 'confirmed'`),
    index("bookings_starts_at").on(t.startsAt),
  ],
);

export type Booking = typeof bookings.$inferSelect;

export type Inquiry = typeof inquiries.$inferSelect;
export type ProjectRow = typeof projects.$inferSelect;
export type ExperienceRow = typeof experience.$inferSelect;
export type AssetRow = typeof assets.$inferSelect;
