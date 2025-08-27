import Stripe from 'stripe'

// Initialize server-side Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export default stripe

// Re-export constants for server-side use
export * from './stripe-constants'
