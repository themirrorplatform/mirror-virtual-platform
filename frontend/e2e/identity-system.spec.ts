/**
 * E2E Test: Identity System (Multi-Self)
 */
import { test, expect } from '@playwright/test';

test.describe('Identity System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'test@mirror.com');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
  });

  test('user starts with primary identity', async ({ page }) => {
    await page.goto('/identity');

    await expect(page.locator('text=primary')).toBeVisible();
    await expect(page.locator('[data-identity="primary"][data-active="true"]')).toBeVisible();
  });

  test('user can create new identity', async ({ page }) => {
    await page.goto('/identity');

    await page.click('button:has-text("Create Identity")');
    await page.fill('input[name="label"]', 'work-self');
    await page.click('button:has-text("Create")');

    await expect(page.locator('text=work-self')).toBeVisible();
  });

  test('user can switch active identity', async ({ page }) => {
    await page.goto('/identity');

    // Create second identity
    await page.click('button:has-text("Create Identity")');
    await page.fill('input[name="label"]', 'creative-self');
    await page.click('button:has-text("Create")');

    // Switch to it
    await page.click('[data-identity="creative-self"]');
    await page.click('button:has-text("Activate")');

    await expect(page.locator('[data-identity="creative-self"][data-active="true"]')).toBeVisible();
  });

  test('reflections use active identity', async ({ page }) => {
    // Switch identity
    await page.goto('/identity');
    await page.click('[data-identity="work-self"]');
    await page.click('button:has-text("Activate")');

    // Create reflection
    await page.goto('/reflect');
    await page.fill('textarea', 'Reflection from work-self');
    await page.click('button:has-text("Reflect")');

    // Verify identity tagged
    await page.goto('/feed');
    const reflection = page.locator('text=Reflection from work-self').locator('..');
    await expect(reflection.locator('text=work-self')).toBeVisible();
  });

  test('identity graph visualizes connections', async ({ page }) => {
    await page.goto('/identity');

    const graph = page.locator('[data-testid="identity-graph"]');
    await expect(graph).toBeVisible();

    // Should show nodes and edges
    await expect(graph.locator('[data-type="belief"]')).toHaveCount(3);
    await expect(graph.locator('[data-type="value"]')).toHaveCount(2);
  });
});
