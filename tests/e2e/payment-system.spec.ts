import { test, expect } from '@playwright/test'
import { ProfilePage, PaymentModal, ToastHelper } from '../helpers/page-objects'
import { AuthHelper, TEST_USERS } from '../helpers/auth-helpers'

test.describe('Payment and Credit System', () => {
  let profilePage: ProfilePage
  let paymentModal: PaymentModal
  let toastHelper: ToastHelper
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page)
    paymentModal = new PaymentModal(page)
    toastHelper = new ToastHelper(page)
    authHelper = new AuthHelper(page)
  })

  test('should display current credit balance', async ({ page }) => {
    await profilePage.goto()
    
    // Should show credits section
    await expect(page.locator('[data-testid="credits-section"]')).toBeVisible()
    
    // Should display current balance
    const creditsBalance = await profilePage.getCreditsBalance()
    expect(creditsBalance).toBeGreaterThanOrEqual(0)
    
    // Should show credit history if available
    const creditHistory = page.locator('[data-testid="credit-history"]')
    if (await creditHistory.isVisible()) {
      await expect(creditHistory.locator('[data-testid="credit-transaction"]').first()).toBeVisible()
    }
  })

  test('should open credit top-up modal', async ({ page }) => {
    await profilePage.goto()
    
    // Click top-up button
    await profilePage.topUpCredits()
    
    // Should show payment modal
    expect(await paymentModal.isVisible()).toBe(true)
    
    // Should show available packages
    const packageCards = page.locator('[data-testid="credit-package-card"]')
    const packageCount = await packageCards.count()
    expect(packageCount).toBeGreaterThan(0)
    
    // Verify package information
    const firstPackage = packageCards.first()
    await expect(firstPackage.locator('[data-testid="package-credits"]')).toBeVisible()
    await expect(firstPackage.locator('[data-testid="package-price"]')).toBeVisible()
    await expect(firstPackage.locator('[data-testid="package-savings"]')).toBeVisible()
  })

  test('should handle credit package selection', async ({ page }) => {
    await profilePage.goto()
    await profilePage.topUpCredits()
    
    // Select a package
    await paymentModal.selectPackage(1) // Select second package
    
    // Verify package is selected
    const selectedPackage = page.locator('[data-testid="credit-package-card"].selected')
    await expect(selectedPackage).toBeVisible()
    
    // Checkout button should be enabled
    await expect(page.locator('[data-testid="checkout-button"]')).toBeEnabled()
  })

  test('should handle Stripe checkout flow (test mode)', async ({ page }) => {
    await profilePage.goto()
    
    const initialCredits = await profilePage.getCreditsBalance()
    
    await profilePage.topUpCredits()
    await paymentModal.selectPackage(0) // Select starter package
    
    // Mock Stripe checkout for testing
    await page.route('**/api/checkout/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 'cs_test_mock_session_id',
          url: 'https://checkout.stripe.com/test-session'
        })
      })
    })
    
    await paymentModal.proceedToCheckout()
    
    // In test environment, mock successful payment
    await page.route('**/api/confirm-payment', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          creditsAdded: 12,
          newBalance: initialCredits + 12
        })
      })
    })
    
    // Simulate returning from Stripe with success
    await page.goto('/profile?payment=success&session_id=cs_test_mock_session_id')
    
    // Should show payment success
    await toastHelper.waitForSuccessToast('Payment successful')
    
    // Credits should be updated
    const newCredits = await profilePage.getCreditsBalance()
    expect(newCredits).toBe(initialCredits + 12)
  })

  test('should handle payment failures gracefully', async ({ page }) => {
    await profilePage.goto()
    await profilePage.topUpCredits()
    await paymentModal.selectPackage(0)
    
    // Mock payment failure
    await page.route('**/api/checkout/session', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Payment failed' })
      })
    })
    
    await paymentModal.proceedToCheckout()
    
    // Should show error message
    await toastHelper.waitForErrorToast('Payment failed')
    
    // Modal should remain open for retry
    expect(await paymentModal.isVisible()).toBe(true)
  })

  test('should display credit transaction history', async ({ page }) => {
    await profilePage.goto()
    
    // Navigate to credit history tab
    await page.click('[data-testid="credit-history-tab"]')
    
    // Should show transaction history
    await expect(page.locator('[data-testid="credit-history-list"]')).toBeVisible()
    
    const transactions = page.locator('[data-testid="credit-transaction"]')
    const transactionCount = await transactions.count()
    
    if (transactionCount > 0) {
      // Verify transaction details
      const firstTransaction = transactions.first()
      await expect(firstTransaction.locator('[data-testid="transaction-date"]')).toBeVisible()
      await expect(firstTransaction.locator('[data-testid="transaction-type"]')).toBeVisible()
      await expect(firstTransaction.locator('[data-testid="transaction-amount"]')).toBeVisible()
      await expect(firstTransaction.locator('[data-testid="transaction-description"]')).toBeVisible()
    }
  })

  test('should handle subscription upgrades', async ({ page }) => {
    await page.goto('/pricing')
    
    // Should show subscription tiers
    await expect(page.locator('[data-testid="pricing-tiers"]')).toBeVisible()
    
    const tierCards = page.locator('[data-testid="tier-card"]')
    const tierCount = await tierCards.count()
    expect(tierCount).toBeGreaterThan(0)
    
    // Select a premium tier
    const premiumTier = tierCards.filter({ hasText: /premium|pro/i }).first()
    
    if (await premiumTier.count() > 0) {
      await premiumTier.locator('[data-testid="select-tier-button"]').click()
      
      // Should proceed to subscription checkout
      await expect(page.locator('[data-testid="subscription-checkout"]')).toBeVisible()
      
      // Mock subscription creation
      await page.route('**/api/subscriptions/create', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            subscriptionId: 'sub_test_mock_id'
          })
        })
      })
      
      await page.click('[data-testid="confirm-subscription-button"]')
      
      // Should show subscription success
      await toastHelper.waitForSuccessToast('Subscription updated')
    } else {
      test.skip(true, 'No premium tiers available for testing')
    }
  })

  test('should handle tourist pass purchase', async ({ page }) => {
    await page.goto('/pricing')
    
    // Look for tourist pass options
    const touristPass = page.locator('[data-testid="tourist-pass-card"]')
    
    if (await touristPass.count() > 0) {
      await touristPass.first().locator('[data-testid="buy-tourist-pass"]').click()
      
      // Should show tourist pass checkout
      await expect(page.locator('[data-testid="tourist-pass-checkout"]')).toBeVisible()
      
      // Mock tourist pass purchase
      await page.route('**/api/tourist-pass/purchase', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            passId: 'tp_test_mock_id',
            credits: 3,
            validDays: 7
          })
        })
      })
      
      await page.click('[data-testid="confirm-tourist-pass-button"]')
      
      // Should show purchase success
      await toastHelper.waitForSuccessToast('Tourist pass purchased')
      
      // Should redirect to dashboard with new credits
      await page.waitForURL('/dashboard')
    } else {
      test.skip(true, 'Tourist pass not available for testing')
    }
  })

  test('should handle corporate account features', async ({ page }) => {
    // This test would require a corporate account setup
    // Mock corporate account detection
    await page.addInitScript(() => {
      window.localStorage.setItem('user_type', 'corporate')
    })
    
    await page.goto('/corporate')
    
    // Should show corporate dashboard
    await expect(page.locator('[data-testid="corporate-dashboard"]')).toBeVisible()
    
    // Should show bulk credit purchase options
    await expect(page.locator('[data-testid="bulk-credit-options"]')).toBeVisible()
    
    // Should show employee management
    await expect(page.locator('[data-testid="employee-management"]')).toBeVisible()
    
    // Test bulk credit purchase
    await page.click('[data-testid="bulk-purchase-button"]')
    await page.fill('[data-testid="bulk-credits-input"]', '100')
    await page.fill('[data-testid="employee-count-input"]', '10')
    
    // Mock bulk purchase
    await page.route('**/api/corporate/*/purchase-credits', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          creditsAllocated: 100,
          employeeCount: 10
        })
      })
    })
    
    await page.click('[data-testid="confirm-bulk-purchase"]')
    
    // Should show bulk purchase success
    await toastHelper.waitForSuccessToast('Bulk credits purchased')
  })

  test('should handle refund processing', async ({ page }) => {
    await profilePage.goto()
    
    // Navigate to transaction history
    await page.click('[data-testid="credit-history-tab"]')
    
    // Find a recent purchase transaction
    const purchaseTransaction = page.locator('[data-testid="credit-transaction"]')
      .filter({ hasText: /purchase|bought/i })
      .first()
    
    if (await purchaseTransaction.count() > 0) {
      // Request refund
      await purchaseTransaction.locator('[data-testid="request-refund-button"]').click()
      
      // Fill refund reason
      await page.fill('[data-testid="refund-reason"]', 'Testing refund process')
      
      // Mock refund request
      await page.route('**/api/refunds/request', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            refundId: 'rf_test_mock_id',
            status: 'pending'
          })
        })
      })
      
      await page.click('[data-testid="submit-refund-request"]')
      
      // Should show refund request success
      await toastHelper.waitForSuccessToast('Refund request submitted')
      
      // Transaction should show refund pending status
      await expect(purchaseTransaction.locator('[data-testid="refund-status"]'))
        .toContainText('Refund Pending')
    } else {
      test.skip(true, 'No purchase transactions available for refund testing')
    }
  })

  test('should validate payment security measures', async ({ page }) => {
    await profilePage.goto()
    await profilePage.topUpCredits()
    
    // Verify secure payment indicators
    await expect(page.locator('[data-testid="secure-payment-badge"]')).toBeVisible()
    await expect(page.locator('[data-testid="ssl-indicator"]')).toBeVisible()
    
    // Check that sensitive data is not exposed
    const pageContent = await page.content()
    
    // Should not contain test API keys or sensitive data
    expect(pageContent).not.toContain('sk_test_')
    expect(pageContent).not.toContain('sk_live_')
    expect(pageContent).not.toContain('rk_test_')
    
    // Should use HTTPS for payment endpoints
    await page.route('**/api/checkout/**', route => {
      expect(route.request().url()).toMatch(/^https:/)
      route.continue()
    })
  })

  test('should handle payment method management', async ({ page }) => {
    await page.goto('/profile/payment-methods')
    
    // Should show payment method management
    await expect(page.locator('[data-testid="payment-methods-list"]')).toBeVisible()
    
    // Should be able to add new payment method
    await page.click('[data-testid="add-payment-method"]')
    
    // Should show Stripe Elements or payment form
    await expect(page.locator('[data-testid="payment-method-form"]')).toBeVisible()
    
    // Mock adding payment method
    await page.route('**/api/payment-methods/add', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          paymentMethodId: 'pm_test_mock_id'
        })
      })
    })
    
    // In real test, this would interact with Stripe Elements
    // For now, just simulate success
    await page.click('[data-testid="save-payment-method"]')
    
    // Should show payment method added
    await toastHelper.waitForSuccessToast('Payment method added')
  })
})