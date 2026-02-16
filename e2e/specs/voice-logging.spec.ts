import { test, expect } from '@playwright/test';

test.describe('Voice Logging → Credits → BKT', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
  });

  test('mic button is visible in chat input', async ({ page }) => {
    const micButton = page.locator('button[title*="Voice Log"]');
    await expect(micButton).toBeVisible();
    await expect(micButton).toContainText('🎙️');
  });

  test('mic button toggles recording state', async ({ page, context }) => {
    // Grant microphone permission
    await context.grantPermissions(['microphone']);

    const micButton = page.locator('button[title*="Voice Log"], button[title*="Stop recording"]');
    await micButton.click();

    // Should show stop button while recording
    await expect(page.locator('button[title="Stop recording"]')).toBeVisible({ timeout: 3000 });

    // Stop recording
    await page.locator('button[title="Stop recording"]').click();

    // Should show audio preview
    await expect(page.locator('text=Voice memo ready')).toBeVisible({ timeout: 3000 });
  });

  test('audio preview can be dismissed', async ({ page, context }) => {
    await context.grantPermissions(['microphone']);

    // Start and stop recording quickly
    const micButton = page.locator('button[title*="Voice Log"]');
    await micButton.click();
    await page.waitForTimeout(500);
    await page.locator('button[title="Stop recording"]').click();

    // Wait for preview
    await expect(page.locator('text=Voice memo ready')).toBeVisible({ timeout: 3000 });

    // Dismiss
    await page.locator('text=Voice memo ready').locator('..').locator('button:has-text("✕")').click();
    await expect(page.locator('text=Voice memo ready')).not.toBeVisible();
  });

  test('voice memo submission sends audioBase64 to API', async ({ page, context }) => {
    await context.grantPermissions(['microphone']);

    // Intercept the chat API to verify audioBase64 is sent
    let requestBody: Record<string, unknown> = {};
    await page.route('/api/chat', async (route) => {
      const request = route.request();
      requestBody = JSON.parse(request.postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: '',
      });
    });

    // Record a short audio clip
    const micButton = page.locator('button[title*="Voice Log"]');
    await micButton.click();
    await page.waitForTimeout(1000);
    await page.locator('button[title="Stop recording"]').click();

    // Wait for audio to be processed
    await expect(page.locator('text=Voice memo ready')).toBeVisible({ timeout: 3000 });

    // Submit
    await page.locator('button[type="submit"]').click();

    // Verify audioBase64 was included in the request
    expect(requestBody).toHaveProperty('audioBase64');
  });

  test('camera and mic buttons coexist', async ({ page }) => {
    const cameraButton = page.locator('button[title*="Snap to Log"]');
    const micButton = page.locator('button[title*="Voice Log"]');

    await expect(cameraButton).toBeVisible();
    await expect(micButton).toBeVisible();
  });
});
