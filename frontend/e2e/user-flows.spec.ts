import { test, expect } from '@playwright/test';

/**
 * E2E User Flow: Complete Mirror Platform Journey
 * 
 * Tests the full user experience from onboarding through governance participation
 */

test.describe('Complete User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('User Onboarding Flow', async ({ page }) => {
    // Navigate to signup
    await page.click('text=Get Started');
    
    // Fill registration form
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="username"]', 'test_user_123');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    
    // Accept terms
    await page.check('[name="acceptTerms"]');
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Should redirect to profile setup
    await expect(page).toHaveURL(/\/onboarding/);
    
    // Complete profile
    await page.fill('[name="displayName"]', 'Test User');
    await page.fill('[name="bio"]', 'Exploring identity through reflection');
    
    // Select initial posture
    await page.click('text=Unknown');
    
    // Continue to platform
    await page.click('text=Complete Setup');
    
    // Should land on main feed
    await expect(page).toHaveURL(/\/feed/);
  });

  test('Create Reflection and Receive Mirrorback', async ({ page }) => {
    // Assume logged in
    await page.goto('http://localhost:3000/feed');
    
    // Open reflection composer
    await page.click('text=New Reflection');
    
    // Type reflection content
    await page.fill('[placeholder*="Share your thoughts"]', 
      'I\'ve been thinking about how my work identity conflicts with my personal values. ' +
      'Sometimes I feel like I\'m pretending to be someone I\'m not.');
    
    // Select tone
    await page.click('text=Processing');
    
    // Set visibility
    await page.click('text=Circle');
    
    // Submit reflection
    await page.click('button:has-text("Reflect")');
    
    // Wait for mirrorback response
    await page.waitForSelector('text=AI Generated', { timeout: 10000 });
    
    // Verify mirrorback appears
    const mirrorback = page.locator('[data-testid="mirrorback-display"]').first();
    await expect(mirrorback).toBeVisible();
    
    // Check for tone indicator
    await expect(page.locator('text=Clear, text=Processing').first()).toBeVisible();
  });

  test('Identity Graph Interaction', async ({ page }) => {
    await page.goto('http://localhost:3000/identity');
    
    // Wait for graph to load
    await page.waitForSelector('[data-testid="identity-graph"]');
    
    // Click on a node
    await page.click('.react-flow__node').first();
    
    // Node details panel should appear
    await expect(page.locator('[data-testid="node-details"]')).toBeVisible();
    
    // Filter by lens
    await page.click('text=Filter by Lens');
    await page.click('text=Identity');
    
    // Graph should update
    await expect(page.locator('.react-flow__node')).toHaveCount(expect.any(Number));
  });

  test('Posture Declaration Flow', async ({ page }) => {
    await page.goto('http://localhost:3000/finder');
    
    // Open posture selector
    await page.click('[data-testid="posture-selector"]');
    
    // Current posture should be highlighted
    await expect(page.locator('[data-active="true"]')).toBeVisible();
    
    // Check for divergence alert if present
    const divergenceAlert = page.locator('text=Suggested posture');
    if (await divergenceAlert.isVisible()) {
      // Click "Accept Suggestion"
      await page.click('text=Accept Suggestion');
      
      // Confirmation should appear
      await expect(page.locator('text=Posture updated')).toBeVisible();
    } else {
      // Manually select new posture
      await page.click('text=Open');
      
      // Confirmation dialog
      await page.click('button:has-text("Confirm")');
      
      await expect(page.locator('text=Posture declared')).toBeVisible();
    }
  });

  test('Door Recommendation System', async ({ page }) => {
    await page.goto('http://localhost:3000/finder/doors');
    
    // Wait for doors to load
    await page.waitForSelector('[data-testid="door-card"]');
    
    // Should show 3 doors by default
    const doors = page.locator('[data-testid="door-card"]');
    await expect(doors).toHaveCount(3);
    
    // Click on first door
    await doors.first().click();
    
    // Door detail should open
    await expect(page.locator('[data-testid="door-detail"]')).toBeVisible();
    
    // Check for asymmetry report
    await expect(page.locator('text=Asymmetry Report')).toBeVisible();
    
    // Open door (enter)
    await page.click('button:has-text("Open Door")');
    
    // Confirmation dialog
    await page.click('button:has-text("Confirm Entry")');
    
    // Should navigate to door content
    await expect(page).toHaveURL(/\/doors\//);
  });

  test('Governance Voting Flow', async ({ page }) => {
    await page.goto('http://localhost:3000/governance');
    
    // Find active proposal
    await page.click('[data-testid="proposal-card"]').first();
    
    // Proposal detail should load
    await expect(page.locator('[data-testid="proposal-detail"]')).toBeVisible();
    
    // Read proposal
    await page.click('text=Read Full Text');
    
    // Vote on proposal
    await page.click('button:has-text("Approve")');
    
    // Add optional comment
    await page.fill('[placeholder*="optional comment"]', 
      'I support this amendment because it improves transparency.');
    
    // Confirm vote
    await page.click('button:has-text("Confirm Vote")');
    
    // Success message
    await expect(page.locator('text=Vote recorded')).toBeVisible();
    
    // Vote should be reflected in counts
    await expect(page.locator('[data-testid="vote-count-approve"]')).toContainText(/\d+/);
  });

  test('Thread Conversation Flow', async ({ page }) => {
    await page.goto('http://localhost:3000/feed');
    
    // Find reflection with replies
    await page.click('[data-testid="reflection-card"]:has(text=replies)').first();
    
    // Thread should expand
    await expect(page.locator('[data-testid="reflection-thread"]')).toBeVisible();
    
    // Reply to reflection
    await page.click('button:has-text("Reply")').first();
    
    // Type reply
    await page.fill('[placeholder*="Write a reply"]', 
      'This resonates with my own experience. Thank you for sharing.');
    
    // Submit reply
    await page.click('button:has-text("Post Reply")');
    
    // Reply should appear in thread
    await expect(page.locator('text=This resonates with my own experience')).toBeVisible();
  });

  test('Search Functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/feed');
    
    // Trigger search with keyboard shortcut
    await page.keyboard.press('Meta+K'); // Cmd+K on Mac, Ctrl+K on Windows
    
    // Search modal should open
    await expect(page.locator('[data-testid="search-modal"]')).toBeVisible();
    
    // Type search query
    await page.fill('[placeholder*="Search"]', 'identity');
    
    // Wait for results
    await page.waitForSelector('[data-testid="search-result"]');
    
    // Results should appear
    const results = page.locator('[data-testid="search-result"]');
    await expect(results).toHaveCount(expect.any(Number));
    
    // Click on result
    await results.first().click();
    
    // Should navigate to result
    await expect(page).toHaveURL(/\/(reflections|users|tags)\//);
  });
});

