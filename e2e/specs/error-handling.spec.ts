import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/ChatPage';

test.describe('Error Handling', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
  });

  test('shows friendly error on network failure', async ({ page }) => {
    await chatPage.goto();

    // Intercept API call and make it fail
    await page.route('**/api/chat', route => route.abort());

    await chatPage.sendMessage('Tell me about science');

    // Error display should appear
    const error = await chatPage.getErrorMessage();
    await expect(error).toBeVisible();

    // Should show illustration
    await expect(error.locator('svg')).toBeVisible();

    // Should have retry button
    const retryButton = error.locator('button:has-text("Try Again")');
    await expect(retryButton).toBeVisible();
  });

  test('retry button works after error', async ({ page }) => {
    await chatPage.goto();

    let callCount = 0;

    // Fail first call, succeed second
    await page.route('**/api/chat', route => {
      callCount++;
      if (callCount === 1) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await chatPage.sendMessage('Hello');

    // Error should appear
    const error = await chatPage.getErrorMessage();
    await expect(error).toBeVisible();

    // Click retry
    await error.locator('button:has-text("Try Again")').click();

    // Should succeed and show response
    await chatPage.waitForResponse();
    await expect(error).not.toBeVisible();
  });

  test('shows rate limit error with appropriate message', async ({ page }) => {
    await chatPage.goto();

    // Intercept and return 429
    await page.route('**/api/chat', route => {
      route.fulfill({
        status: 429,
        body: 'Rate limit exceeded',
      });
    });

    await chatPage.sendMessage('Test message');

    const error = await chatPage.getErrorMessage();
    await expect(error).toBeVisible();
  });

  test('shows content blocked error for inappropriate content', async ({ page }) => {
    await chatPage.goto();

    // Intercept and return content blocked response
    await page.route('**/api/chat', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          intent: 'BLOCKED',
          message: "Let's keep our conversation focused on learning!",
        }),
      });
    });

    await chatPage.sendMessage('inappropriate content here');

    // Should show blocked message
    const response = await chatPage.getLastMessage();
    await expect(response).toContainText(/focused on learning/i);
  });
});
