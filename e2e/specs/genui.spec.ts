import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/ChatPage';

test.describe('Generative UI Components', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto();
  });

  test('TranscriptCard renders for life log', async ({ page }) => {
    await chatPage.sendMessage('I baked sourdough bread today');
    await chatPage.waitForResponse();

    const transcriptCard = await chatPage.getGenUIComponent('TranscriptCard');
    await expect(transcriptCard).toBeVisible();
  });

  test('TranscriptCard shows confetti animation', async ({ page }) => {
    await chatPage.sendMessage('I built a birdhouse with Dad');
    await chatPage.waitForResponse();

    // Wait for confetti canvas to appear
    const confetti = page.locator('canvas');
    await expect(confetti).toBeVisible({ timeout: 2000 });

    // Confetti should disappear after 3 seconds
    await page.waitForTimeout(3500);
    await expect(confetti).not.toBeVisible();
  });

  test('InvestigationBoard renders for investigate intent', async ({ page }) => {
    await chatPage.sendMessage('Who profits from standardized testing?');
    await chatPage.waitForResponse();

    const investigationBoard = await chatPage.getGenUIComponent('InvestigationBoard');
    await expect(investigationBoard).toBeVisible();
  });

  test('GenUI components have hover animations', async ({ page }) => {
    await chatPage.sendMessage('I made a watercolor painting');
    await chatPage.waitForResponse();

    const transcriptCard = await chatPage.getGenUIComponent('TranscriptCard');

    // Hover over card
    await transcriptCard.hover();

    // Wait for animation
    await page.waitForTimeout(500);

    // Should have transform applied (scale or translate)
    const transform = await transcriptCard.evaluate(el =>
      window.getComputedStyle(el).transform
    );
    expect(transform).not.toBe('none');
  });

  test('Multiple GenUI components can render in one conversation', async ({ page }) => {
    // First: life log
    await chatPage.sendMessage('I cooked dinner for my family');
    await chatPage.waitForResponse();
    const firstCard = await chatPage.getGenUIComponent('TranscriptCard');
    await expect(firstCard).toBeVisible();

    // Second: investigation
    await chatPage.sendMessage('Who profits from the sugar industry?');
    await chatPage.waitForResponse();
    const investigationBoard = await chatPage.getGenUIComponent('InvestigationBoard');
    await expect(investigationBoard).toBeVisible();
  });
});
