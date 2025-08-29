import { Page, expect } from '@playwright/test'

export interface TestUser {
  email: string
  password: string
  name?: string
  role?: 'user' | 'admin'
}

export const TEST_USERS = {
  regular: {
    email: 'test-user@cabofit.com',
    password: 'Test123!@#',
    name: 'Test User',
    role: 'user' as const
  },
  admin: {
    email: 'admin@cabofit.com',
    password: 'Admin123!@#',
    name: 'Admin User',
    role: 'admin' as const
  },
  newUser: {
    email: `new-user-${Date.now()}@cabofit.com`,
    password: 'NewUser123!@#',
    name: 'New Test User',
    role: 'user' as const
  }
} as const

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Sign in an existing user
   */
  async signIn(user: TestUser) {
    await this.page.goto('/auth/signin')
    
    // Wait for the form to be visible
    await expect(this.page.locator('[data-testid="signin-form"]')).toBeVisible()
    
    // Fill in credentials
    await this.page.fill('[data-testid="email-input"]', user.email)
    await this.page.fill('[data-testid="password-input"]', user.password)
    
    // Submit form
    await this.page.click('[data-testid="signin-button"]')
    
    // Wait for successful redirect
    await this.page.waitForURL('/dashboard', { timeout: 10000 })
    
    // Verify we're logged in by checking for user-specific content
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible()
  }

  /**
   * Sign up a new user
   */
  async signUp(user: TestUser) {
    await this.page.goto('/auth/signup')
    
    // Wait for the form to be visible
    await expect(this.page.locator('[data-testid="signup-form"]')).toBeVisible()
    
    // Fill in registration form
    if (user.name) {
      await this.page.fill('[data-testid="name-input"]', user.name)
    }
    await this.page.fill('[data-testid="email-input"]', user.email)
    await this.page.fill('[data-testid="password-input"]', user.password)
    
    // Submit form
    await this.page.click('[data-testid="signup-button"]')
    
    // Wait for successful redirect (might go to dashboard or onboarding)
    await this.page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 10000 })
    
    // Verify we're logged in
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible()
  }

  /**
   * Sign out current user
   */
  async signOut() {
    // Open user menu
    await this.page.click('[data-testid="user-menu"]')
    
    // Click sign out
    await this.page.click('[data-testid="signout-button"]')
    
    // Wait for redirect to home or sign in page
    await this.page.waitForURL(/\/(|auth\/signin)/, { timeout: 5000 })
    
    // Verify we're logged out
    await expect(this.page.locator('[data-testid="signin-button"]')).toBeVisible()
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 2000 })
      return true
    } catch {
      return false
    }
  }

  /**
   * Get current user information from the UI
   */
  async getCurrentUser() {
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // Open user menu to access user info
    await this.page.click('[data-testid="user-menu"]')
    
    const email = await this.page.textContent('[data-testid="user-email"]')
    const name = await this.page.textContent('[data-testid="user-name"]')
    
    // Close menu by clicking elsewhere
    await this.page.click('body')
    
    return { email, name }
  }

  /**
   * Wait for authentication state to load
   */
  async waitForAuthLoad() {
    // Wait for either authenticated or unauthenticated state
    await this.page.waitForFunction(() => {
      // Check if we have a user menu (authenticated) or sign in button (unauthenticated)
      const userMenu = document.querySelector('[data-testid="user-menu"]')
      const signInButton = document.querySelector('[data-testid="signin-button"]')
      return userMenu !== null || signInButton !== null
    }, { timeout: 10000 })
  }

  /**
   * Handle demo login for testing
   */
  async demoLogin(role: 'user' | 'admin' = 'user') {
    await this.page.goto('/auth/signin')
    
    // Look for demo login buttons
    const demoButtonSelector = role === 'admin' 
      ? '[data-testid="demo-admin-button"]'
      : '[data-testid="demo-user-button"]'
    
    try {
      await this.page.click(demoButtonSelector, { timeout: 5000 })
      await this.page.waitForURL('/dashboard', { timeout: 10000 })
      await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible()
    } catch (error) {
      // If demo buttons don't exist, fall back to regular auth
      const testUser = role === 'admin' ? TEST_USERS.admin : TEST_USERS.regular
      await this.signIn(testUser)
    }
  }

  /**
   * Ensure user has sufficient credits for testing
   */
  async ensureCredits(minCredits: number = 10) {
    await this.page.goto('/profile')
    
    // Check current credit balance
    const creditsElement = this.page.locator('[data-testid="credits-balance"]')
    await expect(creditsElement).toBeVisible()
    
    const creditsText = await creditsElement.textContent()
    const currentCredits = parseInt(creditsText?.match(/\d+/)?.[0] || '0')
    
    if (currentCredits < minCredits) {
      // Need to add credits - this might involve payment flow
      console.warn(`User has ${currentCredits} credits, but test needs ${minCredits}. Consider adding test credits.`)
      
      // For testing, we might need to use a test API endpoint to add credits
      // This would be implemented based on your backend testing setup
    }
    
    return currentCredits
  }
}

/**
 * Create a unique test user email
 */
export function createTestUserEmail(prefix: string = 'test-user'): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `${prefix}-${timestamp}-${random}@cabofit.test`
}

/**
 * Generate a test password
 */
export function generateTestPassword(): string {
  return 'TestPassword123!@#'
}

/**
 * Wait for and handle any authentication redirects
 */
export async function waitForAuthRedirect(page: Page, expectedPath: string = '/dashboard') {
  try {
    await page.waitForURL(expectedPath, { timeout: 10000 })
  } catch (error) {
    // If we don't get the expected redirect, check what page we're on
    const currentUrl = page.url()
    console.warn(`Expected redirect to ${expectedPath}, but got ${currentUrl}`)
    
    // Handle common redirect scenarios
    if (currentUrl.includes('/auth/signin')) {
      throw new Error('Authentication failed - redirected to sign in page')
    } else if (currentUrl.includes('/auth/callback')) {
      // Still processing auth callback, wait a bit more
      await page.waitForURL(expectedPath, { timeout: 5000 })
    }
  }
}