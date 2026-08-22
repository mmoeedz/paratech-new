import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test.describe("mobile navigation menu", () => {
  test("opens, moves focus into the panel, and lists primary links", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();

    const panel = page.getByRole("dialog", { name: "Mobile navigation" });
    await expect(panel).toBeVisible();
    await expect(page.getByRole("link", { name: "Home" })).toBeFocused();

    for (const label of ["Services", "Work", "About", "Insights"]) {
      await expect(panel.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test("closes on Escape and returns focus to the toggle button", async ({
    page,
  }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Open menu" });
    await toggle.click();
    await expect(
      page.getByRole("dialog", { name: "Mobile navigation" })
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("dialog", { name: "Mobile navigation" })
    ).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  });

  test("traps Tab focus inside the toggle button and panel", async ({
    page,
  }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Close menu" });
    await page.getByRole("button", { name: "Open menu" }).click();

    // Shift+Tab from the first focusable item (Home) lands on the toggle —
    // it's the element immediately before the panel in DOM order.
    await page.keyboard.press("Shift+Tab");
    await expect(toggle).toBeFocused();

    // Shift+Tab again from the trap's first element wraps to the last.
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByRole("link", { name: "Start a project" })).toBeFocused();

    // Tab forward from the last element wraps back to the toggle.
    await page.keyboard.press("Tab");
    await expect(toggle).toBeFocused();
  });
});
