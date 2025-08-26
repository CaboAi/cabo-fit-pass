import Stripe from 'stripe'
import { 
  PaymentProvider, 
  CheckoutSession, 
  PaymentCustomer, 
  PaymentSubscription 
} from './provider'

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
})

async function getStripe() {
  const Stripe = (await import("stripe")).default
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY missing")
  return new Stripe(key, { apiVersion: "2023-10-16" })
}

export class StripeProvider implements PaymentProvider {
  // Remove constructor and private stripe property
  
  async createCustomer(email: string, metadata?: Record<string, string>): Promise<PaymentCustomer> {
    const stripe = await getStripe()

    const customer = await stripe.customers.create({
      email,
      metadata
    })
    
    return {
      id: customer.id,
      email: customer.email || email,
      metadata: customer.metadata as Record<string, string>
    }
  }
  
  async getCustomer(customerId: string): Promise<PaymentCustomer | null> {
    try {
      const stripe = await getStripe()

      const customer = await stripe.customers.retrieve(customerId)
      
      if (customer.deleted) {
        return null
      }
      
      return {
        id: customer.id,
        email: customer.email || '',
        metadata: customer.metadata as Record<string, string>
      }
    } catch (error) {
      console.error('Error fetching Stripe customer:', error)
      return null
    }
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
    const stripe = await getStripe()

    const sessionParams: any = {
      payment_method_types: ['card'],
      line_items: params.lineItems.map(item => ({
        price_data: {
          currency: item.currency,
          product_data: {
            name: item.name,
            description: item.description
          },
          unit_amount: item.amount
        },
        quantity: item.quantity
      })),
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata
    }
    
    if (params.customerId) {
      sessionParams.customer = params.customerId
    } else if (params.customerEmail) {
      sessionParams.customer_email = params.customerEmail
    }
    
    const session = await stripe.checkout.sessions.create(sessionParams)
    
    return {
      id: session.id,
      url: session.url || '',
      amount: session.amount_total || 0,
      currency: session.currency || 'usd',
      metadata: session.metadata as Record<string, string>,
      status: this.mapStripeStatus(session.status)
    }
  }
  
  async getCheckoutSession(sessionId: string): Promise<CheckoutSession | null> {
    try {
      const stripe = await getStripe()

      const session = await stripe.checkout.sessions.retrieve(sessionId)
      
      return {
        id: session.id,
        url: session.url || '',
        amount: session.amount_total || 0,
        currency: session.currency || 'usd',
        metadata: session.metadata as Record<string, string>,
        status: this.mapStripeStatus(session.status)
      }
    } catch (error) {
      console.error('Error fetching Stripe session:', error)
      return null
    }
  }
  
  async createSubscription(params: {
    customerId: string
    priceId: string
    metadata?: Record<string, string>
  }): Promise<PaymentSubscription> {
    const stripe = await getStripe()

    const subscription = await stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      metadata: params.metadata
    })
    
    return {
      id: subscription.id,
      customerId: subscription.customer as string,
      status: this.mapSubscriptionStatus(subscription.status),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      items: subscription.items.data.map(item => ({
        id: item.id,
        priceId: item.price.id
      }))
    }
  }
  
  async updateSubscription(subscriptionId: string, params: {
    priceId?: string
    metadata?: Record<string, string>
    cancel?: boolean
  }): Promise<PaymentSubscription> {
    const stripe = await getStripe()

    let subscription: any
    
    if (params.cancel) {
      subscription = await stripe.subscriptions.cancel(subscriptionId)
    } else {
      const updateParams: any = {}
      
      if (params.metadata) {
        updateParams.metadata = params.metadata
      }
      
      if (params.priceId) {
        // Get current subscription to find item ID
        const current = await stripe.subscriptions.retrieve(subscriptionId)
        const itemId = current.items.data[0]?.id
        
        if (itemId) {
          updateParams.items = [{
            id: itemId,
            price: params.priceId
          }]
          updateParams.proration_behavior = 'create_prorations'
        }
      }
      
      subscription = await stripe.subscriptions.update(subscriptionId, updateParams)
    }
    
    return {
      id: subscription.id,
      customerId: subscription.customer as string,
      status: this.mapSubscriptionStatus(subscription.status),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      items: subscription.items.data.map(item => ({
        id: item.id,
        priceId: item.price.id
      }))
    }
  }
  
  async getSubscription(subscriptionId: string): Promise<PaymentSubscription | null> {
    try {
      const stripe = await getStripe()

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      
      return {
        id: subscription.id,
        customerId: subscription.customer as string,
        status: this.mapSubscriptionStatus(subscription.status),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        items: subscription.items.data.map(item => ({
          id: item.id,
          priceId: item.price.id
        }))
      }
    } catch (error) {
      console.error('Error fetching Stripe subscription:', error)
      return null
    }
  }
  
  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
      
      if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured')
        return false
      }
      
      const stripe = await getStripe()

      // Stripe will throw if signature is invalid
      stripe.webhooks.constructEvent(payload, signature, webhookSecret)
      return true
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return false
    }
  }
  
  getProviderName(): string {
    return 'stripe'
  }
  
  // Helper methods to map Stripe statuses
  private mapStripeStatus(status: any): CheckoutSession['status'] {
    switch (status) {
      case 'complete':
        return 'completed'
      case 'expired':
        return 'cancelled'
      default:
        return 'pending'
    }
  }
  
  private mapSubscriptionStatus(status: any): PaymentSubscription['status'] {
    switch (status) {
      case 'active':
      case 'trialing':
        return 'active'
      case 'canceled':
      case 'incomplete_expired':
        return 'cancelled'
      case 'past_due':
      case 'unpaid':
        return 'past_due'
      default:
        return 'cancelled'
    }
  }
}