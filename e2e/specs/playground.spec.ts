import { test, expect } from '@playwright/test';
import { PlaygroundPage } from '../pages/PlaygroundPage';

test.describe('Playground', () => {
  let playground: PlaygroundPage;

  test.beforeEach(async ({ page }) => {
    playground = new PlaygroundPage(page);
    await playground.goto();
  });

  test('loads playground without authentication', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Try Adeline');
  });

  test('displays suggested prompts', async ({ page }) => {
    const breadPrompt = playground.getSuggestedPrompt('baked sourdough');
    await expect(breadPrompt).toBeVisible();

    const testingPrompt = playground.getSuggestedPrompt('standardized testing');
    await expect(testingPrompt).toBeVisible();

    const coopPrompt = playground.getSuggestedPrompt('chicken coop');
    await expect(coopPrompt).toBeVisible();

    const reflectPrompt = playground.getSuggestedPrompt('reflect');
    await expect(reflectPrompt).toBeVisible();
  });

  test('clicking prompt auto-fills and submits', async ({ page }) => {
    await playground.clickPrompt('baked sourdough');

    // Verify input was filled
    const input = playground.getMessageInput();
    await expect(input).toHaveValue(/baked.*bread/i);

    // Wait for response
    await playground.waitForResponse();

    // Verify Adeline responded
    const response = await playground.getLastResponse();
    await expect(response).toBeVisible();
  });

  test('typing custom message works', async ({ page }) => {
    await playground.sendMessage('What should I learn about today?');
    await playground.waitForResponse();

    const response = await playground.getLastResponse();
    await expect(response).toBeVisible();
  });

  test('displays Adeline typing indicator', async ({ page }) => {
    const typingIndicator = page.locator('[data-testid="adeline-typing"]');

    await playground.sendMessage('Tell me about photosynthesis');

    // Typing indicator should appear
    await expect(typingIndicator).toBeVisible();

    // Then disappear when response arrives
    await playground.waitForResponse();
    await expect(typingIndicator).not.toBeVisible();
  });
});
