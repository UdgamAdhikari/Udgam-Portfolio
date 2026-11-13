import { expect, test, type Page } from "@playwright/test";

// The dashboard against the running app and its throwaway database.
// Credentials come from .env.local (E2E_ADMIN_PASSWORD matches ADMIN_PASSWORD_HASH).
const email = process.env.ADMIN_EMAIL ?? "";
const password = process.env.E2E_ADMIN_PASSWORD ?? "";

test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "admin flows run once, on desktop (login is rate limited per IP)");
test.skip(!email || !password, "set ADMIN_EMAIL and E2E_ADMIN_PASSWORD in .env.local");

async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("signed-out visitors can't reach the dashboard", async ({ page }) => {
  for (const path of ["/admin", "/admin/inquiries", "/admin/projects/new", "/admin/content"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login$/);
  }
  // A forged cookie gets no further than the login page either.
  await page.context().addCookies([{ name: "admin_session", value: "x".repeat(43), url: "http://localhost:3200" }]);
  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("wrong credentials are refused with one generic message", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("definitely not the password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /match/ })).toHaveText("That email and password don't match.");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("create a draft, publish it to the live site, then unpublish it", async ({ page }) => {
  await signIn(page);
  const title = `E2E Project ${Date.now()}`;
  const slug = title.toLowerCase().replace(/\s+/g, "-");

  await page.goto("/admin/projects/new");
  await page.getByLabel("Title").fill(title);
  await expect(page.getByLabel("Slug (URL)")).toHaveValue(slug);
  await page.getByLabel(/^Summary/).fill("Created by the end-to-end test.");
  await page.getByLabel(/^Technologies/).fill("React, TypeScript");
  await page.getByLabel(/Featured/).check();
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/admin\/projects\/[0-9a-f-]{36}/);

  // A draft is not public.
  const site = await page.context().newPage();
  await site.goto("/");
  await expect(site.getByText(title)).toHaveCount(0);
  expect((await site.goto(`/work/${slug}`))!.status()).toBe(404);

  // Publish → the home page and the case study show it, without a deploy.
  await page.getByRole("button", { name: /^Publish/ }).click();
  await expect(page.getByRole("button", { name: /^Unpublish/ })).toBeVisible();
  await site.goto("/");
  await expect(site.locator("#work").getByText(title).first()).toBeVisible();
  expect((await site.goto(`/work/${slug}`))!.status()).toBe(200);
  await expect(site.getByRole("heading", { level: 1 })).toContainText(title);

  // Unpublish → gone again.
  await page.getByRole("button", { name: /^Unpublish/ }).click();
  await expect(page.getByRole("button", { name: /^Publish/ })).toBeVisible();
  await site.goto("/");
  await expect(site.getByText(title)).toHaveCount(0);
  expect((await site.goto(`/work/${slug}`))!.status()).toBe(404);
});

test("a submitted inquiry appears in the dashboard and can be archived", async ({ page, request }) => {
  // Submit through the real API, as the form does.
  const token = (await (await request.get("/api/contact")).json()) as { formToken: string };
  await page.waitForTimeout(3200);
  const name = `Dashboard Visitor ${Date.now()}`;
  const res = await request.post("/api/contact", {
    headers: { origin: "http://localhost:3200" },
    data: {
      idempotencyKey: crypto.randomUUID(),
      formToken: token.formToken,
      type: "other",
      name,
      email: "visitor@example.com",
      message: "Checking that the dashboard lists this message.",
    },
  });
  expect(res.status()).toBe(201);

  await signIn(page);
  await page.goto(`/admin/inquiries?q=${encodeURIComponent(name)}`);
  await page.getByRole("link", { name: new RegExp(name) }).first().click();
  await expect(page.getByText("Checking that the dashboard lists this message.")).toBeVisible();
  // No email service is configured in tests, so the dashboard must say so rather than claim it was sent.
  await expect(page.getByRole("button", { name: /Retry/ })).toBeVisible();
  await page.getByRole("button", { name: /^Archived?$/ }).click();
  await expect(page.getByRole("status").filter({ hasText: /archived/i })).toBeVisible();
});
