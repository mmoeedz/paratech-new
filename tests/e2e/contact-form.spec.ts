import { test, expect } from "@playwright/test";
import { SITE } from "@/lib/site";

async function fillValidForm(
  page: import("@playwright/test").Page,
  email: string
) {
  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill(email);
  await page
    .getByLabel("What are you trying to improve?")
    .fill("This is a valid enquiry message for the Playwright e2e suite.");
}

test.describe("contact form", () => {
  test("displays field validation errors for invalid input", async ({
    page,
  }) => {
    await page.goto("/contact");

    // The inputs carry HTML5 constraints (required, minLength, type=email)
    // that would otherwise block submission before our own validation runs.
    // Disabling them here isolates the server-side Zod validation path.
    await page.evaluate(() =>
      document.querySelector("form")?.setAttribute("novalidate", "true")
    );

    await page.getByLabel("Name").fill("A");
    await page.getByLabel("Email").fill("not-an-email");
    await page
      .getByLabel("What are you trying to improve?")
      .fill("too short");
    await page.getByRole("button", { name: "Send enquiry" }).click();

    await expect(page.getByText("Enter your full name.")).toBeVisible();
    await expect(
      page.getByText("Enter a valid email address.")
    ).toBeVisible();
    await expect(
      page.getByText("Tell us a little more — at least 20 characters.")
    ).toBeVisible();

    // The visitor's input must survive a failed submission.
    await expect(page.getByLabel("Name")).toHaveValue("A");
  });

  test("shows a success state after a mocked successful submission", async ({
    page,
  }) => {
    await page.goto("/contact");
    await fillValidForm(page, "visitor@example.com");
    await page.getByRole("button", { name: "Send enquiry" }).click();

    await expect(
      page.getByText(
        "Thanks — your enquiry has been received. We will reply within one business day."
      )
    ).toBeVisible();
    // Confirmed submissions clear the form.
    await expect(page.getByLabel("Name")).toHaveValue("");
  });

  test("shows an actionable error after a failed submission", async ({
    page,
  }) => {
    await page.goto("/contact");
    // The +fail@playwright.test suffix is a test-only hook (see
    // src/app/contact/actions.ts) that forces the send-failure branch.
    await fillValidForm(page, "visitor+fail@playwright.test");
    await page.getByRole("button", { name: "Send enquiry" }).click();

    await expect(
      page.getByText(
        `We could not send your enquiry. Please try again or email ${SITE.email} directly.`
      )
    ).toBeVisible();
    // An error must never make the visitor retype everything.
    await expect(page.getByLabel("Name")).toHaveValue("Test User");
  });
});
