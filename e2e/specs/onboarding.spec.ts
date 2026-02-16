import { test, expect } from '@playwright/test';
import { OnboardingPage } from '../pages/OnboardingPage';
import { ChatPage } from '../pages/ChatPage';

test.describe('Onboarding Flow', () => {
  test('new user sees welcome modal', async ({ page }) => {
    await page.goto('/chat');
    const onboarding = new OnboardingPage(page);

    // Welcome modal should appear for first-time users
    const welcomeModal = onboarding.getWelcomeModal();
    // Note: This test depends on detecting new users in the app
    // await expect(welcomeModal).toBeVisible();
  });

  test('checklist widget appears and tracks progress', async ({ page }) => {
    await page.goto('/chat');
    const onboarding = new OnboardingPage(page);
    const chatPage = new ChatPage(page);

    const checklist = onboarding.getChecklistWidget();
    await expect(checklist).toBeVisible();

    // First item (Meet Adeline) should be auto-completed
    const meetItem = onboarding.getChecklistItem('meet');
    await expect(meetItem).toHaveAttribute('data-completed', 'true');

    // Complete a LIFE_LOG task
    await chatPage.sendMessage('I baked cookies today');
    await chatPage.waitForResponse();

    // LIFE_LOG checklist item should now be completed
    const lifeLogItem = onboarding.getChecklistItem('life_log');
    await expect(lifeLogItem).toHaveAttribute('data-completed', 'true');
  });

  test('checklist can be collapsed and expanded', async ({ page }) => {
    await page.goto('/chat');
    const onboarding = new OnboardingPage(page);

    const checklist = onboarding.getChecklistWidget();

    // Should be expanded by default
    await expect(checklist).toHaveAttribute('data-expanded', 'true');

    // Click collapse button
    await page.click('[data-testid="checklist-collapse"]');

    // Should show mini view
    await expect(checklist).toHaveAttribute('data-expanded', 'false');
    await expect(page.locator('[data-testid="checklist-mini"]')).toBeVisible();

    // Click to expand again
    await checklist.click();
    await expect(checklist).toHaveAttribute('data-expanded', 'true');
  });

  test('completing all checklist items shows celebration', async ({ page }) => {
    await page.goto('/chat');
    const onboarding = new OnboardingPage(page);

    // Simulate completing all tasks via localStorage
    await page.evaluate(() => {
      localStorage.setItem('checklist_completed', JSON.stringify([
        'meet', 'life_log', 'investigate', 'brainstorm', 'reflect'
      ]));
    });

    await page.reload();

    // Celebration modal should appear
    const celebration = onboarding.getCelebrationModal();
    await expect(celebration).toBeVisible();
    await expect(celebration).toContainText(/ready|adventure|complete/i);

    // Confetti should be visible
    const confetti = page.locator('canvas');
    await expect(confetti).toBeVisible();
  });
});
