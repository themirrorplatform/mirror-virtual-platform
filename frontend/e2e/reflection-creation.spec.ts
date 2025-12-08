/**
 * E2E Test: Reflection Creation Flow
 */
import { test, expect } from '@playwright/test';

test.describe('Reflection Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and login
    await page.goto('/');
    await page.click('text=Sign In');
    // Assume test user authentication
    await page.fill('input[name="email"]', 'test@mirror.com');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/feed');
  });

  test('user can create a reflection', async ({ page }) => {
    // Navigate to reflect page
    await page.click('text=Reflect');
    await page.waitForURL('/reflect');

    // Fill in reflection
    const reflectionText = 'This is a test reflection about my journey of self-discovery.';
    await page.fill('textarea[placeholder*="reflecting"]', reflectionText);

    // Select lens
    await page.selectOption('select[name="lens"]', 'identity');

    // Submit
    await page.click('button:has-text("Reflect")');

    // Verify success
    await expect(page.locator('text=Reflection created')).toBeVisible();

    // Verify appears in feed
    await page.goto('/feed');
    await expect(page.locator(`text=${reflectionText}`)).toBeVisible();
  });

  test('reflection generates mirrorback automatically', async ({ page }) => {
    await page.click('text=Reflect');
    
    await page.fill('textarea', 'I feel torn between two important life choices.');
    await page.click('button:has-text("Reflect")');

    // Wait for mirrorback generation (might take a few seconds)
    await expect(page.locator('text=MirrorX is reflecting')).toBeVisible({ timeout: 10000 });
    
    // Verify mirrorback appears
    await expect(page.locator('[data-testid="mirrorback"]')).toBeVisible({ timeout: 15000 });
    
    // Mirrorback should contain questions (MirrorCore)
    const mirrorbackText = await page.locator('[data-testid="mirrorback"]').textContent();
    expect(mirrorbackText).toContain('?');
  });

  test('user cannot submit empty reflection', async ({ page }) => {
    await page.click('text=Reflect');
    
    const submitButton = page.locator('button:has-text("Reflect")');
    await expect(submitButton).toBeDisabled();
  });

  test('reflection shows in user profile', async ({ page }) => {
    const reflectionText = 'Profile test reflection';
    
    await page.click('text=Reflect');
    await page.fill('textarea', reflectionText);
    await page.click('button:has-text("Reflect")');

    // Go to profile
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Profile');

    // Verify reflection appears
    await expect(page.locator(`text=${reflectionText}`)).toBeVisible();
  });
});
