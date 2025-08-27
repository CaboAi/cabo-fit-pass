# Stripe Connect Integration

This document provides a comprehensive overview of the Stripe Connect integration implemented in this application. The integration follows Stripe's latest API version (`2025-07-30.basil`) and implements a platform-controlled marketplace model.

## 🏗️ Architecture Overview

The integration implements a **Platform-Controlled Marketplace** where:

- **Platform** handles pricing, fee collection, and financial risks
- **Connected Accounts** receive funds via destination charges
- **Application Fees** provide platform monetization
- **Express Dashboard** access for connected account management

## 🔑 Key Features

### 1. Connected Account Creation
- Creates Stripe Connect accounts with controller properties
- Platform responsible for pricing and fee collection
- Platform handles losses, refunds, and chargebacks
- Express dashboard access for connected accounts

### 2. Account Onboarding
- Stripe Account Links for seamless onboarding
- Real-time status checking via Stripe API
- Refresh and return URL handling
- Comprehensive requirement tracking

### 3. Product Management
- Platform-level product creation
- Automatic mapping to connected accounts via metadata
- Price management and currency support
- Product listing with account information

### 4. Customer Storefront
- Browse all products from connected sellers
- Real-time account status display
- Secure checkout via Stripe Checkout
- Destination charges with application fees

### 5. Payment Processing
- Hosted checkout for simplicity
- Destination charges to connected accounts
- Configurable application fees (10% default)
- Automatic fund transfers

## 🚀 Getting Started

### Prerequisites
- Stripe account with Connect enabled
- Node.js 18+ and npm
- Environment variables configured

### Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
NEXT_PUBLIC_STRIPE_PK=pk_test_... # Your Stripe publishable key

# Connect URLs
CONNECT_REFRESH_URL=http://localhost:3000/connect/refresh
CONNECT_RETURN_URL=http://localhost:3000/connect/return

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Access the Connect dashboard:**
   ```
   http://localhost:3000/connect
   ```

## 📁 File Structure

```
app/
├── api/connect/
│   ├── create-account/route.ts          # Create connected accounts
│   ├── account-status/route.ts          # Check account status
│   ├── create-product/route.ts          # Create products
│   ├── products/route.ts                # List all products
│   ├── create-checkout/route.ts         # Create checkout sessions
│   └── create-account-link/route.ts     # Create onboarding links
├── connect/
│   ├── page.tsx                         # Main dashboard
│   ├── success/page.tsx                 # Checkout success
│   ├── cancel/page.tsx                  # Checkout cancellation
│   ├── refresh/page.tsx                 # Onboarding refresh
│   └── return/page.tsx                  # Onboarding return
components/connect/
├── ConnectAccountForm.tsx               # Account creation form
├── AccountStatusChecker.tsx             # Status checking interface
├── ProductCreator.tsx                   # Product creation form
└── ProductStorefront.tsx                # Customer storefront
types/
└── index.ts                             # TypeScript interfaces
```

## 🔧 API Endpoints

### Create Connected Account
```http
POST /api/connect/create-account
```

**Request Body:**
```json
{
  "email": "seller@example.com",
  "country": "US",
  "business_type": "individual",
  "individual": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "accountId": "acct_1234567890abcdef",
  "onboardingUrl": "https://connect.stripe.com/..."
}
```

### Check Account Status
```http
GET /api/connect/account-status?accountId=acct_123...
```

**Response:**
```json
{
  "success": true,
  "account": {
    "id": "acct_123...",
    "charges_enabled": true,
    "payouts_enabled": true,
    "details_submitted": true,
    "requirements": { ... }
  }
}
```

### Create Product
```http
POST /api/connect/create-product
```

**Request Body:**
```json
{
  "name": "Premium Fitness Class",
  "description": "High-intensity workout session",
  "price": 25.00,
  "currency": "usd",
  "connectedAccountId": "acct_123..."
}
```

### List Products
```http
GET /api/connect/products
```

### Create Checkout Session
```http
POST /api/connect/create-checkout
```

**Request Body:**
```json
{
  "priceId": "price_123...",
  "quantity": 1,
  "connectedAccountId": "acct_123..."
}
```

## 💳 Payment Flow

