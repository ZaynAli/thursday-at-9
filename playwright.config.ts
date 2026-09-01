import { defineConfig, devices } from "@playwright/test";
import { loadEnvLocal } from "./e2e/helpers/env";

loadEnvLocal();

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

/** Mock data by default so smoke tests run without Supabase. */
const useMockData = process.env.PLAYWRIGHT_USE_MOCK !== "false";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use installed Google Chrome when Playwright's Chromium bundle isn't available (older macOS).
        channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
      },
    },
  ],
  webServer: {
    command: process.env.PLAYWRIGHT_WEB_SERVER ?? "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_USE_MOCK_DATA: useMockData ? "true" : "false",
    },
  },
});
