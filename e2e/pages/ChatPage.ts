import { Page, Locator } from '@playwright/test';
import { TestHelpers } from '../fixtures/test-helpers';

export class ChatPage {
  private helpers: TestHelpers;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);
  }

  async goto() {
    await this.page.goto('/chat');
  }

  async sendMessage(text: string) {
    await this.helpers.sendMessage(text);
  }

  async waitForResponse() {
    await this.helpers.waitForAdelineResponse();
  }

  async getGenUIComponent(type: string) {
    await this.helpers.waitForGenUIComponent(type);
    return this.page.locator(`[data-genui-type="${type}"]`);
  }

  async getLastMessage() {
    return this.helpers.getLastMessage();
  }

  getChecklistWidget(): Locator {
    return this.page.locator('[data-testid="checklist-widget"]');
  }

  getInsightsPanel(): Locator {
    return this.page.locator('[data-testid="insights-panel"]');
  }

  async waitForAdelineTyping() {
    await this.page.waitForSelector('[data-testid="adeline-typing"]', {
      state: 'visible',
    });
  }

  async getErrorMessage() {
    return this.page.locator('[data-testid="error-display"]');
  }
}
