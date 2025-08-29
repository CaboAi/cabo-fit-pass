import { defineConfig, devices } from '@playwright/test'
import path from 'path'

/**
 * Read environment variables from test-specific .env file
 */
require('dotenv').config({ path: path.resolve(__dirname, 'tests/.env.test') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
    process.env.CI ? ['github'] : ['list']
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording for debugging */
    video: 'retain-on-failure',

    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: true,

    /* Global timeout for each test */
    actionTimeout: 30 * 1000,
    
    /* Navigation timeout */
    navigationTimeout: 30 * 1000,
  },

  /* Configure global setup and teardown */
  // globalSetup: './tests/global-setup.ts',
  // globalTeardown: './tests/global-teardown.ts',

  /* Test timeout */
  timeout: 60 * 1000,

  /* Expect timeout */
  expect: {
    timeout: 10 * 1000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use prepared auth state from setup
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    /* Mobile testing */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    /* Admin user tests */
    {
      name: 'admin-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/admin.json',
      },
      dependencies: ['setup'],
      testMatch: /.*admin.*\.spec\.ts/,
    },

    /* Tests that require no authentication */
    {
      name: 'unauthenticated',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*auth.*\.spec\.ts/,
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    port: 3003,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})