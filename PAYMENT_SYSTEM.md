# Payment System Documentation

## Overview

The Cabo Fit Pass payment system supports both Stripe integration and a mock payment provider for development/testing. The system is designed to be easily switchable between providers using environment variables.

## Configuration

### Environment Variables

```bash
# Enable/disable Stripe integration
FEATURE_STRIPE=false  # true for Stripe, false for mock

# Payment provider selection
PAYMENT_PROVIDER=mock  # 'stripe' or 'mock'

# Mock provider settings
MOCK_AUTO_COMPLETE=true  # Auto-complete mock payments
```

### Provider Selection Logic

1. If `FEATURE_STRIPE=false` → Mock Provider (regardless of `PAYMENT_PROVIDER`)
2. If `FEATURE_STRIPE=true` AND `PAYMENT_PROVIDER=stripe` → Stripe Provider
3. Otherwise → Mock Provider (default fallback)

## Mock Payment Provider

Perfect for development and testing without real payment processing.

### Features

- **Auto-completion**: Payments complete automatically after 1 second
- **Transaction tracking**: Mock session IDs for audit trails
- **Direct endpoints**: Bypass checkout flow entirely
- **Visual feedback**: Mock checkout completion page

### Mock Endpoints

```bash
# Direct credit purchase (dev only)
POST /api/dev/topup-direct
{
  "pack": "starter" | "standard" | "premium"
}

# Direct tourist pass purchase (dev only)  
POST /api/dev/tourist-pass-direct
{
  "passType": "threeDay" | "sevenDay"
}

# System status
GET /api/dev/status

# Session status
GET /api/dev/session-status?session=mock_cs_123
```

### Mock Checkout Flow

1. User initiates purchase via `/api/credits/topup`
2. Mock provider creates session with URL: `/api/dev/mock-checkout?session=<id>`
3. User redirected to mock completion page
4. Auto-completion grants credits/passes after 1 second
5. User redirected to dashboard

## Stripe Provider

Full Stripe integration for production use.

### Required Setup

1. **Environment Variables**:
   ```bash
   FEATURE_STRIPE=true
   PAYMENT_PROVIDER=stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. **Stripe Price IDs**: Configure in environment
   ```bash
   STRIPE_PRICE_STARTER=price_123
   STRIPE_PRICE_STANDARD=price_456
   STRIPE_PRICE_PREMIUM=price_789
   ```

3. **Webhook Endpoint**: Configure in Stripe Dashboard
   ```
   URL: https://yourdomain.com/api/stripe/webhooks
   Events: checkout.session.completed, invoice.paid, customer.subscription.*
   ```

## API Endpoints

### Credit Top-up

```bash
# Create checkout session
POST /api/credits/topup
{
  "pack": "starter" | "standard" | "premium"
}

# Response
{
  "success": true,
  "data": {
    "sessionUrl": "https://checkout.stripe.com/...",
    "sessionId": "cs_123",
    "provider": "stripe" | "mock",
    "isMock": false
  }
}
```

### Tourist Pass Purchase

```bash
# Create checkout session
POST /api/tourist-pass/checkout  
{
  "passType": "threeDay" | "sevenDay"
}

# Check available passes
GET /api/tourist-pass/checkout
```

### Webhooks

```bash
# Stripe webhooks (production)
POST /api/stripe/webhooks

# Webhook status
GET /api/stripe/webhooks
```

## Credit Packages

| Package  | Credits | Price | Stripe Price ID        |
|----------|---------|-------|------------------------|
| Starter  | 12      | $25   | STRIPE_PRICE_STARTER   |
| Standard | 33      | $50   | STRIPE_PRICE_STANDARD  |
| Premium  | 70      | $90   | STRIPE_PRICE_PREMIUM   |

## Tourist Passes

| Pass Type | Duration | Classes | Price | 
|-----------|----------|---------|-------|
| 3-Day     | 3 days   | 5       | $50   |
| 7-Day     | 7 days   | 10      | $85   |

## Testing Scenarios

### 1. Development with Mock Provider

```bash
# .env.local
FEATURE_STRIPE=false
MOCK_AUTO_COMPLETE=true
NODE_ENV=development
```

**Test Flow**:
1. Purchase credits via dashboard
2. Redirected to mock checkout page
3. Credits granted automatically
4. Return to dashboard to see updated balance

### 2. Direct API Testing

```bash
# Direct credit purchase
curl -X POST http://localhost:3000/api/dev/topup-direct \
  -H "Content-Type: application/json" \
  -d '{"pack": "starter"}' \
  -H "Cookie: next-auth.session-token=..."

# Check status
curl http://localhost:3000/api/dev/status
```

### 3. Stripe Test Mode

```bash
# .env.local  
FEATURE_STRIPE=true
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_...
```

**Test Flow**:
1. Use Stripe test card: `4242 4242 4242 4242`
2. Complete real Stripe checkout
3. Webhook processes payment
4. Credits granted via Stripe webhook

## Error Handling

### Common Issues

1. **"Endpoint not available in production"**
   - Dev endpoints are blocked in production
   - Use regular checkout flow instead

2. **"Direct endpoints only available with mock provider"**
   - Set `FEATURE_STRIPE=false` to use direct endpoints

3. **"Webhook signature verification failed"**
   - Verify `STRIPE_WEBHOOK_SECRET` is correct
   - Check webhook endpoint configuration in Stripe

4. **"Purchase exceeds cap"**
   - User hitting tier credit limit
   - Use credits or upgrade tier

### Debugging

```bash
# Check provider status
GET /api/dev/status

# Check webhook status  
GET /api/stripe/webhooks

# View recent audit logs
GET /api/dev/status (includes recent transactions)
```

## Security Considerations

1. **Environment Separation**: Never use production Stripe keys in development
2. **Webhook Verification**: All Stripe webhooks verify signatures
3. **Dev Endpoint Protection**: Direct endpoints blocked in production
4. **Audit Logging**: All transactions logged for accountability
5. **Rate Limiting**: Consider adding rate limits to prevent abuse

## Migration Between Providers

### Mock → Stripe

1. Set up Stripe account and get API keys
2. Configure webhook endpoint
3. Update environment variables:
   ```bash
   FEATURE_STRIPE=true
   PAYMENT_PROVIDER=stripe
   STRIPE_SECRET_KEY=sk_live_...
   ```
4. Test with small transactions first

### Stripe → Mock (for testing)

1. Update environment variables:
   ```bash
   FEATURE_STRIPE=false
   MOCK_AUTO_COMPLETE=true
   ```
2. Existing Stripe data remains intact
3. New purchases use mock provider

## Monitoring

- All transactions logged in `credit_audit_log` table
- Provider information included in metadata
- Session IDs tracked for reconciliation
- Failed payments logged with error details

## Support

For issues with the payment system:
1. Check environment variable configuration
2. Review audit logs for transaction details
3. Test with mock provider first
4. Verify Stripe webhook configuration if using Stripe