// @vitest-environment node
import { describe, expect, it } from "vitest";
import { __redactForTests as redact } from "@/server/log";
import { contactSchema, subjectFor } from "@/lib/contact-schema";

describe("logger redaction", () => {
  it("never writes personal data or secrets", () => {
    const out = JSON.stringify(
      redact({ inquiryId: "abc", email: "a@b.c", message: "private", password: "x", nested: { token: "t", cookie: "c" }, error: new Error("boom") }),
    );
    expect(out).toContain("abc");
    expect(out).toContain("boom");
    for (const secret of ["a@b.c", "private", '"x"', '"t"', '"c"']) expect(out).not.toContain(secret);
  });
});

describe("contact schema", () => {
  const valid = { type: "project", name: " Ada ", email: " ADA@EXAMPLE.COM ", message: "A message that is clearly long enough." };

  it("normalises whitespace, case and control characters", () => {
    const data = contactSchema.parse({ ...valid, message: "Hello\u0000 there, this is long enough\u0007." });
    expect(data).toMatchObject({ name: "Ada", email: "ada@example.com", message: "Hello there, this is long enough." });
  });

  it("requires a role only for hiring", () => {
    expect(contactSchema.safeParse({ ...valid, type: "hiring" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, type: "hiring", role: "Engineer" }).success).toBe(true);
  });

  it("writes a subject line per type", () => {
    expect(subjectFor({ type: "hiring", name: "Ada", company: "", role: "Engineer" })).toBe("Hiring: Engineer at Ada");
  });
});
