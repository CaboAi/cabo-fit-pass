import Stripe from 'stripe'

export function validateWebhookSignature(body: string, signature: string): Stripe.Event | null {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-07-30.basil',
    })

    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return null
  }
}

export function validateAmount(amount: number, min: number = 0, max: number = 1000000): boolean {
  return amount >= min && amount <= max && Number.isInteger(amount)
}

export function validateCreditAmount(credits: number, maxCredits: number = 1000): boolean {
  return credits > 0 && credits <= maxCredits && Number.isInteger(credits)
}
