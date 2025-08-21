import { 
  PaymentProvider, 
  CheckoutSession, 
  PaymentCustomer, 
  PaymentSubscription 
} from './provider'
import { createClient } from '@/lib/supabase/server'
import { addTopUp, addTouristPass } from '@/utils/credits'
import { PACKS, TOURIST_PASS_CONFIG } from '@/lib/billing'

// In-memory storage for mock data (in production, use a database)
const mockSessions = new Map<string, CheckoutSession>()
const mockCustomers = new Map<string, PaymentCustomer>()
const mockSubscriptions = new Map<string, PaymentSubscription>()

export class MockProvider implements PaymentProvider {
  async createCustomer(email: string, metadata?: Record<string, string>): Promise<PaymentCustomer> {
    const customer: PaymentCustomer = {
      id: `mock_cus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      metadata
    }
    
    mockCustomers.set(customer.id, customer)
    console.log(`[MockProvider] Created customer: ${customer.id} for ${email}`)
    
    return customer
  }
  
  async getCustomer(customerId: string): Promise<PaymentCustomer | null> {
    return mockCustomers.get(customerId) || null
  }
  
  async createCheckoutSession(params: {
    customerId?: string
    customerEmail?: string
    lineItems: Array<{
      name: string
      description?: string
      amount: number
      currency: string
      quantity: number
    }>
    successUrl: string
    cancelUrl: string
    metadata: Record<string, string>
  }): Promise<CheckoutSession> {
    const sessionId = `mock_cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const totalAmount = params.lineItems.reduce(
      (sum, item) => sum + (item.amount * item.quantity), 
      0
    )
    
    const session: CheckoutSession = {
      id: sessionId,
      url: `${process.env.NEXTAUTH_URL}/api/dev/mock-checkout?session=${sessionId}`,
      amount: totalAmount,
      currency: params.lineItems[0]?.currency || 'usd',
      metadata: params.metadata,
      status: 'pending'
    }
    
    mockSessions.set(sessionId, session)
    console.log(`[MockProvider] Created checkout session: ${sessionId}`)
    console.log(`[MockProvider] Metadata:`, params.metadata)
    
    // Auto-complete the session after a short delay (simulating immediate payment)
    if (process.env.MOCK_AUTO_COMPLETE === 'true') {
      setTimeout(() => this.completeCheckoutSession(sessionId), 1000)
    }
    
    return session
  }
  
  async getCheckoutSession(sessionId: string): Promise<CheckoutSession | null> {
    return mockSessions.get(sessionId) || null
  }
  
  async createSubscription(params: {
    customerId: string
    priceId: string
    metadata?: Record<string, string>
  }): Promise<PaymentSubscription> {
    const subscription: PaymentSubscription = {
      id: `mock_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId: params.customerId,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      items: [{
        id: `mock_si_${Date.now()}`,
        priceId: params.priceId
      }]
    }
    
    mockSubscriptions.set(subscription.id, subscription)
    console.log(`[MockProvider] Created subscription: ${subscription.id}`)
    
    return subscription
  }
  
  async updateSubscription(subscriptionId: string, params: {
    priceId?: string
    metadata?: Record<string, string>
    cancel?: boolean
  }): Promise<PaymentSubscription> {
    const subscription = mockSubscriptions.get(subscriptionId)
    
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`)
    }
    
    if (params.cancel) {
      subscription.status = 'cancelled'
    }
    
    if (params.priceId) {
      subscription.items[0].priceId = params.priceId
    }
    
    console.log(`[MockProvider] Updated subscription: ${subscriptionId}`)
    
    return subscription
  }
  
  async getSubscription(subscriptionId: string): Promise<PaymentSubscription | null> {
    return mockSubscriptions.get(subscriptionId) || null
  }
  
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // In mock mode, always return true
    return true
  }
  
  getProviderName(): string {
    return 'mock'
  }
  
  // Additional mock-specific methods
  async completeCheckoutSession(sessionId: string): Promise<void> {
    const session = mockSessions.get(sessionId)
    
    if (!session) {
      console.error(`[MockProvider] Session ${sessionId} not found`)
      return
    }
    
    if (session.status === 'completed') {
      console.log(`[MockProvider] Session ${sessionId} already completed`)
      return
    }
    
    session.status = 'completed'
    mockSessions.set(sessionId, session)
    
    console.log(`[MockProvider] Completing session ${sessionId}`)
    console.log(`[MockProvider] Processing with metadata:`, session.metadata)
    
    // Process the payment based on metadata
    const metadata = session.metadata
    const userId = metadata.user_id
    const kind = metadata.kind
    
    if (!userId) {
      console.error('[MockProvider] No user_id in metadata')
      return
    }
    
    const supabase = createClient()
    
    try {
      if (kind === 'topup' && metadata.credits) {
        // Process credit top-up
        const credits = parseInt(metadata.credits)
        await addTopUp(userId, credits, sessionId)
        
        // Log to audit
        await supabase
          .from('credit_audit_log')
          .insert({
            user_id: userId,
            action: 'topup',
            credits_before: parseInt(metadata.credits_before || '0'),
            credits_after: parseInt(metadata.credits_before || '0') + credits,
            credits_changed: credits,
            metadata: {
              stripe_session_id: sessionId,
              pack_type: metadata.pack_type,
              amount_paid: session.amount,
              provider: 'mock'
            }
          })
        
        console.log(`[MockProvider] Granted ${credits} credits to user ${userId}`)
        
      } else if (kind === 'tourist_pass') {
        // Process tourist pass
        const passType = metadata.pass_type as keyof typeof TOURIST_PASS_CONFIG
        const passConfig = TOURIST_PASS_CONFIG[passType]
        
        if (passConfig) {
          await addTouristPass(
            userId,
            passConfig.durationDays,
            passConfig.classes,
            sessionId
          )
          
          // Log to audit
          await supabase
            .from('credit_audit_log')
            .insert({
              user_id: userId,
              action: 'tourist_pass_purchase',
              credits_before: 0,
              credits_after: 0,
              credits_changed: 0,
              metadata: {
                stripe_session_id: sessionId,
                pass_type: passType,
                duration_days: passConfig.durationDays,
                classes_included: passConfig.classes,
                amount_paid: session.amount,
                provider: 'mock'
              }
            })
          
          console.log(`[MockProvider] Granted ${passType} tourist pass to user ${userId}`)
        }
        
      } else if (kind === 'subscription') {
        // Update user tier
        const tier = metadata.tier as 't1' | 't2' | 't3'
        
        await supabase
          .from('profiles')
          .update({ 
            tier,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
        
        console.log(`[MockProvider] Updated user ${userId} to tier ${tier}`)
      }
      
    } catch (error) {
      console.error('[MockProvider] Error processing payment:', error)
    }
  }
  
  // Method to manually cancel a session (for testing)
  async cancelCheckoutSession(sessionId: string): Promise<void> {
    const session = mockSessions.get(sessionId)
    
    if (session) {
      session.status = 'cancelled'
      mockSessions.set(sessionId, session)
      console.log(`[MockProvider] Cancelled session ${sessionId}`)
    }
  }
  
  // Method to clear all mock data (for testing)
  clearMockData(): void {
    mockSessions.clear()
    mockCustomers.clear()
    mockSubscriptions.clear()
    console.log('[MockProvider] Cleared all mock data')
  }
}