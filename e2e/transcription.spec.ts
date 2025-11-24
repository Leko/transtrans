import { test, expect, type Page, type BrowserContext } from "@playwright/test";

test.describe("Transcription E2E", () => {
  let context: BrowserContext;
  let appPage: Page;
  let youtubePage: Page;

  test.beforeAll(async ({ browser }) => {
    // Create a new context with permissions for audio/video
    context = await browser.newContext({
      permissions: ["microphone"],
    });

    // Open YouTube video at specific timestamp (21:47 = 1307 seconds)
    youtubePage = await context.newPage();
    await youtubePage.goto(
      "https://www.youtube.com/live/wPfp57BJdbg?si=_Ri5yojt4OcdN-Yw&t=1307"
    );

    // Wait for video to be ready and start playing
    await youtubePage.waitForSelector("video", { state: "visible" });

    // Click play button if video is paused
    const playButton = youtubePage.locator(
      'button.ytp-play-button[data-title-no-tooltip="Play"]'
    );
    if (await playButton.isVisible()) {
      await playButton.click();
    }

    // Open the application page
    appPage = await context.newPage();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test("should transcribe, translate, and show summary", async () => {
    // Navigate to the app
    await appPage.goto("/");

    // Select screen share as audio source
    const screenShareRadio = appPage.locator(
      '[data-testid="screen-share-radio"]'
    );
    await screenShareRadio.click();

    // Handle the screen share dialog by selecting the YouTube tab
    // The Chrome flag --auto-select-tab-capture-source-by-title=YouTube should handle this
    // But we need to wait for the screen share stream to be ready
    await appPage.waitForSelector('text="Previewing screen share..."', {
      timeout: 30000,
    });

    // Click start button to begin transcription
    const startButton = appPage.locator('[data-testid="start-button"]');
    await expect(startButton).toBeEnabled();
    await startButton.click();

    // Wait for at least 3 final results to appear
    const finalResults = appPage.locator('[data-testid="final-result-item"]');
    await expect(finalResults).toHaveCount(3, { timeout: 120000 });

    // Wait for translations to complete for all 3 results
    const translatedTexts = appPage.locator('[data-testid="translated-text"]');
    await expect(translatedTexts).toHaveCount(3, { timeout: 60000 });

    // Verify that each translated text has content
    for (let i = 0; i < 3; i++) {
      const translatedText = translatedTexts.nth(i);
      await expect(translatedText).not.toBeEmpty();
    }

    // Wait for summary to appear and have content
    const summary = appPage.locator('[data-testid="summary"]');
    await expect(summary).toBeVisible();
    await expect(summary).not.toBeEmpty({ timeout: 60000 });

    // Verify that the summary contains some text
    const summaryText = await summary.textContent();
    expect(summaryText).toBeTruthy();
    expect(summaryText!.length).toBeGreaterThan(10);
  });
});
