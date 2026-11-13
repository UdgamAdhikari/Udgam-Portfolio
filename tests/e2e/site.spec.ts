import { expect, test } from "@playwright/test";

test.describe("home", () => {
  test("renders every section with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^Udgam Adhikari/);
    await expect(page.getByRole("link", { name: /See selected work/ })).toHaveAttribute("href", "#work");
    for (const id of ["parts", "about", "services", "assembly", "stack", "work", "contact"]) {
      await expect(page.locator(`section#${id}`)).toBeAttached();
    }
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
  });

  test("never scrolls sideways", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("remembers the theme across visits", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("switch", { name: "Theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "graphite");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "graphite");
    await expect(page.getByRole("switch", { name: "Theme" })).toHaveAttribute("aria-checked", "true");
  });

  test("starts still when the visitor prefers reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "0");
    await expect(page.locator("output[for=motion]")).toHaveText("Still");
  });

  test("offers a skip link to keyboard users", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard flow");
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
  });

  test("toggles blueprint mode with B", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard shortcut");
    await page.goto("/");
    await page.keyboard.press("b");
    await expect(page.locator("html")).toHaveAttribute("data-blueprint", "on");
    await expect(page.getByRole("status").filter({ hasText: "Blueprint mode" })).toBeVisible();
    await page.keyboard.press("b");
    await expect(page.locator("html")).not.toHaveAttribute("data-blueprint");
  });

  test("copies the email address from the contact button", async ({ page, context, isMobile }) => {
    test.skip(isMobile, "clipboard permissions");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/#contact");
    await page.getByRole("button", { name: /udgamadhikari26@gmail\.com/ }).click();
    await expect(page.getByText("Copied to clipboard", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("udgamadhikari26@gmail.com");
  });
});

test.describe("navigation", () => {
  test("the index closes with Escape and hands focus back", async ({ page }) => {
    await page.goto("/");
    await page.mouse.wheel(0, 900);
    const trigger = page.getByRole("button", { name: "Open the index" });
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Site index" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("mobile index menu jumps to a section", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile menu");
    await page.goto("/");
    await page.getByRole("button", { name: "Open the index" }).click();
    const index = page.getByRole("dialog", { name: "Site index" });
    await expect(index.getByRole("link").first()).toBeFocused();
    await index.getByRole("link", { name: /About/ }).click();
    await expect(index).toBeHidden();
    await expect(page).toHaveURL(/#about$/);
    await expect(page.locator("#about")).toBeInViewport();
  });

  test("opens a case study from the work index and moves to the next one", async ({ page }) => {
    await page.goto("/#work");
    await page.locator("#work").getByRole("link", { name: "Garud Security", exact: true }).click();
    await expect(page).toHaveURL(/\/work\/garud-security$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Garud Security");
    await expect(page.getByRole("link", { name: /Live site/ })).toHaveAttribute("href", "https://garudsecurities.com.np");

    await page.getByRole("link", { name: /Next case study/ }).click();
    await expect(page).toHaveURL(/\/work\/heart-disease-prediction$/);
  });

  test("unknown case studies are a real 404", async ({ page }) => {
    const response = await page.goto("/work/not-a-project");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("404 — Missing part")).toBeVisible();
  });
});

test.describe("seo", () => {
  test("serves sitemap, robots and structured data", async ({ page, request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("https://udgamadhikari.com.np/work/garud-security");
    expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
    expect((await request.get("/opengraph-image")).headers()["content-type"]).toContain("image/png");

    await page.goto("/");
    const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
    expect(jsonLd).toMatchObject({ "@type": "Person", name: "Udgam Adhikari" });
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://udgamadhikari.com.np");
  });
});
