import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "https://localhost:3000",
    trace: "on-first-retry",
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: [
            "--enable-features=TranslationAPI,LanguageDetectionAPI,AIRewriter,AISummarizer",
            "--use-fake-ui-for-media-stream",
            "--auto-select-tab-capture-source-by-title=YouTube",
          ],
        },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "https://localhost:3000",
    reuseExistingServer: !process.env.CI,
    ignoreHTTPSErrors: true,
  },
});
