import "server-only";
import { env } from "@/server/env";

export type Email = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  /** Resend de-duplicates sends with the same key for 24 hours. */
  idempotencyKey?: string;
};

export interface Mailer {
  send(email: Email): Promise<{ id: string }>;
}

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email is not configured (RESEND_API_KEY / CONTACT_TO_EMAIL missing)");
    this.name = "EmailNotConfiguredError";
  }
}

export class EmailDeliveryError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

/** Resend over its HTTP API. `fetcher` is injectable so tests never hit the network. */
export function resendMailer(apiKey: string, from: string, fetcher: typeof fetch = fetch): Mailer {
  return {
    async send(email) {
      let res: Response;
      try {
        res = await fetcher("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            ...(email.idempotencyKey ? { "Idempotency-Key": email.idempotencyKey } : {}),
          },
          body: JSON.stringify({
            from,
            to: [email.to],
            subject: email.subject,
            text: email.text,
            html: email.html,
            ...(email.replyTo ? { reply_to: email.replyTo } : {}),
          }),
          signal: AbortSignal.timeout(10_000),
        });
      } catch (error) {
        throw new EmailDeliveryError(`Network error: ${(error as Error).name}`);
      }
      if (!res.ok) {
        // Resend's error body names the problem (never contains our secrets).
        const detail = await res.text().catch(() => "");
        throw new EmailDeliveryError(`Resend responded ${res.status}: ${detail.slice(0, 200)}`, res.status);
      }
      const data = (await res.json().catch(() => ({}))) as { id?: string };
      return { id: data.id ?? "unknown" };
    },
  };
}

const notConfigured: Mailer = {
  async send() {
    throw new EmailNotConfiguredError();
  },
};

export function defaultMailer(): Mailer {
  const { RESEND_API_KEY, CONTACT_FROM_EMAIL } = env();
  return RESEND_API_KEY ? resendMailer(RESEND_API_KEY, CONTACT_FROM_EMAIL) : notConfigured;
}