1. **Customer selects product** in storefront
2. **Checkout session created** with destination charge
3. **Application fee calculated** (10% of total)
4. **Customer redirected** to Stripe Checkout
5. **Payment processed** and funds transferred
6. **Connected account receives** funds minus platform fee
7. **Success/cancel page** displayed to customer

## 🎯 Controller Properties

The integration uses Stripe's controller properties to ensure platform control:

```typescript
controller: {
  // Platform controls pricing and fee collection
  fees: {
    payer: 'application'
  },
  // Platform handles losses and chargebacks
  losses: {
    payments: 'application'
  },
  // Express dashboard access for connected accounts
  stripe_dashboard: {
    type: 'express'
  }
}
```

**Important:** Never use top-level `type` properties. Only use controller properties.

## 🔍 Account Status Monitoring

The system provides real-time account status monitoring:

- **Charges Enabled:** Can accept payments
- **Payouts Enabled:** Can receive funds
- **Details Submitted:** Onboarding requirements met
- **Requirements Tracking:** Currently due, eventually due, past due
- **Verification Status:** Identity verification progress

## 🛡️ Security Features

- **Environment variable validation** for all API endpoints
- **Input validation** and sanitization
- **Error handling** with user-friendly messages
- **Stripe webhook verification** (recommended for production)
- **Rate limiting** considerations

## 🚨 Error Handling

The integration includes comprehensive error handling:

- **Stripe API errors** with specific messages
- **Validation errors** for missing fields
- **Network errors** with retry options
- **User-friendly error messages** in UI

## 📱 UI Components

### ConnectAccountForm
- Business information collection
- Individual vs. company support
- Form validation and error handling
- Automatic redirect to onboarding

### AccountStatusChecker
- Real-time status monitoring
- Requirements tracking
- Visual status indicators
- Account information display

### ProductCreator
- Product creation interface
- Price and currency management
- Connected account mapping
- Success confirmation

### ProductStorefront
- Product browsing interface
- Seller information display
- Purchase flow management
- Checkout integration

## 🔄 Onboarding Flow

1. **Account Creation:** User fills out business information
2. **Stripe Onboarding:** Redirected to Stripe's hosted onboarding
3. **Document Collection:** Stripe collects required documents
4. **Verification:** Stripe verifies business information
5. **Activation:** Account becomes active for payments
6. **Return Handling:** User returns to platform dashboard

## 💰 Revenue Model

The platform monetizes through application fees:

- **Default Fee:** 10% of transaction amount
- **Minimum Fee:** $0.50 per transaction
- **Automatic Collection:** Fees collected on every payment
- **Transparent Pricing:** Clear fee structure for sellers

## 🚀 Production Considerations

### Webhook Implementation
```typescript
// Recommended for production
app.post('/api/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  
  switch (event.type) {
    case 'account.updated':
      // Handle account updates
      break;
    case 'payment_intent.succeeded':
      // Handle successful payments
      break;
  }
});
```

### Database Integration
- Store account mappings
- Track onboarding progress
- Log payment transactions
- Monitor application fees

### Monitoring & Analytics
- Account activation rates
- Payment success rates
- Fee collection metrics
- Error tracking and alerting

## 🧪 Testing

### Test Mode
The integration works with Stripe's test mode:

- Use test API keys
- Create test connected accounts
- Process test payments
- Verify webhook functionality

### Test Data
```typescript
// Example test account
const testAccount = {
  email: "test@example.com",
  country: "US",
  business_type: "individual",
  individual: {
    first_name: "Test",
    last_name: "User",
    email: "test@example.com"
  }
};
```

## 📚 Additional Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Connect Best Practices](https://stripe.com/docs/connect/best-practices)
- [Stripe Connect Onboarding](https://stripe.com/docs/connect/onboarding)

## 🤝 Support

For questions or issues with this integration:

1. Check the Stripe documentation
2. Review error logs in the console
3. Verify environment variables
4. Test with Stripe's test mode
5. Contact the development team

## 📝 License

This integration is part of the Cabo Fit Pass application and follows the same licensing terms.

---

**Note:** This integration is designed for demonstration and development purposes. For production use, implement additional security measures, error handling, and monitoring as appropriate for your use case.
