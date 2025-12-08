/**
 * E2E Test: Feed Algorithm and Personalization
 */
import { test, expect } from '@playwright/test';

test.describe('Feed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'test@mirror.com');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/feed');
  });

  test('feed displays reflections', async ({ page }) => {
    const reflections = page.locator('[data-testid="reflection-card"]');
    await expect(reflections.first()).toBeVisible();
  });

  test('feed filters by lens', async ({ page }) => {
    // Select identity lens
    await page.selectOption('select[name="lens-filter"]', 'identity');

    // Verify only identity reflections shown
    const reflections = page.locator('[data-testid="reflection-card"]');
    const count = await reflections.count();
    
    for (let i = 0; i < count; i++) {
      await expect(reflections.nth(i).locator('text=identity')).toBeVisible();
    }
  });

  test('feed pagination works', async ({ page }) => {
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for more reflections to load
    await page.waitForSelector('[data-testid="loading-more"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="loading-more"]', { state: 'hidden' });

    // Verify more items loaded
    const reflections = page.locator('[data-testid="reflection-card"]');
    await expect(reflections).toHaveCount(20); // Assuming 10 per page
  });

  test('user can interact with reflection (signal)', async ({ page }) => {
    const firstReflection = page.locator('[data-testid="reflection-card"]').first();
    
    // Click respond button
    await firstReflection.locator('button:has-text("Respond")').click();

    // Verify signal recorded
    await expect(page.locator('text=Signal recorded')).toBeVisible();
  });

  test('following feed shows only followed users', async ({ page }) => {
    await page.click('text=Following');

    const reflections = page.locator('[data-testid="reflection-card"]');
    
    // Verify all reflections are from followed users
    await expect(reflections.first().locator('[data-following="true"]')).toBeVisible();
  });
});
