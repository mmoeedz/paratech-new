import { test, expect } from "@playwright/test";
import { SERVICE_CATEGORIES } from "@/data/services";

test("homepage loads successfully", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Paratech/);
  await expect(
    page.getByRole("heading", { level: 1 })
  ).toBeVisible();
});

test.describe("primary navigation", () => {
  for (const [label, path] of [
    ["Work", "/work"],
    ["About", "/about"],
    ["Insights", "/insights"],
  ] as const) {
    test(`${label} link resolves`, async ({ page }) => {
      await page.goto("/");
      await page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: label, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }

  test("Services link resolves to the services index", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Services", exact: true })
      .click();
    await expect(page).toHaveURL(/\/services$/);
  });
});

test.describe("service category pages", () => {
  for (const category of SERVICE_CATEGORIES) {
    test(`/services/${category.slug} returns a working page`, async ({
      page,
    }) => {
      const response = await page.goto(`/services/${category.slug}`);
      expect(response?.ok()).toBeTruthy();
      await expect(
        page.getByRole("heading", { level: 1 })
      ).toContainText(category.headline);
    });
  }
});

test("an invalid service slug shows the custom 404 page", async ({
  page,
}) => {
  const response = await page.goto("/services/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "That page doesn't exist." })
  ).toBeVisible();
});

test.describe("desktop services menu", () => {
  test("opens on click and shows every category", async ({ page }) => {
    await page.goto("/");
    // A stable locator across open/closed states: the accessible name
    // flips between "Show Services menu" and "Hide Services menu".
    const trigger = page.getByRole("button", { name: /services menu/i });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    for (const category of SERVICE_CATEGORIES) {
      await expect(
        page.getByRole("link", { name: category.title, exact: true }).first()
      ).toBeVisible();
    }
  });

  test("closes on Escape and returns focus to the trigger", async ({
    page,
  }) => {
    await page.goto("/");
    // A stable locator across open/closed states: the accessible name
    // flips between "Show Services menu" and "Hide Services menu".
    const trigger = page.getByRole("button", { name: /services menu/i });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });
});
