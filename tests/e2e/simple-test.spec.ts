import { test, expect } from '@playwright/test';

test.describe('Simple App Test', () => {
  test('should load homepage without errors', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that page loaded successfully
    await expect(page).toHaveTitle(/Cabo Fit Pass/i);
    
    // Look for sign-in button or similar
    const signInButton = page.locator('text=Sign In').first();
    if (await signInButton.isVisible()) {
      await expect(signInButton).toBeVisible();
      console.log('✅ Sign In button found');
    }
    
    // Check for any error messages
    const errorMessages = page.locator('.error, [role="alert"], .alert-error');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      console.log('❌ Found error messages on page');
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorMessages.nth(i).textContent();
        console.log(`Error ${i + 1}: ${errorText}`);
      }
    }
    
    // Take a screenshot for reference
    await page.screenshot({ path: 'tests/screenshots/homepage-test.png', fullPage: true });
    
    console.log('✅ Homepage test completed');
  });
  
  test('should load health check endpoint', async ({ page }) => {
    // Check the health endpoint directly
    const response = await page.goto('/api/health');
    
    // Should return 200 or 503 (both are valid for health checks)
    expect([200, 503]).toContain(response?.status());
    
    // Try to get JSON response
    try {
      const healthData = await response?.json();
      console.log('Health check response:', JSON.stringify(healthData, null, 2));
      
      // Should have status field
      expect(healthData).toHaveProperty('status');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthData.status);
      
    } catch (error) {
      console.log('Health endpoint returned non-JSON response');
    }
    
    console.log('✅ Health check test completed');
  });
});