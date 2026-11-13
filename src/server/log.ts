import "server-only";

/**
 * Structured logger. Anything that could identify a visitor or unlock the
 * system is redacted by key before it is written, so callers can pass whole
 * objects without leaking messages, addresses, tokens or credentials.
 */
const SENSITIVE = /pass|secret|token|cookie|authorization|email|message|name|phone|company|ip|key|body/i;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[depth]";
  if (value instanceof Error) {
    // Drizzle wraps driver errors and puts the query (with parameters) in the
    // message; keep only the first line of it, plus the cause's code/message.
    // Postgres' `detail` (which can echo row values) is never logged.
    const cause = value.cause instanceof Error ? value.cause : undefined;
    return {
      name: value.name,
      message: value.message.split("\n")[0]!.slice(0, 300),
      code: (value as { code?: unknown }).code,
      ...(cause ? { cause: { name: cause.name, code: (cause as { code?: unknown }).code, message: cause.message.slice(0, 300) } } : {}),
    };
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE.test(k) && !k.endsWith("Id") && k !== "id" ? "[redacted]" : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

type Level = "info" | "warn" | "error";

function write(level: Level, event: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "test" && !process.env.LOG_IN_TESTS) return;
  const line = JSON.stringify({ level, event, at: new Date().toISOString(), ...(data ? (redact(data) as object) : {}) });
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
}

export const log = {
  info: (event: string, data?: Record<string, unknown>) => write("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) => write("warn", event, data),
  error: (event: string, data?: Record<string, unknown>) => write("error", event, data),
};

export const __redactForTests = redact;
