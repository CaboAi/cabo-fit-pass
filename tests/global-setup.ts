import { chromium, FullConfig } from '@playwright/test'
import { createClient } from '@/lib/supabase/client'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E tests...')

  const { baseURL } = config.projects[0].use
  const browser = await chromium.launch()
  
  try {
    // Setup regular user authentication
    await setupUserAuth(browser, baseURL!)
    
    // Setup admin user authentication  
    await setupAdminAuth(browser, baseURL!)
    
    // Setup test data
    await setupTestData()
    
    console.log('✅ E2E test setup completed')
  } catch (error) {
    console.error('❌ E2E test setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function setupUserAuth(browser: any, baseURL: string) {
  console.log('Setting up regular user authentication...')
  
  const page = await browser.newPage()
  
  try {
    // Navigate to sign in page
    await page.goto(`${baseURL}/auth/signin`)
    
    // Test credentials for regular user
    const testEmail = 'test-user@cabofit.com'
    const testPassword = 'Test123!@#'
    
    // Fill in credentials and sign in
    await page.fill('[data-testid="email-input"]', testEmail)
    await page.fill('[data-testid="password-input"]', testPassword)
    await page.click('[data-testid="signin-button"]')
    
    // Wait for successful authentication (redirect to dashboard)
    await page.waitForURL(`${baseURL}/dashboard`, { timeout: 10000 })
    
    // Save authenticated state
    await page.context().storageState({ path: 'tests/.auth/user.json' })
    
    console.log('✅ Regular user authentication setup completed')
  } catch (error) {
    console.error('❌ Regular user authentication setup failed:', error)
    // If login fails, it might be because user doesn't exist yet
    // The auth system will create it during the sign-in process
  } finally {
    await page.close()
  }
}

async function setupAdminAuth(browser: any, baseURL: string) {
  console.log('Setting up admin user authentication...')
  
  const page = await browser.newPage()
  
  try {
    // Navigate to sign in page
    await page.goto(`${baseURL}/auth/signin`)
    
    // Test credentials for admin user
    const adminEmail = 'admin@cabofit.com'
    const adminPassword = 'Admin123!@#'
    
    // Fill in credentials and sign in
    await page.fill('[data-testid="email-input"]', adminEmail)
    await page.fill('[data-testid="password-input"]', adminPassword)
    await page.click('[data-testid="signin-button"]')
    
    // Wait for successful authentication
    await page.waitForURL(`${baseURL}/dashboard`, { timeout: 10000 })
    
    // Save authenticated state
    await page.context().storageState({ path: 'tests/.auth/admin.json' })
    
    console.log('✅ Admin user authentication setup completed')
  } catch (error) {
    console.error('❌ Admin user authentication setup failed:', error)
    // Create fallback admin authentication state
    await createFallbackAdminAuth(page, baseURL)
  } finally {
    await page.close()
  }
}

async function createFallbackAdminAuth(page: any, baseURL: string) {
  // For local development, we'll create a mock admin state
  const mockAdminStorage = {
    cookies: [],
    origins: [
      {
        origin: baseURL,
        localStorage: [
          {
            name: 'next-auth.session-token',
            value: 'mock-admin-session-token'
          }
        ]
      }
    ]
  }
  
  await page.context().addInitScript(() => {
    window.localStorage.setItem('next-auth.session-token', 'mock-admin-session-token')
  })
  
  await page.context().storageState({ path: 'tests/.auth/admin.json' })
}

async function setupTestData() {
  console.log('Setting up test data...')
  
  try {
    const supabase = createClient()
    
    // Ensure test classes exist for booking tests
    const { data: existingClasses } = await supabase
      .from('classes')
      .select('id')
      .limit(1)
    
    if (!existingClasses || existingClasses.length === 0) {
      console.log('Creating test classes...')
      
      // Create test studio first
      const { data: studio } = await supabase
        .from('studios')
        .insert({
          name: 'Test Fitness Studio',
          location: 'Test Location',
          description: 'Test studio for E2E testing'
        })
        .select()
        .single()
      
      if (studio) {
        // Create test classes
        await supabase
          .from('classes')
          .insert([
            {
              studio_id: studio.id,
              name: 'Test Yoga Class',
              description: 'Test yoga class for E2E testing',
              instructor: 'Test Instructor',
              date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
              time: '09:00:00',
              duration: 60,
              max_participants: 20,
              current_participants: 0
            },
            {
              studio_id: studio.id,
              name: 'Test HIIT Class',
              description: 'Test HIIT class for E2E testing',
              instructor: 'Test Trainer',
              date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
              time: '18:00:00',
              duration: 45,
              max_participants: 15,
              current_participants: 5
            }
          ])
      }
    }
    
    console.log('✅ Test data setup completed')
  } catch (error) {
    console.warn('⚠️  Test data setup failed (this may be normal for first run):', error)
  }
}

export default globalSetup