// Payment Provider Interface and Factory

export interface CheckoutSession {
  id: string
  url: string
  amount: number
  currency: string
  metadata: Record<string, string>
  status: 'pending' | 'completed' | 'cancelled'
}

export interface PaymentCustomer {
  id: string
  email: string
  metadata?: Record<string, string>
}

export interface PaymentSubscription {
  id: string
  customerId: string
  status: 'active' | 'cancelled' | 'past_due'
  currentPeriodEnd: Date
  items: Array<{
    id: string
    priceId: string
  }>
}

export interface PaymentProvider {
  // Customer management
  createCustomer(email: string, metadata?: Record<string, string>): Promise<PaymentCustomer>
  getCustomer(customerId: string): Promise<PaymentCustomer | null>
  
  // Checkout sessions
  createCheckoutSession(params: {
    customerId?: string
    customerEmail?: string
    lineItems: Array<{
      name: string
      description?: string
      amount: number // in cents
      currency: string
      quantity: number
    }>
    successUrl: string
    cancelUrl: string
    metadata: Record<string, string>
  }): Promise<CheckoutSession>
  
  getCheckoutSession(sessionId: string): Promise<CheckoutSession | null>
  
  // Subscriptions
  createSubscription(params: {
    customerId: string
    priceId: string
    metadata?: Record<string, string>
  }): Promise<PaymentSubscription>
  
  updateSubscription(subscriptionId: string, params: {
    priceId?: string
    metadata?: Record<string, string>
    cancel?: boolean
  }): Promise<PaymentSubscription>
  
  getSubscription(subscriptionId: string): Promise<PaymentSubscription | null>
  
  // Webhook signature verification
  verifyWebhookSignature(payload: string, signature: string): boolean
  
  // Provider name for logging
  getProviderName(): string
}

// Factory function to get the appropriate payment provider
export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER || 'mock'
  const stripeEnabled = process.env.FEATURE_STRIPE === 'true'
  
  if (stripeEnabled && provider === 'stripe') {
    // Lazy load to avoid importing Stripe when not needed
    const { StripeProvider } = require('./stripe-provider')
    return new StripeProvider()
  }
  
  // Default to mock provider
  const { MockProvider } = require('./mock-provider')
  return new MockProvider()
}

// Type guard to check if using mock provider
export function isMockProvider(): boolean {
  return process.env.FEATURE_STRIPE !== 'true' || process.env.PAYMENT_PROVIDER === 'mock'
}

// Helper to generate consistent checkout metadata
export function createCheckoutMetadata(params: {
  userId: string
  kind: 'topup' | 'tourist_pass' | 'subscription'
  credits?: number
  packType?: string
  passType?: string
  tier?: string
  creditsBefore?: number
}): Record<string, string> {
  const metadata: Record<string, string> = {
    user_id: params.userId,
    kind: params.kind,
    timestamp: new Date().toISOString()
  }
  
  if (params.credits !== undefined) {
    metadata.credits = params.credits.toString()
  }
  
  if (params.packType) {
    metadata.pack_type = params.packType
  }
  
  if (params.passType) {
    metadata.pass_type = params.passType
  }
  
  if (params.tier) {
    metadata.tier = params.tier
  }
  
  if (params.creditsBefore !== undefined) {
    metadata.credits_before = params.creditsBefore.toString()
  }
  
  return metadata
}