# E2E Testing with Playwright - Cabo Fit Pass

This directory contains comprehensive End-to-End (E2E) tests for Cabo Fit Pass using Playwright. The tests focus on business-critical flows that could impact revenue and user experience.

## 🎯 Test Coverage

### Critical Business Flows
- **Booking Flow** (`booking-flow.spec.ts`) - Most critical revenue path
- **Authentication** (`auth.spec.ts`) - User registration and login
- **Payment System** (`payment-system.spec.ts`) - Credit purchases and payments
- **Admin Management** (`admin-flow.spec.ts`) - Gym management and payouts

### Quality Assurance
- **Mobile Responsive** (`mobile-responsive.spec.ts`) - Cross-device compatibility
- **Accessibility** (`accessibility.spec.ts`) - WCAG 2.1 AA compliance

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- A running instance of Cabo Fit Pass

### Installation
```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run test:e2e:install
```

### Running Tests

#### All Tests
```bash
npm run test:e2e
```

#### Specific Test Suites
```bash
# Critical business flows only
npm run test:smoke

# Mobile responsive tests
npm run test:mobile

# Accessibility tests
npm run test:accessibility
```

#### Interactive Mode
```bash
# Visual test runner
npm run test:e2e:ui

# Run with browser visible
npm run test:e2e:headed

# Debug mode with dev tools
npm run test:e2e:debug
```

#### Test Generation
```bash
# Generate tests by recording interactions
npm run test:e2e:codegen
```

## 📁 Directory Structure

```
tests/
├── .auth/                    # Authentication state files
│   ├── user.json            # Regular user session
│   └── admin.json           # Admin user session
├── e2e/                     # E2E test specifications
│   ├── auth.spec.ts         # Authentication tests
│   ├── booking-flow.spec.ts # Booking system tests
│   ├── admin-flow.spec.ts   # Admin management tests
│   ├── payment-system.spec.ts # Payment and credit tests
│   ├── mobile-responsive.spec.ts # Mobile layout tests
│   └── accessibility.spec.ts # Accessibility compliance tests
├── fixtures/                # Test data and fixtures
├── helpers/                 # Test utilities and page objects
│   ├── auth-helpers.ts      # Authentication utilities
│   └── page-objects.ts      # Page object models
├── global-setup.ts          # Global test setup
├── global-teardown.ts       # Global test cleanup
└── README.md               # This file
```

## 🧪 Test Architecture

### Page Object Model
Tests use the Page Object Model pattern for maintainability:

```typescript
import { DashboardPage } from '../helpers/page-objects'

test('should book a class', async ({ page }) => {
  const dashboardPage = new DashboardPage(page)
  await dashboardPage.goto()
  await dashboardPage.bookClass(0)
  await dashboardPage.waitForBookingSuccess()
})
```

### Authentication Helpers
Centralized authentication utilities:

```typescript
import { AuthHelper, TEST_USERS } from '../helpers/auth-helpers'

test('should sign in user', async ({ page }) => {
  const authHelper = new AuthHelper(page)
  await authHelper.signIn(TEST_USERS.regular)
})
```

### Test Data Management
- Authentication states are pre-configured in global setup
- Test users are defined in `auth-helpers.ts`
- Fixtures and test data are managed in `fixtures/` directory

## 🌐 Browser Coverage

Tests run across multiple browsers and devices:

### Desktop Browsers
- **Chromium** - Chrome, Edge, Brave
- **Firefox** - Mozilla Firefox  
- **WebKit** - Safari

### Mobile Devices
- **Mobile Chrome** - Android devices
- **Mobile Safari** - iOS devices

### Responsive Breakpoints
- Mobile Small: 375x667
- Mobile Large: 414x896
- Tablet: 768x1024
- Desktop: 1280x720, 1920x1080

## 🔐 Authentication Strategy

### Pre-authenticated Sessions
Tests use pre-authenticated sessions for speed:

```typescript
// Tests run with authenticated user by default
test.use({ storageState: 'tests/.auth/user.json' })

// Admin-specific tests
test.use({ storageState: 'tests/.auth/admin.json' })

// Unauthenticated tests
test.use({ storageState: { cookies: [], origins: [] } })
```

### Test Users
- **Regular User**: `test-user@cabofit.com`
- **Admin User**: `admin@cabofit.com`
- **Dynamic Users**: Generated per test with unique emails

## 💳 Payment Testing

### Stripe Test Mode
Payment tests use Stripe's test mode:

```typescript
// Mock successful payment
await page.route('**/api/checkout/session', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ sessionId: 'cs_test_mock_session_id' })
  })
})
```

### Credit System Testing
- Tests verify credit deduction on bookings
- Payment flows use test credit packages
- Refund processing is mocked for safety

## 🎯 Critical Test Scenarios

### 1. Booking Flow (Revenue Critical)
```typescript
test('should handle atomic booking with race conditions', async ({ browser }) => {
  // Simulate multiple users booking the same class
  // Verify atomic transaction prevents overbooking
  // Test implemented in booking-flow.spec.ts
})
```

### 2. Payment Processing
```typescript
test('should process credit top-up successfully', async ({ page }) => {
  // Test complete payment flow
  // Verify credit balance updates
  // Test error handling for failed payments
})
```

