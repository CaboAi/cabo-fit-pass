import { test, expect } from '@playwright/test'
import { DashboardPage, ToastHelper } from '../helpers/page-objects'
import { AuthHelper, TEST_USERS } from '../helpers/auth-helpers'

test.describe('Class Booking Flow - Critical Revenue Path', () => {
  let dashboardPage: DashboardPage
  let toastHelper: ToastHelper
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page)
    toastHelper = new ToastHelper(page)
    authHelper = new AuthHelper(page)
    
    // Ensure we're authenticated for booking tests
    // This uses the pre-authenticated state from global setup
  })

  test('should display available classes on dashboard', async ({ page }) => {
    await dashboardPage.goto()
    
    // Verify page loads correctly
    await expect(page.locator('h1')).toContainText(/classes|dashboard/i)
    
    // Should show class cards
    const classCards = await dashboardPage.getClassCards()
    expect(classCards.length).toBeGreaterThan(0)
    
    // Verify class cards have required information
    const firstCard = classCards[0]
    await expect(firstCard.locator('[data-testid="class-name"]')).toBeVisible()
    await expect(firstCard.locator('[data-testid="class-time"]')).toBeVisible()
    await expect(firstCard.locator('[data-testid="class-instructor"]')).toBeVisible()
    await expect(firstCard.locator('[data-testid="book-class-button"]')).toBeVisible()
  })

  test('should successfully book a class with sufficient credits', async ({ page }) => {
    await dashboardPage.goto()
    
    // Check initial credit balance
    const initialCredits = await dashboardPage.getCurrentCredits()
    expect(initialCredits).toBeGreaterThan(0)
    
    // Book the first available class
    await dashboardPage.bookClass(0)
    
    // Wait for booking success
    await dashboardPage.waitForBookingSuccess()
    await toastHelper.waitForSuccessToast('Class booked successfully')
    
    // Verify credits were deducted
    const newCredits = await dashboardPage.getCurrentCredits()
    expect(newCredits).toBeLessThan(initialCredits)
    
    // Verify booking appears in user's bookings
    await page.goto('/profile')
    await expect(page.locator('[data-testid="user-bookings"]')).toBeVisible()
    await expect(page.locator('[data-testid="booking-item"]').first()).toBeVisible()
  })

  test('should prevent booking when user has insufficient credits', async ({ page }) => {
    // This test requires a user with 0 credits
    // In a real test environment, you might create a user with no credits
    // or use a test endpoint to set credits to 0
    
    await page.goto('/dashboard')
    
    // Check if user has insufficient credits
    const credits = await dashboardPage.getCurrentCredits()
    
    if (credits === 0) {
      // Try to book a class
      await dashboardPage.bookClass(0)
      
      // Should show insufficient credits error
      await dashboardPage.waitForBookingError()
      const errorMessage = await dashboardPage.getBookingErrorMessage()
      expect(errorMessage).toContain(/insufficient credits|not enough credits/i)
      
      await toastHelper.waitForErrorToast()
    } else {
      test.skip(true, 'User has credits, cannot test insufficient credits scenario')
    }
  })

  test('should prevent duplicate bookings for the same class', async ({ page }) => {
    await dashboardPage.goto()
    
    // Book a class first
    await dashboardPage.bookClass(0)
    await dashboardPage.waitForBookingSuccess()
    
    // Try to book the same class again
    await page.reload() // Reload to reset UI state
    await dashboardPage.bookClass(0)
    
    // Should show duplicate booking error
    await dashboardPage.waitForBookingError()
    const errorMessage = await dashboardPage.getBookingErrorMessage()
    expect(errorMessage).toContain(/already booked|duplicate booking/i)
    
    await toastHelper.waitForErrorToast()
  })

  test('should handle class capacity limits', async ({ page }) => {
    // This test is complex as it requires a nearly full class
    // In a test environment, you might seed data with a full class
    
    await dashboardPage.goto()
    
    // Look for a class that shows "Almost Full" or similar indicator
    const almostFullClass = page.locator('[data-testid="class-card"]')
      .filter({ has: page.locator(':text("Almost Full")') })
    
    if (await almostFullClass.count() > 0) {
      await almostFullClass.locator('[data-testid="book-class-button"]').click()
      
      // Might succeed or show "Class Full" error depending on exact timing
      try {
        await dashboardPage.waitForBookingSuccess()
        // Successfully got the last spot
      } catch {
        // Class became full
        await dashboardPage.waitForBookingError()
        const errorMessage = await dashboardPage.getBookingErrorMessage()
        expect(errorMessage).toContain(/full|capacity/i)
      }
    } else {
      test.skip(true, 'No almost full classes available for testing')
    }
  })

  test('should handle booking race conditions (atomic booking)', async ({ browser }) => {
    // This test simulates multiple users trying to book the same class simultaneously
    // to test the atomic booking function
    
    const context1 = await browser.newContext({ storageState: 'tests/.auth/user.json' })
    const context2 = await browser.newContext({ storageState: 'tests/.auth/user.json' })
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    const dashboard1 = new DashboardPage(page1)
    const dashboard2 = new DashboardPage(page2)
    
    // Both users navigate to dashboard
    await Promise.all([
      dashboard1.goto(),
      dashboard2.goto()
    ])
    
    // Both try to book the same class simultaneously
    const bookingPromises = [
      dashboard1.bookClass(0).catch(error => ({ error: error.message })),
      dashboard2.bookClass(0).catch(error => ({ error: error.message }))
    ]
    
    const results = await Promise.all(bookingPromises)
    
    // One should succeed, one should fail with appropriate error
    const successes = results.filter(r => !r?.error)
    const failures = results.filter(r => r?.error)
    
    expect(successes.length).toBe(1)
    expect(failures.length).toBe(1)
    
    await context1.close()
    await context2.close()
  })

  test('should allow booking cancellation', async ({ page }) => {
    await dashboardPage.goto()
    
    // Book a class first
    await dashboardPage.bookClass(0)
    await dashboardPage.waitForBookingSuccess()
    
    // Go to profile to see bookings
    await page.goto('/profile')
    
    // Find and cancel the booking
    const bookingItem = page.locator('[data-testid="booking-item"]').first()
    await expect(bookingItem).toBeVisible()
    
    const cancelButton = bookingItem.locator('[data-testid="cancel-booking-button"]')
    
    if (await cancelButton.isVisible()) {
      const initialCredits = await page.locator('[data-testid="credits-balance"]').textContent()
      
      await cancelButton.click()
      
      // Confirm cancellation in modal
      await page.click('[data-testid="confirm-cancel-button"]')
      
      // Should show cancellation success
      await toastHelper.waitForSuccessToast('Booking cancelled')
      
      // Credits should be refunded
      const newCredits = await page.locator('[data-testid="credits-balance"]').textContent()
      expect(newCredits).not.toBe(initialCredits)
      
      // Booking should be marked as cancelled or removed
      await expect(bookingItem.locator('[data-testid="booking-status"]')).toContainText(/cancelled/i)
    } else {
      test.skip(true, 'Booking cancellation not available for this class')
    }
  })

  test('should show booking details and receipt', async ({ page }) => {
    await dashboardPage.goto()
    
    // Book a class
    await dashboardPage.bookClass(0)
    await dashboardPage.waitForBookingSuccess()
    
    // Check if booking details modal appears
    const bookingModal = page.locator('[data-testid="booking-details-modal"]')
    
    if (await bookingModal.isVisible()) {
      // Verify booking details
      await expect(bookingModal.locator('[data-testid="booked-class-name"]')).toBeVisible()
      await expect(bookingModal.locator('[data-testid="booking-date-time"]')).toBeVisible()
      await expect(bookingModal.locator('[data-testid="credits-used"]')).toBeVisible()
      await expect(bookingModal.locator('[data-testid="booking-id"]')).toBeVisible()
      
      // Close modal
      await page.click('[data-testid="close-booking-modal"]')
    }
    
    // Verify booking appears in profile
    await page.goto('/profile')
    await expect(page.locator('[data-testid="booking-item"]').first()).toBeVisible()
  })

  test('should handle network failures gracefully', async ({ page }) => {
    await dashboardPage.goto()
    
    // Simulate network failure during booking
    await page.route('**/api/bookings/create', route => {
      route.abort('failed')
    })
    
    // Try to book a class
    await dashboardPage.bookClass(0)
    
    // Should show network error
    await toastHelper.waitForErrorToast()
    const errorToast = page.locator('[data-testid="toast-error"]')
    await expect(errorToast).toContainText(/network|connection|failed/i)
    
    // Clear network failure
    await page.unroute('**/api/bookings/create')
  })

  test('should update class availability in real-time', async ({ page }) => {
    await dashboardPage.goto()
    
    // Find a class and note its current participant count
    const classCard = page.locator('[data-testid="class-card"]').first()
    const initialParticipants = await classCard.locator('[data-testid="participant-count"]').textContent()
    
    // Book the class
    await dashboardPage.bookClass(0)
    await dashboardPage.waitForBookingSuccess()
    
    // Reload page and check if participant count updated
    await page.reload()
    await dashboardPage.waitForPageLoad()
    
    const newParticipants = await classCard.locator('[data-testid="participant-count"]').textContent()
    
    // Participant count should have increased
    expect(newParticipants).not.toBe(initialParticipants)
  })

  test('should handle booking during maintenance mode', async ({ page }) => {
    // This would test how the system behaves when in maintenance mode
    // Implementation depends on how maintenance mode is handled in your app
    
    // Simulate maintenance mode by intercepting API calls
    await page.route('**/api/bookings/create', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'System under maintenance' })
      })
    })
    
    await dashboardPage.goto()
    await dashboardPage.bookClass(0)
    
    // Should show maintenance message
    await toastHelper.waitForErrorToast()
    const errorMessage = await dashboardPage.getBookingErrorMessage()
    expect(errorMessage).toContain(/maintenance|unavailable/i)
    
    await page.unroute('**/api/bookings/create')
  })
})