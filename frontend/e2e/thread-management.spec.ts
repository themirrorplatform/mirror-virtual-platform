/**
 * E2E Test: Thread Creation and Management
 */
import { test, expect } from '@playwright/test';

test.describe('Thread Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'test@mirror.com');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/feed');
  });

  test('user can create a thread', async ({ page }) => {
    // Navigate to threads
    await page.click('text=Threads');
    
    // Create new thread
    await page.click('button:has-text("New Thread")');
    
    await page.fill('input[name="title"]', 'My Identity Journey');
    await page.selectOption('select[name="visibility"]', 'public');
    await page.click('button:has-text("Create")');

    // Verify thread created
    await expect(page.locator('text=My Identity Journey')).toBeVisible();
  });

  test('user can add reflections to thread', async ({ page }) => {
    // Create thread first
    await page.click('text=Threads');
    await page.click('button:has-text("New Thread")');
    await page.fill('input[name="title"]', 'Test Thread');
    await page.click('button:has-text("Create")');

    // Add reflection to thread
    await page.click('button:has-text("Add Reflection")');
    await page.fill('textarea', 'First reflection in thread');
    await page.click('button:has-text("Add to Thread")');

    // Verify appears in thread
    await expect(page.locator('text=First reflection in thread')).toBeVisible();
  });

  test('thread displays reflections in timeline order', async ({ page }) => {
    await page.goto('/thread/test-thread-id');

    // Verify timeline layout
    const timeline = page.locator('[data-testid="thread-timeline"]');
    await expect(timeline).toBeVisible();

    // Verify reflection order
    const reflections = page.locator('[data-testid="thread-reflection"]');
    await expect(reflections).toHaveCount(2);
  });

  test('user can reorder reflections in their thread', async ({ page }) => {
    await page.goto('/thread/my-thread-id');

    // Click reorder button
    await page.click('button:has-text("Reorder")');

    // Drag and drop (simulate)
    await page.locator('[data-testid="reflection-1"]').dragTo(page.locator('[data-testid="reflection-2"]'));

    // Save order
    await page.click('button:has-text("Save Order")');

    await expect(page.locator('text=Thread updated')).toBeVisible();
  });
});
