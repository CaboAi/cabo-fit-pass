import { test, expect } from '@playwright/test'
import { AdminGymPage, ToastHelper } from '../helpers/page-objects'
import { AuthHelper, TEST_USERS } from '../helpers/auth-helpers'

test.describe('Admin Gym Management Flow', () => {
  let adminGymPage: AdminGymPage
  let toastHelper: ToastHelper
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    adminGymPage = new AdminGymPage(page)
    toastHelper = new ToastHelper(page)
    authHelper = new AuthHelper(page)
  })

  test('should access admin dashboard with admin role', async ({ page }) => {
    // This test uses the admin storage state
    await page.goto('/admin')
    
    // Should be able to access admin dashboard
    await expect(page.locator('h1')).toContainText(/admin|dashboard/i)
    await expect(page.locator('[data-testid="admin-navigation"]')).toBeVisible()
    
    // Should see admin-specific navigation items
    await expect(page.locator('[data-testid="gym-management-link"]')).toBeVisible()
    await expect(page.locator('[data-testid="user-management-link"]')).toBeVisible()
    await expect(page.locator('[data-testid="payouts-link"]')).toBeVisible()
  })

  test('should prevent non-admin access to admin routes', async ({ page }) => {
    // Clear admin session and try to access admin routes
    await page.context().clearCookies()
    
    // Sign in as regular user
    await authHelper.signIn(TEST_USERS.regular)
    
    // Try to access admin page
    await page.goto('/admin')
    
    // Should be redirected or show access denied
    await page.waitForTimeout(2000) // Allow time for redirect
    
    const currentUrl = page.url()
    const pageContent = await page.textContent('body')
    
    // Should either be redirected away or show access denied message
    expect(
      !currentUrl.includes('/admin') || 
      pageContent?.includes('Access Denied') || 
      pageContent?.includes('Unauthorized')
    ).toBe(true)
  })

  test('should display gym management dashboard', async ({ page }) => {
    await adminGymPage.goto()
    
    // Should show gym management interface
    await expect(page.locator('[data-testid="gym-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="add-gym-button"]')).toBeVisible()
    
    // Should show existing gyms if any
    const gymCount = await adminGymPage.getGymCount()
    console.log(`Found ${gymCount} existing gyms`)
  })

  test('should create new gym successfully', async ({ page }) => {
    await adminGymPage.goto()
    
    const initialGymCount = await adminGymPage.getGymCount()
    
    // Create new gym
    const testGym = {
      name: `Test Gym ${Date.now()}`,
      location: 'Los Cabos Test Location',
      description: 'Test gym for E2E testing'
    }
    
    await adminGymPage.addNewGym(testGym)
    
    // Verify gym was created
    await toastHelper.waitForSuccessToast('Gym created successfully')
    
    const newGymCount = await adminGymPage.getGymCount()
    expect(newGymCount).toBe(initialGymCount + 1)
    
    // Verify gym appears in list
    const gymList = page.locator('[data-testid="gym-list"]')
    await expect(gymList.locator(`text=${testGym.name}`)).toBeVisible()
  })

  test('should validate required fields when creating gym', async ({ page }) => {
    await adminGymPage.goto()
    
    // Try to create gym without required fields
    await page.click('[data-testid="add-gym-button"]')
    
    // Submit without filling required fields
    await page.click('[data-testid="save-gym-button"]')
    
    // Should show validation errors
    await expect(page.locator('[data-testid="gym-name-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="gym-location-error"]')).toBeVisible()
  })

  test('should edit existing gym', async ({ page }) => {
    await adminGymPage.goto()
    
    const gymCount = await adminGymPage.getGymCount()
    
    if (gymCount > 0) {
      const updatedData = {
        name: `Updated Gym Name ${Date.now()}`,
        location: 'Updated Location'
      }
      
      await adminGymPage.editGym(0, updatedData)
      
      // Verify update success
      await toastHelper.waitForSuccessToast('Gym updated successfully')
      
      // Verify updated information appears
      const gymList = page.locator('[data-testid="gym-list"]')
      await expect(gymList.locator(`text=${updatedData.name}`)).toBeVisible()
    } else {
      test.skip(true, 'No gyms available to edit')
    }
  })

  test('should manage gym pricing', async ({ page }) => {
    await adminGymPage.goto()
    
    const gymCount = await adminGymPage.getGymCount()
    
    if (gymCount > 0) {
      // Click on first gym to manage pricing
      const firstGym = page.locator('[data-testid="gym-card"]').first()
      await firstGym.locator('[data-testid="manage-pricing-button"]').click()
      
      // Should navigate to pricing management
      await expect(page.locator('[data-testid="gym-pricing-form"]')).toBeVisible()
      
      // Update pricing
      await page.fill('[data-testid="class-credit-cost"]', '2')
      await page.fill('[data-testid="monthly-membership"]', '99')
      
      await page.click('[data-testid="save-pricing-button"]')
      
      // Verify pricing saved
      await toastHelper.waitForSuccessToast('Pricing updated successfully')
    } else {
      test.skip(true, 'No gyms available for pricing management')
    }
  })

  test('should view gym analytics and metrics', async ({ page }) => {
    await page.goto('/admin/analytics')
    
    // Should show analytics dashboard
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible()
    
    // Should show key metrics
    await expect(page.locator('[data-testid="total-bookings"]')).toBeVisible()
    await expect(page.locator('[data-testid="revenue-metrics"]')).toBeVisible()
    await expect(page.locator('[data-testid="popular-classes"]')).toBeVisible()
    
    // Should show charts/graphs
    await expect(page.locator('[data-testid="booking-trends-chart"]')).toBeVisible()
  })

  test('should manage payouts', async ({ page }) => {
    await page.goto('/admin/payouts')
    
    // Should show payout dashboard
    await expect(page.locator('[data-testid="payout-dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="pending-payouts"]')).toBeVisible()
    
    // Should be able to process payouts
    const pendingPayouts = page.locator('[data-testid="payout-item"]')
    const payoutCount = await pendingPayouts.count()
    
    if (payoutCount > 0) {
      // Process first payout
      await pendingPayouts.first().locator('[data-testid="process-payout-button"]').click()
      
      // Confirm payout processing
      await page.click('[data-testid="confirm-payout-button"]')
      
      // Should show success
      await toastHelper.waitForSuccessToast('Payout processed successfully')
    }
  })

  test('should view and manage users', async ({ page }) => {
    await page.goto('/admin/users')
    
    // Should show user management interface
    await expect(page.locator('[data-testid="user-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="user-search"]')).toBeVisible()
    
    // Should show user information
    const userItems = page.locator('[data-testid="user-item"]')
    const userCount = await userItems.count()
    
    expect(userCount).toBeGreaterThan(0)
    
    // Verify user information is displayed
    const firstUser = userItems.first()
    await expect(firstUser.locator('[data-testid="user-email"]')).toBeVisible()
    await expect(firstUser.locator('[data-testid="user-credits"]')).toBeVisible()
    await expect(firstUser.locator('[data-testid="user-bookings-count"]')).toBeVisible()
  })

  test('should handle user credit adjustments', async ({ page }) => {
    await page.goto('/admin/users')
    
    const userItems = page.locator('[data-testid="user-item"]')
    const userCount = await userItems.count()
    
    if (userCount > 0) {
      const firstUser = userItems.first()
      
      // Get current credits
      const currentCreditsText = await firstUser.locator('[data-testid="user-credits"]').textContent()
      const currentCredits = parseInt(currentCreditsText?.match(/\d+/)?.[0] || '0')
      
      // Open credit adjustment modal
      await firstUser.locator('[data-testid="adjust-credits-button"]').click()
      
      // Add credits
      await page.fill('[data-testid="credit-adjustment-input"]', '5')
      await page.fill('[data-testid="adjustment-reason"]', 'Test credit adjustment')
      await page.click('[data-testid="add-credits-button"]')
      
      // Verify success
      await toastHelper.waitForSuccessToast('Credits adjusted successfully')
      
      // Verify credits updated
      await page.reload()
      const newCreditsText = await firstUser.locator('[data-testid="user-credits"]').textContent()
      const newCredits = parseInt(newCreditsText?.match(/\d+/)?.[0] || '0')
      
      expect(newCredits).toBe(currentCredits + 5)
    } else {
      test.skip(true, 'No users available for credit adjustment')
    }
  })

  test('should export reports', async ({ page }) => {
    await page.goto('/admin/reports')
    
    // Should show report generation interface
    await expect(page.locator('[data-testid="report-generator"]')).toBeVisible()
    
    // Generate booking report
    await page.selectOption('[data-testid="report-type"]', 'bookings')
    await page.fill('[data-testid="report-start-date"]', '2024-01-01')
    await page.fill('[data-testid="report-end-date"]', '2024-12-31')
    
    // Start download
    const downloadPromise = page.waitForDownload()
    await page.click('[data-testid="generate-report-button"]')
    
    // Verify download started
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('bookings-report')
  })

  test('should handle system monitoring alerts', async ({ page }) => {
    await page.goto('/admin/monitoring')
    
    // Should show monitoring dashboard
    await expect(page.locator('[data-testid="monitoring-dashboard"]')).toBeVisible()
    
    // Should show system health indicators
    await expect(page.locator('[data-testid="system-health"]')).toBeVisible()
    await expect(page.locator('[data-testid="active-users"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-rate"]')).toBeVisible()
    
    // Should show recent alerts if any
    const alertItems = page.locator('[data-testid="alert-item"]')
    const alertCount = await alertItems.count()
    
    if (alertCount > 0) {
      // Should be able to acknowledge alerts
      await alertItems.first().locator('[data-testid="acknowledge-alert"]').click()
      await toastHelper.waitForSuccessToast('Alert acknowledged')
    }
  })

  test('should manage Stripe Connect integration', async ({ page }) => {
    await adminGymPage.goto()
    
    const gymCount = await adminGymPage.getGymCount()
    
    if (gymCount > 0) {
      const firstGym = page.locator('[data-testid="gym-card"]').first()
      
      // Check Stripe Connect status
      const connectStatus = firstGym.locator('[data-testid="stripe-connect-status"]')
      
      if (await connectStatus.isVisible()) {
        const statusText = await connectStatus.textContent()
        
        if (statusText?.includes('Not Connected')) {
          // Set up Stripe Connect
          await firstGym.locator('[data-testid="setup-stripe-connect"]').click()
          
          // Should show Stripe Connect setup flow
          await expect(page.locator('[data-testid="stripe-connect-setup"]')).toBeVisible()
          
          // In test environment, this might be mocked
          // Real implementation would redirect to Stripe
        }
      }
    } else {
      test.skip(true, 'No gyms available for Stripe Connect testing')
    }
  })
})