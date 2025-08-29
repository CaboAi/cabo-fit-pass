import { Page, Locator, expect } from '@playwright/test'

/**
 * Base Page Object with common functionality
 */
export class BasePage {
  constructor(protected page: Page) {}

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` })
  }
}

/**
 * Dashboard Page Object
 */
export class DashboardPage extends BasePage {
  readonly classCards: Locator
  readonly creditDisplay: Locator
  readonly bookingButton: Locator

  constructor(page: Page) {
    super(page)
    this.classCards = page.locator('[data-testid="class-card"]')
    this.creditDisplay = page.locator('[data-testid="credits-display"]')
    this.bookingButton = page.locator('[data-testid="book-class-button"]')
  }

  async goto() {
    await this.page.goto('/dashboard')
    await this.waitForPageLoad()
    await expect(this.page.locator('h1')).toContainText('Available Classes')
  }

  async getClassCards() {
    await expect(this.classCards.first()).toBeVisible()
    return await this.classCards.all()
  }

  async bookClass(classIndex: number = 0) {
    const classCard = this.classCards.nth(classIndex)
    await expect(classCard).toBeVisible()
    
    // Click book button within the specific class card
    await classCard.locator('[data-testid="book-class-button"]').click()
    
    // Wait for booking confirmation or modal
    await this.page.waitForSelector('[data-testid="booking-success"]', { timeout: 10000 })
  }

  async getCurrentCredits(): Promise<number> {
    await expect(this.creditDisplay).toBeVisible()
    const creditsText = await this.creditDisplay.textContent()
    return parseInt(creditsText?.match(/\d+/)?.[0] || '0')
  }

  async waitForBookingSuccess() {
    await expect(this.page.locator('[data-testid="booking-success"]')).toBeVisible()
  }

  async waitForBookingError() {
    await expect(this.page.locator('[data-testid="booking-error"]')).toBeVisible()
  }

  async getBookingErrorMessage(): Promise<string> {
    await this.waitForBookingError()
    return await this.page.locator('[data-testid="booking-error-message"]').textContent() || ''
  }
}

/**
 * Profile Page Object
 */
export class ProfilePage extends BasePage {
  readonly creditsBalance: Locator
  readonly topUpButton: Locator
  readonly membershipDetails: Locator

  constructor(page: Page) {
    super(page)
    this.creditsBalance = page.locator('[data-testid="credits-balance"]')
    this.topUpButton = page.locator('[data-testid="topup-button"]')
    this.membershipDetails = page.locator('[data-testid="membership-details"]')
  }

  async goto() {
    await this.page.goto('/profile')
    await this.waitForPageLoad()
  }

  async getCreditsBalance(): Promise<number> {
    await expect(this.creditsBalance).toBeVisible()
    const creditsText = await this.creditsBalance.textContent()
    return parseInt(creditsText?.match(/\d+/)?.[0] || '0')
  }

  async topUpCredits() {
    await this.topUpButton.click()
    
    // This would open the payment modal or redirect to payment page
    // Implementation depends on your payment flow
    await expect(this.page.locator('[data-testid="payment-modal"]')).toBeVisible()
  }
}

/**
 * Admin Gym Management Page Object
 */
export class AdminGymPage extends BasePage {
  readonly gymList: Locator
  readonly addGymButton: Locator
  readonly gymCard: Locator

  constructor(page: Page) {
    super(page)
    this.gymList = page.locator('[data-testid="gym-list"]')
    this.addGymButton = page.locator('[data-testid="add-gym-button"]')
    this.gymCard = page.locator('[data-testid="gym-card"]')
  }

  async goto() {
    await this.page.goto('/admin/gyms')
    await this.waitForPageLoad()
    await expect(this.page.locator('h1')).toContainText('Gym Management')
  }

  async addNewGym(gymData: { name: string; location: string; description?: string }) {
    await this.addGymButton.click()
    
    // Fill in gym details
    await this.page.fill('[data-testid="gym-name-input"]', gymData.name)
    await this.page.fill('[data-testid="gym-location-input"]', gymData.location)
    
    if (gymData.description) {
      await this.page.fill('[data-testid="gym-description-input"]', gymData.description)
    }
    
    // Submit form
    await this.page.click('[data-testid="save-gym-button"]')
    
    // Wait for success confirmation
    await expect(this.page.locator('[data-testid="gym-saved-success"]')).toBeVisible()
  }

  async getGymCount(): Promise<number> {
    await expect(this.gymList).toBeVisible()
    const gymCards = await this.gymCard.all()
    return gymCards.length
  }

  async editGym(gymIndex: number, newData: { name?: string; location?: string }) {
    const gym = this.gymCard.nth(gymIndex)
    await gym.locator('[data-testid="edit-gym-button"]').click()
    
    if (newData.name) {
      await this.page.fill('[data-testid="gym-name-input"]', newData.name)
    }
    
    if (newData.location) {
      await this.page.fill('[data-testid="gym-location-input"]', newData.location)
    }
    
    await this.page.click('[data-testid="save-gym-button"]')
    await expect(this.page.locator('[data-testid="gym-updated-success"]')).toBeVisible()
  }
}

/**
 * Payment Modal Page Object
 */
export class PaymentModal extends BasePage {
  readonly modal: Locator
  readonly packageCards: Locator
  readonly checkoutButton: Locator

  constructor(page: Page) {
    super(page)
    this.modal = page.locator('[data-testid="payment-modal"]')
    this.packageCards = page.locator('[data-testid="credit-package-card"]')
    this.checkoutButton = page.locator('[data-testid="checkout-button"]')
  }

  async isVisible(): Promise<boolean> {
    try {
      await expect(this.modal).toBeVisible({ timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  async selectPackage(packageIndex: number = 0) {
    const packageCard = this.packageCards.nth(packageIndex)
    await expect(packageCard).toBeVisible()
    await packageCard.click()
    
    // Verify package is selected
    await expect(packageCard).toHaveClass(/selected|active/)
  }

  async proceedToCheckout() {
    await expect(this.checkoutButton).toBeEnabled()
    await this.checkoutButton.click()
    
    // This might redirect to Stripe or another payment provider
    // In test environment, we might mock this or use Stripe test mode
  }

  async close() {
    await this.page.locator('[data-testid="close-modal"]').click()
    await expect(this.modal).not.toBeVisible()
  }
}

/**
 * Toast Notification Helper
 */
export class ToastHelper extends BasePage {
  readonly toastContainer: Locator
  readonly successToast: Locator
  readonly errorToast: Locator

  constructor(page: Page) {
    super(page)
    this.toastContainer = page.locator('[data-testid="toast-container"]')
    this.successToast = page.locator('[data-testid="toast-success"]')
    this.errorToast = page.locator('[data-testid="toast-error"]')
  }

  async waitForSuccessToast(message?: string) {
    await expect(this.successToast).toBeVisible({ timeout: 5000 })
    
    if (message) {
      await expect(this.successToast).toContainText(message)
    }
  }

  async waitForErrorToast(message?: string) {
    await expect(this.errorToast).toBeVisible({ timeout: 5000 })
    
    if (message) {
      await expect(this.errorToast).toContainText(message)
    }
  }

  async dismissToast() {
    // Click the dismiss button or wait for auto-dismiss
    try {
      await this.page.locator('[data-testid="toast-dismiss"]').click()
    } catch {
      // Auto-dismiss, wait for it to disappear
      await expect(this.toastContainer).not.toBeVisible({ timeout: 10000 })
    }
  }
}