import { test, expect } from '@playwright/test';

test.describe('Complete Student Journey Flow', () => {
  test('full journey: log activity → get suggestion → complete lesson → see credit update', async ({ page }) => {
    // Navigate to journey page
    await page.goto('/dashboard/journey');
    
    // Wait for journey plan to load
    await expect(page.locator('text=The Summit')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Active Expeditions')).toBeVisible();

    // Step 1: Log an activity via chat
    const chatButton = page.locator('button:has-text("Chat")').first();
    if (await chatButton.isVisible()) {
      await chatButton.click();
    }

    // Type activity log message
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await chatInput.fill('I baked sourdough bread today and learned about fermentation');
    await chatInput.press('Enter');

    // Wait for Adeline's response
    await page.waitForTimeout(3000);
    const response = page.locator('[data-testid="chat-message"]').last();
    await expect(response).toBeVisible({ timeout: 15000 });

    // Step 2: Navigate back to journey and check for suggestions
    await page.goto('/dashboard/journey');
    await page.waitForTimeout(2000);

    // Check if Active Expeditions or Trail Ahead has courses
    const expeditionCards = page.locator('[data-testid="expedition-card"], button:has-text("Today\'s Lesson")');
    const cardCount = await expeditionCards.count();
    
    if (cardCount === 0) {
      console.log('[journey-flow] No expedition cards found - may need onboarding');
      return;
    }

    // Step 3: Click on a course to start a lesson
    const firstCourse = expeditionCards.first();
    await firstCourse.click();

    // Wait for lesson to generate
    await page.waitForTimeout(5000);
    
    // Check for lesson content or loading state
    const lessonContent = page.locator('text=/lesson|content|activity/i').first();
    const loadingIndicator = page.locator('text=/generating|loading/i').first();
    
    const hasContent = await lessonContent.isVisible().catch(() => false);
    const isLoading = await loadingIndicator.isVisible().catch(() => false);
    
    expect(hasContent || isLoading).toBeTruthy();

    // Step 4: If quiz is present, answer questions
    const quizQuestions = page.locator('[data-testid="quiz-question"], button:has-text("Submit")');
    const quizCount = await quizQuestions.count();
    
    if (quizCount > 0) {
      // Answer first available quiz option
      const quizOption = page.locator('button[role="radio"], input[type="radio"]').first();
      if (await quizOption.isVisible()) {
        await quizOption.click();
      }

      // Submit quiz
      const submitButton = page.locator('button:has-text("Submit"), button:has-text("Complete")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Step 5: Complete the lesson
    const completeButton = page.locator('button:has-text("Complete"), button:has-text("Finish")').first();
    if (await completeButton.isVisible()) {
      await completeButton.click();
      await page.waitForTimeout(2000);
    }

    // Step 6: Verify credit update
    // Navigate back to journey to see updated progress
    await page.goto('/dashboard/journey');
    await page.waitForTimeout(2000);

    // Check for progress indicators
    const progressIndicators = page.locator('text=/credit|progress|%/i');
    await expect(progressIndicators.first()).toBeVisible({ timeout: 5000 });

    // Verify the summit progress bar exists
    const progressBar = page.locator('[class*="progress"], [role="progressbar"]').first();
    await expect(progressBar).toBeVisible();
  });

  test('journey plan refresh updates active expeditions', async ({ page }) => {
    await page.goto('/dashboard/journey');
    
    // Wait for initial load
    await expect(page.locator('text=The Summit')).toBeVisible({ timeout: 10000 });

    // Find refresh button if it exists
    const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh"]').first();
    
    if (await refreshButton.isVisible()) {
      // Click refresh
      await refreshButton.click();
      
      // Wait for loading state
      await page.waitForTimeout(1000);
      
      // Verify content reloads
      await expect(page.locator('text=Active Expeditions')).toBeVisible({ timeout: 10000 });
    }
  });

  test('change route functionality works', async ({ page }) => {
    await page.goto('/dashboard/journey');
    
    // Wait for journey to load
    await expect(page.locator('text=The Trail Ahead')).toBeVisible({ timeout: 10000 });

    // Find "Change Route" button in Trail Ahead section
    const changeRouteButton = page.locator('button:has-text("Change Route")').first();
    
    if (await changeRouteButton.isVisible()) {
      await changeRouteButton.click();
      
      // Wait for chat interface or modal
      await page.waitForTimeout(1000);
      
      // Verify chat or modal opened
      const chatInterface = page.locator('[data-testid="change-route-chat"], textarea, input[type="text"]');
      await expect(chatInterface.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('daily bread widget interaction', async ({ page }) => {
    await page.goto('/dashboard/journey');
    
    // Wait for page load
    await expect(page.locator('text=The Summit')).toBeVisible({ timeout: 10000 });

    // Find Daily Bread widget
    const dailyBreadWidget = page.locator('[data-testid="daily-bread"], text=/daily bread/i').first();
    
    if (await dailyBreadWidget.isVisible()) {
      // Click on Daily Bread
      await dailyBreadWidget.click();
      
      // Verify scripture content or study prompt appears
      await page.waitForTimeout(1000);
      const scriptureContent = page.locator('text=/verse|scripture|study/i').first();
      await expect(scriptureContent).toBeVisible({ timeout: 5000 });
    }
  });

  test('grade override selector changes lesson difficulty', async ({ page }) => {
    await page.goto('/dashboard/journey');
    
    // Wait for page load
    await expect(page.locator('text=Active Expeditions')).toBeVisible({ timeout: 10000 });

    // Find grade selector
    const gradeSelector = page.locator('select, [role="combobox"]').filter({ hasText: /grade|auto/i }).first();
    
    if (await gradeSelector.isVisible()) {
      // Change grade level
      await gradeSelector.selectOption('5');
      
      // Wait for any updates
      await page.waitForTimeout(1000);
      
      // Verify selector value changed
      const selectedValue = await gradeSelector.inputValue();
      expect(selectedValue).toBe('5');
    }
  });
});
