import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const ADMIN = { email: "admin@paratech.test", password: "correct-horse-battery-1" };
const CALLER = { email: "casey@paratech.test", password: "caller-password-42" };

async function signIn(page: Page, who: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Password").fill(who.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
}

test.describe.serial("cold-calling CRM", () => {
  test("first-run setup creates the admin", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/setup/);
    await page.getByLabel("Your name").fill("Alex Admin");
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/settings/);
    // setup is one-time only: once an account exists it just bounces away
    await page.goto("/setup");
    await expect(page).not.toHaveURL(/\/setup/);
  });

  test("admin configures company details and adds a caller", async ({ page }) => {
    await signIn(page, ADMIN);
    await page.goto("/settings?tab=general");
    await page.getByLabel(/Postal address/).fill("1 Test Street, Austin, TX 78701");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Settings saved.")).toBeVisible();

    // The legal calling window can't be widened past 8am–9pm.
    await page.getByLabel(/Latest call/).fill("21");
    await page.getByLabel(/Earliest call/).fill("7");
    await page.getByLabel(/Earliest call/).evaluate((el: HTMLInputElement) => el.removeAttribute("min"));
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.locator("main [role=alert]")).toContainText("8am and 9pm");

    await page.goto("/settings?tab=team");
    await page.getByLabel("Name", { exact: true }).fill("Casey Caller");
    await page.getByLabel("Email", { exact: true }).fill(CALLER.email);
    await page.getByLabel("Initial password").fill(CALLER.password);
    await page.getByRole("button", { name: "Add member" }).click();
    await expect(page.getByText("can now sign in")).toBeVisible();
  });

  test("import: map columns, preview duplicates / invalid, commit", async ({ page }) => {
    await signIn(page, ADMIN);
    await page.goto("/import");
    await page.locator("input[type=file]").setInputFiles(path.join(__dirname, "fixtures.csv"));
    await page.getByRole("button", { name: /Upload/ }).click();
    await expect(page.getByRole("heading", { name: "Match columns & preview" })).toBeVisible();

    // Auto-mapped columns -> 8 clean rows, 2 duplicates, 1 invalid phone, 1 missing name.
    const card = (label: string) => page.locator("section[aria-label='Preview summary'] .card", { hasText: label }).first();
    await expect(card("Will import")).toContainText("8");
    await expect(card("Duplicates")).toContainText("2");
    await expect(card("Invalid phone")).toContainText("1");
    await expect(card("No name")).toContainText("1");

    await page.getByLabel("Batch tag *").fill("Roofers – test batch");
    await page.getByLabel("New list name").fill("Roofers – test list");
    await page.getByRole("button", { name: /Import 8 leads/ }).click();
    await expect(page.getByText(/Imported 8 leads/)).toBeVisible();
    await expect(page.getByRole("link", { name: /Download the skipped rows/ })).toBeVisible();
  });

  test("team lead assigns the list to the caller", async ({ page }) => {
    await signIn(page, ADMIN);
    await page.goto("/lists");
    await page.getByRole("link", { name: "Roofers – test list" }).click();
    await page.getByLabel("Casey Caller").check();
    await page.getByRole("button", { name: "Assign", exact: true }).click();
    await expect(page.getByText(/Assigned 8 leads/)).toBeVisible();
    await signOut(page);
  });

  test("caller works the queue: outcomes drive the next steps", async ({ page }) => {
    await signIn(page, CALLER);
    await expect(page).toHaveURL(/\/queue/);

    // Callers don't see admin areas.
    await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0);
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto("/queue");

    const name = page.locator("#lead-name");
    // Calling hours are enforced in each lead's own time zone, so depending on the hour the
    // queue can legitimately be empty (e.g. 4am US Eastern, before anyone's 8am).
    if (!(await name.isVisible())) {
      await expect(page.getByText("Nothing to call right now.")).toBeVisible();
      test.skip(true, "every lead is outside legal calling hours right now");
    }
    const first = (await name.textContent())!;
    await expect(page.getByText(/OK to call/)).toBeVisible();

    // 1) No answer -> schedules a retry, moves to a different lead.
    await page.getByRole("button", { name: "No answer" }).click();
    await page.getByRole("button", { name: "Save & Next" }).click();
    await expect(page.getByText(/Saved — No answer — retry/)).toBeVisible();
    await expect(name).not.toHaveText(first);

    // 2) Not interested needs a reason.
    await page.getByRole("button", { name: "Not interested" }).click();
    await page.getByRole("button", { name: "Save & Next" }).click();
    await expect(name).toBeVisible();
    await page.getByRole("button", { name: "Not interested" }).click();
    await page.getByLabel("Reason").selectOption("No budget");
    await page.getByRole("button", { name: "Save & Next" }).click();
    await expect(page.getByText(/Saved — Not interested — No budget/)).toBeVisible();

    // 3) Call back later -> a callback is created (quick-pick = tomorrow 10am lead time).
    const cbLead = (await name.textContent())!;
    await page.getByRole("button", { name: "Call back later" }).click();
    await page.getByRole("button", { name: "Tomorrow 10am" }).click();
    await expect(page.getByText(/^= .* your time/)).toBeVisible();
    await page.getByLabel("Notes").fill("Owner is at lunch, try tomorrow.");
    await page.getByRole("button", { name: "Save & Next" }).click();
    await expect(page.getByText(/Saved — Call back later/)).toBeVisible();

    // 4) Interested -> opens a deal.
    const hot = (await name.textContent())!;
    await page.getByRole("button", { name: "Interested", exact: true }).click();
    await page.getByLabel("Service they want").selectOption("Website");
    await page.getByLabel(/Estimated value/).fill("4500");
    await page.getByRole("button", { name: "Save & Next" }).click();
    await expect(page.getByText(/moved to the Deals pipeline/)).toBeVisible();

    // The callback shows on the callbacks page.
    await page.goto("/callbacks");
    await expect(page.getByRole("link", { name: cbLead })).toBeVisible();

    // The deal is on the board; move it to Won using the card's dropdown.
    await page.goto("/deals");
    await expect(page.getByRole("link", { name: hot })).toBeVisible();
    await page.getByLabel(`Move ${hot} to stage`).selectOption({ label: "Won" });
    await expect(page.getByRole("region", { name: "Won" }).getByRole("link", { name: hot })).toBeVisible();

    // Drag-and-drop between columns works too (and persists across a reload).
    await page.getByRole("region", { name: "Won" }).getByRole("listitem").filter({ hasText: hot }).dragTo(page.getByRole("region", { name: "Negotiation" }));
    await expect(page.getByRole("region", { name: "Negotiation" }).getByRole("link", { name: hot })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("region", { name: "Negotiation" }).getByRole("link", { name: hot })).toBeVisible();

    // Call log lists the caller's calls with outcomes.
    await page.goto("/calls");
    await expect(page.getByRole("cell", { name: /Interested/ })).toBeVisible();
    await expect(page.getByRole("cell", { name: /No answer/ })).toBeVisible();
  });

  test("do-not-call blocks every number and shows on the DNC list", async ({ page }) => {
    await signIn(page, CALLER);
    await page.goto("/queue");
    const name = page.locator("#lead-name");
    if (!(await name.isVisible())) test.skip(true, "no lead left in the queue at this hour");
    const victim = (await name.textContent())!;
    await page.getByRole("button", { name: "Do not call" }).click();
    await page.getByRole("button", { name: "Save & Next" }).click();
    await expect(page.getByText(/all numbers blocked/)).toBeVisible();
    await page.goto("/dnc");
    await expect(page.locator("table")).toBeVisible();
    await page.getByRole("link", { name: "Leads" }).click();
    await page.getByPlaceholder(/Search name/).fill(victim);
    await page.getByRole("button", { name: "Filter" }).click();
    await page.getByRole("link", { name: victim }).click();
    await expect(page.getByText(/This lead is on the do-not-call list/)).toBeVisible();
  });

  test("lead page: email follow-up, meeting booking and outcome", async ({ page }) => {
    await signIn(page, ADMIN);
    await page.goto("/leads");
    await page.getByPlaceholder(/Search name/).fill("Lone Star");
    await page.getByRole("button", { name: "Filter" }).click();
    await page.getByRole("link", { name: "Lone Star Roofing" }).click();

    // Email: pick a template, it's rendered with the lead's details, and the send is logged
    // (no email provider is configured in tests, so it must say it only saved a draft).
    await page.getByLabel("Template").selectOption({ label: "Sorry I missed you" });
    await page.getByRole("button", { name: "Use" }).click();
    await expect(page.getByLabel("Subject")).toHaveValue(/Lone Star Roofing/);
    await expect(page.getByLabel("Message")).toHaveValue(/Hi Dana,/);
    await page.getByRole("button", { name: "Send email" }).click();
    await expect(page.getByText(/nothing was sent/i)).toBeVisible();
    await expect(page.getByText(/Email drafted \(not sent/)).toBeVisible();

    // Meeting: booked in the lead's zone, shows on /meetings, then marked held.
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    await page.getByLabel(/Book a meeting/).fill(`${tomorrow}T11:00`);
    await page.getByLabel("Zoom link").fill("https://zoom.us/j/123456789");
    await page.getByRole("button", { name: "Book meeting" }).click();
    await expect(page.getByText("Meeting booked.")).toBeVisible();
    await expect(page.getByText(/Open deal:/)).toBeVisible(); // booking a meeting opened a deal

    await page.goto("/meetings?view=tomorrow");
    await expect(page.getByRole("link", { name: "Lone Star Roofing" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Join Zoom/ })).toBeVisible();
    await page.getByRole("button", { name: "Held" }).click();
    await expect(page.getByText("Marked held.")).toBeVisible();
  });

  test("zoom call-log upload verifies logged calls", async ({ page }) => {
    await signIn(page, ADMIN);
    await page.goto("/zoom");
    const csv = "Caller Email,Callee Number,Start Time,Duration,Direction\n" +
      `${CALLER.email},+1 303-555-2002,${new Date(Date.now() - 600_000).toISOString()},0:30,Outbound\n`;
    await page.locator("input[type=file]").setInputFiles({ name: "zoom.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
    await page.getByRole("button", { name: /Upload/ }).click();
    await expect(page.getByText(/Read 1 rows: 1 new Zoom calls/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Verification by caller" })).toBeVisible();
  });

  test("manager sees team reports and dashboard", async ({ page }) => {
    await signIn(page, ADMIN);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Hi Alex/ })).toBeVisible();
    await expect(page.getByText("Calls made")).toBeVisible();
    await page.goto("/reports");
    await expect(page.getByRole("heading", { name: "Team leaderboard" })).toBeVisible();
    await expect(page.getByRole("row", { name: /Casey Caller/ })).toBeVisible();
    for (const p of ["/leads", "/lists", "/meetings", "/scripts", "/templates", "/dnc", "/zoom", "/calls", "/callbacks", "/settings?tab=outcomes", "/settings?tab=pipeline", "/settings?tab=lists", "/settings?tab=fields", "/settings?tab=data"]) {
      const res = await page.goto(p);
      expect(res?.status(), p).toBeLessThan(400);
    }
  });
});
