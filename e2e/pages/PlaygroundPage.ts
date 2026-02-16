import { Page, Locator } from '@playwright/test';
import { TestHelpers } from '../fixtures/test-helpers';

export class PlaygroundPage {
  private helpers: TestHelpers;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);
  }

  async goto() {
    await this.page.goto('/playground');
  }

  getSuggestedPrompt(text: string): Locator {
    return this.page.locator(`button:has-text("${text}")`);
  }

  async clickPrompt(text: string) {
    await this.getSuggestedPrompt(text).click();
  }

  async waitForResponse() {
    await this.helpers.waitForAdelineResponse();
  }

  getMessageInput(): Locator {
    return this.page.locator('input[placeholder*="Ask Adeline"]');
  }

  async sendMessage(text: string) {
    await this.helpers.sendMessage(text);
  }

  async getLastResponse() {
    return this.helpers.getLastMessage();
  }
}
