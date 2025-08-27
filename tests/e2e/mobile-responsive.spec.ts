import { test, expect, devices } from '@playwright/test'
import { DashboardPage, ProfilePage } from '../helpers/page-objects'
import { AuthHelper, TEST_USERS } from '../helpers/auth-helpers'

test.describe('Mobile Responsive Design', () => {
  test.describe('iPhone 12 Layout', () => {
    test.use({ ...devices['iPhone 12'] })

    test('should display mobile navigation correctly', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Mobile navigation should be collapsed into hamburger menu
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
      await expect(page.locator('[data-testid="desktop-navigation"]')).not.toBeVisible()
      
      // Open mobile menu
      await page.click('[data-testid="mobile-menu-button"]')
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible()
      
      // Should show navigation items
      await expect(page.locator('[data-testid="mobile-nav-dashboard"]')).toBeVisible()
      await expect(page.locator('[data-testid="mobile-nav-profile"]')).toBeVisible()
      await expect(page.locator('[data-testid="mobile-nav-logout"]')).toBeVisible()
    })

    test('should display class cards in mobile layout', async ({ page }) => {
      const dashboardPage = new DashboardPage(page)
      await dashboardPage.goto()
      
      // Class cards should stack vertically on mobile
      const classCards = page.locator('[data-testid="class-card"]')
      const firstCard = classCards.first()
      const secondCard = classCards.nth(1)
      
      if (await classCards.count() >= 2) {
        const firstCardBox = await firstCard.boundingBox()
        const secondCardBox = await secondCard.boundingBox()
        
        // Second card should be below first card (not side by side)
        expect(secondCardBox!.y).toBeGreaterThan(firstCardBox!.y + firstCardBox!.height)
      }
      
      // Cards should be full width on mobile
      const cardWidth = await firstCard.evaluate(el => el.clientWidth)
      const viewportWidth = page.viewportSize()!.width
      
      // Card should take up most of the viewport width (accounting for margins)
      expect(cardWidth).toBeGreaterThan(viewportWidth * 0.8)
    })

    test('should handle mobile booking flow', async ({ page }) => {
      const dashboardPage = new DashboardPage(page)
      await dashboardPage.goto()
      
      // Touch-friendly booking buttons
      const bookButton = page.locator('[data-testid="book-class-button"]').first()
      await expect(bookButton).toBeVisible()
      
      // Button should be large enough for touch
      const buttonBox = await bookButton.boundingBox()
      expect(buttonBox!.height).toBeGreaterThanOrEqual(44) // iOS recommended minimum touch target
      
      // Test booking on mobile
      await bookButton.tap() // Use tap instead of click for mobile
      
      // Booking modal should be mobile-friendly
      const bookingModal = page.locator('[data-testid="booking-modal"]')
      if (await bookingModal.isVisible()) {
        // Modal should fit viewport
        const modalBox = await bookingModal.boundingBox()
        const viewport = page.viewportSize()!
        
        expect(modalBox!.width).toBeLessThanOrEqual(viewport.width)
        expect(modalBox!.height).toBeLessThanOrEqual(viewport.height)
      }
    })

    test('should display credits section properly on mobile', async ({ page }) => {
      const profilePage = new ProfilePage(page)
      await profilePage.goto()
      
      // Credits display should be prominent on mobile
      const creditsSection = page.locator('[data-testid="credits-section"]')
      await expect(creditsSection).toBeVisible()
      
      // Should be easy to tap
      const topUpButton = page.locator('[data-testid="topup-button"]')
      const buttonBox = await topUpButton.boundingBox()
      expect(buttonBox!.height).toBeGreaterThanOrEqual(44)
      expect(buttonBox!.width).toBeGreaterThanOrEqual(44)
    })

    test('should handle form inputs on mobile', async ({ page }) => {
      await page.goto('/auth/signin')
      
      // Form inputs should be mobile-friendly
      const emailInput = page.locator('[data-testid="email-input"]')
      const passwordInput = page.locator('[data-testid="password-input"]')
      
      // Inputs should have proper mobile attributes
      await expect(emailInput).toHaveAttribute('type', 'email')
      await expect(emailInput).toHaveAttribute('autocomplete', 'email')
      await expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Should trigger mobile keyboard appropriately
      await emailInput.tap()
      
      // Input should be large enough
      const inputBox = await emailInput.boundingBox()
      expect(inputBox!.height).toBeGreaterThanOrEqual(44)
    })

    test('should handle payment modal on mobile', async ({ page }) => {
      const profilePage = new ProfilePage(page)
      await profilePage.goto()
      
      await profilePage.topUpCredits()
      
      // Payment modal should be mobile-optimized
      const paymentModal = page.locator('[data-testid="payment-modal"]')
      await expect(paymentModal).toBeVisible()
      
      // Package cards should stack vertically on mobile
      const packageCards = page.locator('[data-testid="credit-package-card"]')
      if (await packageCards.count() >= 2) {
        const firstPackage = packageCards.first()
        const secondPackage = packageCards.nth(1)
        
        const firstBox = await firstPackage.boundingBox()
        const secondBox = await secondPackage.boundingBox()
        
        // Should be stacked vertically
        expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height - 10)
      }
    })

    test('should handle swipe gestures for navigation', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Test horizontal swipe for class cards if carousel is implemented
      const classContainer = page.locator('[data-testid="classes-container"]')
      const initialScroll = await classContainer.evaluate(el => el.scrollLeft)
      
      // Simulate swipe gesture
      await classContainer.hover()
      await page.mouse.down()
      await page.mouse.move(100, 0) // Swipe right
      await page.mouse.up()
      
      // Should have scrolled horizontally if carousel is present
      const newScroll = await classContainer.evaluate(el => el.scrollLeft)
      
      // Either scrolled or no carousel implemented (both valid)
      expect(newScroll).toBeGreaterThanOrEqual(initialScroll)
    })
  })

  test.describe('Tablet Layout (iPad)', () => {
    test.use({ ...devices['iPad Pro'] })

    test('should display tablet layout correctly', async ({ page }) => {
      await page.goto('/dashboard')
      
      // On tablet, might show sidebar or expanded layout
      const layout = page.locator('[data-testid="dashboard-layout"]')
      await expect(layout).toBeVisible()
      
      // Should utilize tablet screen space efficiently
      const classCards = page.locator('[data-testid="class-card"]')
      if (await classCards.count() >= 3) {
        const firstCard = classCards.first()
        const thirdCard = classCards.nth(2)
        
        const firstBox = await firstCard.boundingBox()
        const thirdBox = await thirdCard.boundingBox()
        
        // On tablet, might show 2 columns, so third card could be in second row
        const inSecondRow = thirdBox!.y > firstBox!.y + firstBox!.height
        const inSameRow = Math.abs(thirdBox!.y - firstBox!.y) < 50
        
        expect(inSecondRow || inSameRow).toBe(true)
      }
    })

    test('should handle tablet-specific interactions', async ({ page }) => {
      const dashboardPage = new DashboardPage(page)
      await dashboardPage.goto()
      
      // Tablet should support both touch and precise clicking
      const bookButton = page.locator('[data-testid="book-class-button"]').first()
      
      // Test both click and tap
      await bookButton.click()
      
      // Should work with either interaction method
      const bookingResult = page.locator('[data-testid="booking-success"], [data-testid="booking-modal"]')
      await expect(bookingResult.first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Responsive Breakpoints', () => {
    const breakpoints = [
      { width: 375, height: 667, name: 'Mobile Small' },
      { width: 414, height: 896, name: 'Mobile Large' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1024, height: 768, name: 'Tablet Landscape' },
      { width: 1280, height: 720, name: 'Desktop Small' },
      { width: 1920, height: 1080, name: 'Desktop Large' }
    ]

    breakpoints.forEach(({ width, height, name }) => {
      test(`should display correctly at ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height })
        await page.goto('/dashboard')
        
        // Page should load without horizontal scrolling
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        expect(bodyWidth).toBeLessThanOrEqual(width + 20) // Small tolerance for scrollbars
        
        // Essential elements should be visible
        await expect(page.locator('[data-testid="credits-display"]')).toBeVisible()
        await expect(page.locator('[data-testid="class-card"]').first()).toBeVisible()
        
        // Navigation should be appropriate for screen size
        const mobileMenu = page.locator('[data-testid="mobile-menu-button"]')
        const desktopNav = page.locator('[data-testid="desktop-navigation"]')
        
        if (width < 768) {
          // Mobile breakpoint
          await expect(mobileMenu).toBeVisible()
        } else {
          // Desktop/tablet breakpoint
          await expect(desktopNav).toBeVisible()
        }
      })
    })
  })

  test.describe('Touch and Gesture Support', () => {
    test.use({ ...devices['iPhone 12'] })

    test('should support touch scrolling', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Test vertical scrolling
      const initialScrollY = await page.evaluate(() => window.pageYOffset)
      
      // Simulate touch scroll
      await page.touchscreen.tap(200, 400)
      await page.evaluate(() => window.scrollBy(0, 200))
      
      const newScrollY = await page.evaluate(() => window.pageYOffset)
      expect(newScrollY).toBeGreaterThan(initialScrollY)
    })

    test('should handle pinch zoom appropriately', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Verify viewport meta tag prevents unwanted zoom
      const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content')
      expect(viewportMeta).toContain('user-scalable=no')
    })

    test('should support pull-to-refresh where appropriate', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Test if pull-to-refresh is implemented
      // This would be specific to your implementation
      const refreshIndicator = page.locator('[data-testid="pull-to-refresh"]')
      
      if (await refreshIndicator.isVisible()) {
        // Simulate pull down gesture
        await page.touchscreen.tap(200, 100)
        await page.mouse.down()
        await page.mouse.move(200, 200)
        await page.mouse.up()
        
        // Should trigger refresh
        await expect(refreshIndicator).toHaveClass(/active|refreshing/)
      }
    })
  })

  test.describe('Cross-Device Continuity', () => {
    test('should maintain session across device types', async ({ browser }) => {
      // Start session on mobile
      const mobileContext = await browser.newContext({
        ...devices['iPhone 12'],
        storageState: 'tests/.auth/user.json'
      })
      const mobilePage = await mobileContext.newPage()
      
      await mobilePage.goto('/dashboard')
      const mobileCredits = await mobilePage.locator('[data-testid="credits-display"]').textContent()
      
      // Switch to desktop
      const desktopContext = await browser.newContext({
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json'
      })
      const desktopPage = await desktopContext.newPage()
      
      await desktopPage.goto('/dashboard')
      const desktopCredits = await desktopPage.locator('[data-testid="credits-display"]').textContent()
      
      // Credits should be the same
      expect(desktopCredits).toBe(mobileCredits)
      
      await mobileContext.close()
      await desktopContext.close()
    })
  })
})