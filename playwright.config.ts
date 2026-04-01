import { defineConfig, devices } from "@playwright/test";

const authSecret =
  process.env.AUTH_SECRET ?? "playwright-fallback-auth-secret-32chars-min!!";
const pwPort = process.env.PW_PORT ?? "3000";
const pwBaseUrl = `http://127.0.0.1:${pwPort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: pwBaseUrl,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run dev -- --port ${pwPort}`,
    url: pwBaseUrl,
    reuseExistingServer: process.env.PW_REUSE_DEV_SERVER === "1",
    timeout: 120 * 1000,
    env: {
      ...process.env,
      AUTH_SECRET: authSecret,
      AUTH_URL: process.env.AUTH_URL ?? pwBaseUrl,
      ADMIN_EMAILS: process.env.ADMIN_EMAILS ?? "ayano@demo.local",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