test.describe('Mobile Responsive Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('Mobile Navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/feed');
    
    // Hamburger menu should be visible
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Click to open menu
    await page.click('[data-testid="mobile-menu-button"]');
    
    // Menu should slide in
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Navigate to Identity
    await page.click('text=Identity Graph');
    
    // Menu should close
    await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
    
    // Should be on identity page
    await expect(page).toHaveURL(/\/identity/);
  });

  test('Mobile Reflection Composer', async ({ page }) => {
    await page.goto('http://localhost:3000/feed');
    
    // FAB (Floating Action Button) should be visible
    await expect(page.locator('[data-testid="fab-new-reflection"]')).toBeVisible();
    
    // Click FAB
    await page.click('[data-testid="fab-new-reflection"]');
    
    // Full-screen composer should open
    await expect(page.locator('[data-testid="reflection-composer"]')).toBeVisible();
    
    // Should fill entire viewport
    const composer = page.locator('[data-testid="reflection-composer"]');
    const boundingBox = await composer.boundingBox();
    expect(boundingBox?.width).toBeGreaterThanOrEqual(370);
  });
});

test.describe('Offline Capabilities', () => {
  test('Offline Mode Detection', async ({ page, context }) => {
    await page.goto('http://localhost:3000/feed');
    
    // Go offline
    await context.setOffline(true);
    
    // Offline indicator should appear
    await expect(page.locator('text=Offline')).toBeVisible();
    
    // Try to create reflection
    await page.click('text=New Reflection');
    await page.fill('[placeholder*="Share your thoughts"]', 'Offline reflection test');
    await page.click('button:has-text("Reflect")');
    
    // Should show queued message
    await expect(page.locator('text=Queued for sync')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Should sync automatically
    await expect(page.locator('text=Synced')).toBeVisible({ timeout: 10000 });
  });
});
