import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // A dedicated port, always launched fresh: reusing whatever's on :3000
    // (e.g. a local `next dev`) wouldn't carry PLAYWRIGHT_TEST_MODE, which
    // would silently break the mocked success/error contact-form tests.
    command: "npm run build && npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { PLAYWRIGHT_TEST_MODE: "true" },
  },
});