### 3. Admin Operations
```typescript
test('should manage gym payouts', async ({ page }) => {
  // Test Stripe Connect integration
  // Verify payout processing
  // Test admin role authorization
})
```

## 📱 Mobile Testing

### Touch and Gesture Support
```typescript
test('should support touch interactions', async ({ page }) => {
  // Use tap() instead of click() for mobile
  await page.locator('[data-testid="book-button"]').tap()
  
  // Test swipe gestures for carousels
  await page.touchscreen.tap(200, 400)
})
```

### Responsive Layout Validation
- Tests verify proper responsive breakpoints
- Validates touch-friendly button sizes (44px minimum)
- Ensures no horizontal scrolling on mobile

## ♿ Accessibility Testing

### Automated Accessibility Audits
```typescript
test('should meet WCAG 2.1 AA standards', async ({ page }) => {
  const results = await page.evaluate(async () => {
    return await axe.run()
  })
  
  expect(results.violations).toHaveLength(0)
})
```

### Manual Accessibility Checks
- Keyboard navigation testing
- Screen reader compatibility
- Focus management in modals
- Color contrast validation
- Alternative text for images

## 🔧 Configuration

### Environment Variables
```bash
# Test environment settings
NEXT_PUBLIC_BASE_URL=http://localhost:3000
DATABASE_URL=postgresql://test_db
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### Playwright Configuration
- **Timeout**: 60 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Parallel**: Enabled with worker limits
- **Screenshots**: On failure only
- **Videos**: On failure for debugging

## 🚨 CI/CD Integration

### GitHub Actions
- **PR Validation**: Runs smoke tests on pull requests
- **Full Test Suite**: Runs on main branch pushes
- **Nightly Tests**: Comprehensive test run at 2 AM UTC
- **Performance Monitoring**: Lighthouse CI integration

### Test Reports
- **HTML Reports**: Visual test results with screenshots
- **JUnit XML**: For CI/CD integration
- **JSON Reports**: Programmatic result processing

## 🐛 Debugging Tests

### Local Debugging
```bash
# Run specific test in debug mode
npx playwright test booking-flow.spec.ts --debug

# Run with browser visible
npm run test:e2e:headed

# Generate test code by recording
npm run test:e2e:codegen
```

### Test Artifacts
- **Screenshots**: Captured on test failures
- **Videos**: Recorded for failed tests
- **Traces**: Detailed execution traces
- **Console Logs**: Application and test logs

### Common Issues and Solutions

#### 1. Authentication Failures
```typescript
// Ensure proper wait for authentication
await authHelper.waitForAuthLoad()

// Clear cookies between tests
await page.context().clearCookies()
```

#### 2. Timing Issues
```typescript
// Use proper waits instead of fixed delays
await expect(element).toBeVisible()
await page.waitForLoadState('networkidle')
```

#### 3. Flaky Tests
```typescript
// Implement proper retry logic
await expect(async () => {
  await page.click('[data-testid="button"]')
  await expect(page.locator('[data-testid="result"]')).toBeVisible()
}).toPass({ timeout: 10000 })
```

## 📊 Test Metrics and Reporting

### Key Performance Indicators (KPIs)
- **Test Coverage**: Percentage of critical business flows covered
- **Pass Rate**: Percentage of successful test runs
- **Test Duration**: Time to complete test suites
- **Flakiness Rate**: Tests that fail intermittently

### Business Impact Metrics
- **Booking Flow Success Rate**: Revenue-critical path validation
- **Payment Processing Success**: Transaction success validation
- **Cross-Browser Compatibility**: User experience across devices
- **Accessibility Compliance**: WCAG 2.1 AA adherence

## 🔄 Maintenance

### Regular Tasks
1. **Weekly**: Review test results and fix flaky tests
2. **Monthly**: Update test data and user credentials
3. **Quarterly**: Review and update browser versions
4. **As Needed**: Add tests for new features

### Test Data Management
- Use dynamic test user generation for isolation
- Clean up test data after test runs
- Maintain separate test database/environment
- Mock external services (Stripe, etc.)

## 🤝 Contributing

### Adding New Tests
1. Use existing page objects where possible
2. Follow naming conventions (`feature-name.spec.ts`)
3. Add proper test documentation and comments
4. Include both positive and negative test cases
5. Test error handling and edge cases

### Best Practices
- **Test Independence**: Each test should be independent
- **Data-Driven**: Use `data-testid` attributes for element selection
- **Meaningful Assertions**: Test business outcomes, not implementation details
- **Error Handling**: Test both success and failure scenarios
- **Performance**: Keep tests fast and focused

### Code Review Checklist
- [ ] Tests cover critical user journeys
- [ ] Proper use of page objects and helpers
- [ ] Error scenarios are tested
- [ ] Tests are independent and isolated
- [ ] Proper assertions validate business outcomes
- [ ] Test documentation is clear and complete

## 📚 Resources

### Playwright Documentation
- [Playwright Official Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

### Accessibility Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [Web Accessibility Evaluation Tools](https://www.w3.org/WAI/ER/tools/)

### Testing Resources
- [Test Automation Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Page Object Pattern](https://martinfowler.com/bliki/PageObject.html)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**For questions or support, contact the development team or create an issue in the repository.**