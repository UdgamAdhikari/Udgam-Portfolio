import { expect, test } from "@playwright/test";

test("books a call from the Get in touch button", async ({ page }) => {
  await page.goto("/#contact");
  await page.locator("#contact").getByRole("button", { name: /Get in touch/ }).click();

  const dialog = page.getByRole("dialog", { name: /30 min intro call/ });
  await expect(dialog).toBeVisible();

  // A day with open slots is pre-selected; take its first time.
  const firstTime = dialog.getByRole("button", { name: /^\d{1,2}:\d{2}/ }).first();
  await expect(firstTime).toBeVisible();
  await firstTime.click();

  await dialog.getByLabel(/Your name/).fill("Test Visitor");
  await dialog.getByLabel(/Email address/).fill(`visitor-${Date.now()}@example.com`);
  await dialog.getByLabel(/What would you like to talk about/).fill("Playwright booking test");
  await dialog.getByRole("button", { name: "Confirm booking" }).click();

  await expect(page.getByRole("dialog", { name: "Your call is booked" })).toBeVisible();
  await expect(page.getByText("Playwright booking test")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("the hero's Get in touch opens the same scheduler", async ({ page }) => {
  await page.goto("/");
  await page.locator("#parts").getByRole("button", { name: "Get in touch" }).click();
  await expect(page.getByRole("dialog", { name: /30 min intro call/ })).toBeVisible();
});
