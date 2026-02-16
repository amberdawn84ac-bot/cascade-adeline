import { Page, Locator } from '@playwright/test';

export class OnboardingPage {
  constructor(private page: Page) {}

  getWelcomeModal(): Locator {
    return this.page.locator('[data-testid="welcome-modal"]');
  }

  getChecklistWidget(): Locator {
    return this.page.locator('[data-testid="checklist-widget"]');
  }

  async fillChildName(name: string) {
    await this.page.fill('input[name="childName"]', name);
  }

  async selectGradeLevel(grade: string) {
    await this.page.click(`[data-grade="${grade}"]`);
  }

  async clickNext() {
    await this.page.click('button:has-text("Next")');
  }

  async clickStart() {
    await this.page.click('button:has-text("Start Learning")');
  }

  getProgressBar(): Locator {
    return this.page.locator('[data-testid="progress-bar"]');
  }

  getChecklistItem(id: string): Locator {
    return this.page.locator(`[data-checklist-id="${id}"]`);
  }

  getCelebrationModal(): Locator {
    return this.page.locator('[data-testid="celebration-modal"]');
  }
}
