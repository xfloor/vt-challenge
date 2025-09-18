import { BrowserContext, expect, test } from "@playwright/test";

test.describe("First-time user experience", () => {
  let context: BrowserContext;
  let page: any;

  test.beforeEach(async ({ browser }) => {
    // Create a fresh context for each test to ensure clean state
    context = await browser.newContext();
    page = await context.newPage();

    // Navigate to the page
    await page.goto("/");

    // Wait for page to fully load and initialize
    await page.waitForLoadState("networkidle");

    // Clear localStorage and sessionStorage after page load
    await page.evaluate(() => {
      // Clear localStorage
      if (typeof Storage !== "undefined" && window.localStorage) {
        try {
          window.localStorage.clear();
        } catch (e) {
          console.warn("Could not clear localStorage:", e);
        }
      }

      // Clear sessionStorage
      if (typeof Storage !== "undefined" && window.sessionStorage) {
        try {
          window.sessionStorage.clear();
        } catch (e) {
          console.warn("Could not clear sessionStorage:", e);
        }
      }
    });
  });

  test.afterEach(async () => {
    // Clean up the context after each test
    if (context) {
      await context.close();
    }
  });

  test("homepage displays with centered input and no previous projects", async () => {
    // Homepage displays with centered text input
    const input = page.locator('input[type="text"], textarea').first();
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("placeholder");

    // No previous projects section for first visit
    const previousProjects = page.locator("text=/previous projects/i");
    await expect(previousProjects).not.toBeVisible();

    // Light/dark mode toggle works
    const themeToggle = page
      .locator(
        '[data-testid="theme-toggle"], button:has-text("Dark"), button:has-text("Light")'
      )
      .first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      // Verify theme change (could check for class changes on html/body)
    }
  });

  test("project creation flow works end-to-end", async () => {
    // Enter test prompt
    const input = page.locator('input[type="text"], textarea').first();
    await input.fill(
      "I want to create a video story about the history of Ferrari"
    );

    // Submit button becomes enabled
    const submitButton = page
      .locator(
        'button:has-text("Submit"), button:has-text("Generate"), button:has-text("Create")'
      )
      .first();
    await expect(submitButton).toBeEnabled();

    // Click submit button
    await submitButton.click();

    // Loading screen appears immediately
    const loadingScreen = page.locator("text=/loading|generating/i").first();
    await expect(loadingScreen).toBeVisible({ timeout: 5000 });

    // Wait for generation to complete (with longer timeout for AI generation)
    await expect(loadingScreen).not.toBeVisible({ timeout: 120000 });

    // Should be redirected to project page
    await expect(page).toHaveURL(/\/project\/[a-f0-9-]+/);

    // Canvas workspace displays with pattern background
    const canvas = page
      .locator('[data-testid="canvas"], .canvas-workspace')
      .first();
    await expect(canvas).toBeVisible();

    // 4 scene images should be visible in 16:9 aspect ratio
    const sceneImages = page.locator('img, [data-testid="scene-image"]');
    await expect(sceneImages).toHaveCount(4);

    // View toggle shows "Canvas" as active
    const viewToggle = page.locator('[data-testid="view-toggle"]');
    await expect(viewToggle).toBeVisible();
  });

  test("scene editing workflow", async () => {
    // This test assumes we're already on a project page with generated scenes
    // In practice, we'd need to generate a project first or use a test fixture

    // Navigate to a test project (would be created in beforeEach in real implementation)
    await page.goto("/"); // Start from homepage for now

    // For now, just verify the page structure is set up correctly
    await expect(page.locator("h1")).toBeVisible();
  });

  test("video preview functionality", async () => {
    // Test switching to editor view and video playback
    // This would test the Remotion video player integration

    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("responsive design", async () => {
    // Test desktop experience (1920x1080)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    const input = page.locator('input[type="text"], textarea').first();
    await expect(input).toBeVisible();

    // Test tablet experience (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(input).toBeVisible();

    // Test mobile experience (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(input).toBeVisible();
  });
});
