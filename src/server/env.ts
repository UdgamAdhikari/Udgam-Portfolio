import "server-only";
import { z } from "zod";

/**
 * Server configuration, validated once. Nothing in here is ever sent to the
 * browser: this module imports `server-only`, so importing it from a Client
 * Component fails the build.
 */
const boolish = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => v === "true" || v === "1");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(5),

  /** HMAC key for form tokens, IP hashing and the analytics salt. */
  APP_SECRET: z.string().min(32, "APP_SECRET must be at least 32 characters"),

  ADMIN_EMAIL: z.email().transform((v) => v.toLowerCase()),
  /** Output of `npm run admin:hash`. Never the plain password. */
  ADMIN_PASSWORD_HASH: z.string().startsWith("scrypt$", "ADMIN_PASSWORD_HASH must come from `npm run admin:hash`"),

  RESEND_API_KEY: z.string().optional(),
  CONTACT_FROM_EMAIL: z.string().default("Portfolio <onboarding@resend.dev>"),
  CONTACT_TO_EMAIL: z.email().optional(),
  CONTACT_SEND_CONFIRMATION: boolish,

  TURNSTILE_SECRET_KEY: z.string().optional(),

  STORAGE_DRIVER: z.enum(["db", "s3"]).default("db"),
  S3_ENDPOINT: z.url().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  /** Public base URL objects are served from, e.g. https://cdn.example.com */
  S3_PUBLIC_URL: z.url().optional(),

  CRON_SECRET: z.string().min(16).optional(),
  INQUIRY_RETENTION_DAYS: z.coerce.number().int().min(30).default(730),
  ANALYTICS_RETENTION_DAYS: z.coerce.number().int().min(30).default(400),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid server configuration:\n${problems}\nSee .env.example.`);
  }
  const value = parsed.data;
  if (value.STORAGE_DRIVER === "s3") {
    for (const key of ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_PUBLIC_URL"] as const) {
      if (!value[key]) throw new Error(`Invalid server configuration: ${key} is required when STORAGE_DRIVER=s3`);
    }
  }
  cached = value;
  return value;
}

/** Test hook: forget the parsed environment after changing process.env. */
export function resetEnvForTests() {
  cached = undefined;
}

export const isProduction = () => process.env.NODE_ENV === "production";
