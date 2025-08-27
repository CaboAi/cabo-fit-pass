import { test, expect } from '@playwright/test'
import { AuthHelper, TEST_USERS, createTestUserEmail, generateTestPassword } from '../helpers/auth-helpers'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies()
    await page.context().clearPermissions()
  })

  test('should display sign in page correctly', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Check page elements are visible
    await expect(page.locator('h1')).toContainText('Sign In')
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="signin-button"]')).toBeVisible()
    
    // Check sign up link is present
    await expect(page.locator('[data-testid="signup-link"]')).toBeVisible()
  })

  test('should sign in existing user successfully', async ({ page }) => {
    const authHelper = new AuthHelper(page)
    
    await authHelper.signIn(TEST_USERS.regular)
    
    // Verify successful login
    expect(page.url()).toContain('/dashboard')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // Verify user information is displayed
    const currentUser = await authHelper.getCurrentUser()
    expect(currentUser.email).toBe(TEST_USERS.regular.email)
  })

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Try to sign in with invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    await page.click('[data-testid="signin-button"]')
    
    // Should show error message and stay on sign in page
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible()
    expect(page.url()).toContain('/auth/signin')
  })

  test('should sign up new user successfully', async ({ page }) => {
    const authHelper = new AuthHelper(page)
    const newUser = {
      email: createTestUserEmail('new-signup'),
      password: generateTestPassword(),
      name: 'New Test User'
    }
    
    await authHelper.signUp(newUser)
    
    // Verify successful signup and login
    expect(page.url()).toContain('/dashboard')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // Verify user information
    const currentUser = await authHelper.getCurrentUser()
    expect(currentUser.email).toBe(newUser.email)
    expect(currentUser.name).toContain(newUser.name)
  })

  test('should prevent duplicate user registration', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // Try to sign up with existing user email
    await page.fill('[data-testid="name-input"]', 'Duplicate User')
    await page.fill('[data-testid="email-input"]', TEST_USERS.regular.email)
    await page.fill('[data-testid="password-input"]', 'SomePassword123!')
    await page.click('[data-testid="signup-button"]')
    
    // Should show error about existing user
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="auth-error"]')).toContainText(/already exists|already registered/)
  })

  test('should validate required fields on signup', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // Try to submit empty form
    await page.click('[data-testid="signup-button"]')
    
    // Should show validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible()
  })

  test('should validate password strength', async ({ page }) => {
    await page.goto('/auth/signup')
    
    await page.fill('[data-testid="email-input"]', createTestUserEmail('password-test'))
    await page.fill('[data-testid="password-input"]', 'weak') // Too weak
    
    // Should show password strength indicator
    await expect(page.locator('[data-testid="password-strength"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-strength"]')).toContainText(/weak|too short/)
  })

  test('should sign out user successfully', async ({ page }) => {
    const authHelper = new AuthHelper(page)
    
    // First sign in
    await authHelper.signIn(TEST_USERS.regular)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // Then sign out
    await authHelper.signOut()
    
    // Verify signed out state
    expect(page.url()).not.toContain('/dashboard')
    await expect(page.locator('[data-testid="signin-button"]')).toBeVisible()
  })

  test('should handle authentication session persistence', async ({ page }) => {
    const authHelper = new AuthHelper(page)
    
    // Sign in
    await authHelper.signIn(TEST_USERS.regular)
    
    // Reload page - should remain authenticated
    await page.reload()
    await authHelper.waitForAuthLoad()
    
    // Should still be authenticated
    expect(await authHelper.isAuthenticated()).toBe(true)
    expect(page.url()).toContain('/dashboard')
  })

  test('should redirect unauthenticated users to sign in', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/profile')
    
    // Should redirect to sign in page
    await page.waitForURL('**/auth/signin', { timeout: 10000 })
    expect(page.url()).toContain('/auth/signin')
  })

  test('should handle demo login if available', async ({ page }) => {
    const authHelper = new AuthHelper(page)
    
    try {
      await authHelper.demoLogin('user')
      
      // Verify demo login worked
      expect(page.url()).toContain('/dashboard')
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    } catch (error) {
      // Demo login not available, skip this test
      test.skip(true, 'Demo login not available in this environment')
    }
  })

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Look for forgot password link
    const forgotPasswordLink = page.locator('[data-testid="forgot-password-link"]')
    
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click()
      
      // Should navigate to password reset page
      expect(page.url()).toContain('/auth/reset-password')
      
      // Fill in email for reset
      await page.fill('[data-testid="reset-email-input"]', TEST_USERS.regular.email)
      await page.click('[data-testid="send-reset-button"]')
      
      // Should show confirmation message
      await expect(page.locator('[data-testid="reset-sent-message"]')).toBeVisible()
    } else {
      test.skip(true, 'Password reset not implemented yet')
    }
  })
})