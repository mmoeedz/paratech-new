import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  timeout: 60_000,
  use: { baseURL: "http://localhost:3201", trace: "retain-on-failure" },
  projects: [{
    name: "chromium",
    use: {
      ...devices["Desktop Chrome"],
      // Set PW_CHROMIUM to use a browser that's already installed (e.g. in CI images).
      launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
    },
  }],
  webServer: {
    // Fresh database every run so the first-run setup screen is always exercised.
    command: "rm -f ./data/e2e.db* && npm run build && npx next start -p 3201",
    url: "http://localhost:3201/login",
    reuseExistingServer: false,
    timeout: 240_000,
    env: { CRM_DB_PATH: "./data/e2e.db" },
  },
});
