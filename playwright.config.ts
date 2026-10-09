import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const hostedTarget = !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(?:\/|$)/i.test(baseURL);
<<<<<<< HEAD
const localPort = new URL(baseURL).port || "3000";
=======
>>>>>>> origin/main

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: hostedTarget ? undefined : {
<<<<<<< HEAD
    command: `npm run dev -- --hostname 127.0.0.1 --port ${localPort}`,
    url: `${baseURL}/api/health`,
=======
    command: "npm run dev",
    url: "http://127.0.0.1:3000/api/health",
>>>>>>> origin/main
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
