import { test, expect } from '@playwright/test'
import { DashboardPage, ProfilePage } from '../helpers/page-objects'

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable accessibility testing
    await page.addInitScript(() => {
      // Add axe-core for automated accessibility testing
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/axe-core@4.7.0/axe.min.js'
      document.head.appendChild(script)
    })
  })

  test('should meet WCAG 2.1 AA standards on dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Run axe accessibility audit
    const accessibilityResults = await page.evaluate(async () => {
      // @ts-ignore - axe is loaded via script
      return await axe.run()
    })
    
    // Should have no violations
    expect(accessibilityResults.violations).toHaveLength(0)
    
    // Log any violations for debugging
    if (accessibilityResults.violations.length > 0) {
      console.log('Accessibility violations:', accessibilityResults.violations)
    }
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check heading hierarchy (h1 -> h2 -> h3, etc.)
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    const headingLevels = await Promise.all(
      headings.map(async (heading) => {
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase())
        return parseInt(tagName.replace('h', ''))
      })
    )
    
    // Should start with h1
    expect(headingLevels[0]).toBe(1)
    
    // Check for proper hierarchy (no skipping levels)
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i]
      const previousLevel = headingLevels[i - 1]
      
      // Heading level should not skip more than 1 level
      expect(currentLevel - previousLevel).toBeLessThanOrEqual(1)
    }
  })

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check for required ARIA attributes
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const ariaLabel = await button.getAttribute('aria-label')
      const textContent = await button.textContent()
      
      // Button should have either aria-label or text content
      expect(ariaLabel || textContent?.trim()).toBeTruthy()
    }
    
    // Check form inputs have proper labels
    const inputs = page.locator('input')
    const inputCount = await inputs.count()
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      
      if (id) {
        // Should have a corresponding label
        const label = page.locator(`label[for="${id}"]`)
        const hasLabel = await label.count() > 0
        
        // Input should have label, aria-label, or aria-labelledby
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy()
      }
    }
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Test tab navigation
    await page.keyboard.press('Tab')
    
    // Should be able to navigate through interactive elements
    const focusableElements = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ')
    
    const elements = await page.locator(focusableElements).all()
    
    for (let i = 0; i < Math.min(elements.length, 5); i++) {
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A']).toContain(focusedElement)
      await page.keyboard.press('Tab')
    }
  })

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check for landmark regions
    const landmarks = [
      'main',
      'nav',
      'header',
      'footer',
      '[role="main"]',
      '[role="navigation"]',
      '[role="banner"]',
      '[role="contentinfo"]'
    ]
    
    for (const landmark of landmarks) {
      const element = page.locator(landmark).first()
      if (await element.count() > 0) {
        // Landmark should be present
        await expect(element).toBeVisible()
      }
    }
    
    // Check for proper page title
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(0)
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check color contrast ratios
    const colorContrastResults = await page.evaluate(async () => {
      // @ts-ignore
      const results = await axe.run({
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true }
        }
      })
      return results.violations.filter(v => 
        v.id === 'color-contrast' || v.id === 'color-contrast-enhanced'
      )
    })
    
    // Should have no color contrast violations
    expect(colorContrastResults).toHaveLength(0)
  })

  test('should handle focus management in modals', async ({ page }) => {
    const profilePage = new ProfilePage(page)
    await profilePage.goto()
    
    // Open a modal (payment modal)
    await profilePage.topUpCredits()
    
    // Focus should be trapped in modal
    const modal = page.locator('[data-testid="payment-modal"]')
    await expect(modal).toBeVisible()
    
    // Press tab multiple times
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      
      // Focus should remain within modal
      const focusedElement = await page.evaluate(() => {
        const activeEl = document.activeElement
        const modal = document.querySelector('[data-testid="payment-modal"]')
        return modal?.contains(activeEl)
      })
      
      expect(focusedElement).toBe(true)
    }
    
    // Escape key should close modal
    await page.keyboard.press('Escape')
    await expect(modal).not.toBeVisible()
  })

  test('should support keyboard shortcuts', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Test common keyboard shortcuts if implemented
    // Skip to main content (common accessibility feature)
    const skipLink = page.locator('a[href="#main"], [data-testid="skip-to-main"]')
    
    if (await skipLink.count() > 0) {
      await skipLink.press('Enter')
      
      // Should focus main content
      const mainContent = page.locator('main, #main, [data-testid="main-content"]')
      await expect(mainContent).toBeFocused()
    }
  })

  test('should provide alternative text for images', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check all images have alt text
    const images = page.locator('img')
    const imageCount = await images.count()
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      const role = await img.getAttribute('role')
      
      // Image should have alt text or be marked as decorative
      expect(alt !== null || role === 'presentation').toBe(true)
      
      // If alt is empty, image should be decorative
      if (alt === '') {
        const isDecorative = await img.evaluate(el => 
          el.getAttribute('role') === 'presentation' ||
          el.getAttribute('aria-hidden') === 'true'
        )
        expect(isDecorative).toBe(true)
      }
    }
  })

  test('should handle error messages accessibly', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Trigger form validation error
    await page.click('[data-testid="signin-button"]')
    
    // Error messages should be announced to screen readers
    const errorMessages = page.locator('[data-testid*="error"], .error, [role="alert"]')
    const errorCount = await errorMessages.count()
    
    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const error = errorMessages.nth(i)
        const ariaLive = await error.getAttribute('aria-live')
        const role = await error.getAttribute('role')
        
        // Error should be announced (aria-live or role="alert")
        expect(ariaLive === 'polite' || ariaLive === 'assertive' || role === 'alert').toBe(true)
      }
    }
  })

  test('should support reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/dashboard')
    
    // Check that animations are disabled or reduced
    const animatedElements = page.locator('[data-testid*="animation"], .animate, .transition')
    const animatedCount = await animatedElements.count()
    
    for (let i = 0; i < animatedCount; i++) {
      const element = animatedElements.nth(i)
      
      // Check CSS for reduced motion
      const hasReducedMotion = await element.evaluate(el => {
        const styles = window.getComputedStyle(el)
        return styles.getPropertyValue('animation-duration') === '0.01ms' ||
               styles.getPropertyValue('animation-duration') === '0s' ||
               styles.getPropertyValue('transition-duration') === '0.01ms' ||
               styles.getPropertyValue('transition-duration') === '0s'
      })
      
      // Animation should be disabled or significantly reduced
      expect(hasReducedMotion).toBe(true)
    }
  })

  test('should handle high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (forced-colors: active) {
          * {
            forced-color-adjust: none;
          }
        }
      `
    })
    
    await page.goto('/dashboard')
    
    // Essential elements should still be visible in high contrast
    await expect(page.locator('[data-testid="credits-display"]')).toBeVisible()
    await expect(page.locator('[data-testid="class-card"]').first()).toBeVisible()
    await expect(page.locator('[data-testid="book-class-button"]').first()).toBeVisible()
  })

  test('should support zoom up to 200%', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Zoom to 200%
    await page.setViewportSize({ width: 640, height: 480 }) // Simulate 200% zoom
    
    // Content should still be usable
    await expect(page.locator('[data-testid="credits-display"]')).toBeVisible()
    await expect(page.locator('[data-testid="class-card"]').first()).toBeVisible()
    
    // Should not have horizontal scrolling
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = page.viewportSize()!.width
    
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20)
  })

  test('should provide clear focus indicators', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check focus indicators are visible
    const focusableElements = page.locator('button, input, select, textarea, a[href]')
    const firstElement = focusableElements.first()
    
    if (await firstElement.count() > 0) {
      await firstElement.focus()
      
      // Element should have visible focus indicator
      const hasFocusIndicator = await firstElement.evaluate(el => {
        const styles = window.getComputedStyle(el, ':focus')
        return styles.outline !== 'none' && styles.outline !== '0px' ||
               styles.boxShadow !== 'none' ||
               styles.border !== styles.getPropertyValue('border') // Border changed
      })
      
      expect(hasFocusIndicator).toBe(true)
    }
  })
})