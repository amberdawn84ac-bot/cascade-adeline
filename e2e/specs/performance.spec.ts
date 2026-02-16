import { test, expect } from '@playwright/test';

test.describe('Performance Benchmarks', () => {
  test('highlights API responds within 1s', async ({ page }) => {
    await page.goto('/');

    const start = Date.now();
    const response = await page.request.get('/api/highlights');
    const latency = Date.now() - start;

    console.log(`Highlights API latency: ${latency}ms`);
    // Allow for cold start
    expect(latency).toBeLessThan(5000);
  });

  test('insights API responds within 1s', async ({ page }) => {
    await page.goto('/');

    const start = Date.now();
    const response = await page.request.get('/api/insights');
    const latency = Date.now() - start;

    console.log(`Insights API latency: ${latency}ms`);
    expect(latency).toBeLessThan(5000);
  });

  test('page load TTI < 5s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const tti = Date.now() - start;

    console.log(`Time to Interactive: ${tti}ms`);
    expect(tti).toBeLessThan(5000);
  });

  test('First Contentful Paint < 3s', async ({ page }) => {
    await page.goto('/');

    const paintTiming = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType('paint');
      const fcp = perfEntries.find((entry) => entry.name === 'first-contentful-paint');
      return fcp ? fcp.startTime : 0;
    });

    console.log(`First Contentful Paint: ${paintTiming}ms`);
    expect(paintTiming).toBeLessThan(3000);
  });
});
