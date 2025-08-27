import { test, expect } from '@playwright/test'

/**
 * Example E2E Test for Cabo Fit Pass
 * 
 * This is a simple demonstration test to verify the testing setup works.
 * Run with: npx playwright test tests/e2e/example.spec.ts
 */

test.describe('Example Test Suite', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Cabo Fit Pass/)
    
    // Check for main heading or logo
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Check sign in form is present
    await expect(page.locator('[data-testid="signin-form"]')).toBeVisible()
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="signin-button"]')).toBeVisible()
  })

  test('should show demo login buttons', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Check demo buttons are present
    await expect(page.locator('[data-testid="demo-user-button"]')).toBeVisible()
    
    // Verify button text
    await expect(page.locator('[data-testid="demo-user-button"]')).toContainText('Member Demo Login')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/auth/signin')
    
    // Form should still be visible and usable on mobile
    await expect(page.locator('[data-testid="signin-form"]')).toBeVisible()
    
    // Check that content fits in viewport (no horizontal scroll)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20) // Small tolerance
  })
})