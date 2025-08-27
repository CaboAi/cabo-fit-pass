// Stripe Price IDs for different products
export const STRIPE_PRICE_IDS = {
  // Subscription tiers
  subscriptions: {
    tier1: process.env.STRIPE_PRICE_TIER1,
    tier2: process.env.STRIPE_PRICE_TIER2,
    tier3: process.env.STRIPE_PRICE_TIER3,
  },
  // Top-up packages
  topup: {
    starter: process.env.STRIPE_PRICE_TOPUP_STARTER,
    standard: process.env.STRIPE_PRICE_TOPUP_STANDARD,
    premium: process.env.STRIPE_PRICE_TOPUP_PREMIUM,
  },
  // Tourist pass
  tourist_pass: {
    '7day': process.env.STRIPE_PRICE_TOURIST_7DAY,
  },
  // Freeze fees
  freeze: {
    monthly: process.env.STRIPE_PRICE_FREEZE_MONTHLY,
  }
}

// Credit packages configuration
export const CREDIT_PACKAGES = [
  {
    id: 'tier1',
    name: 'Tier 1',
    credits: 10,
    price: 15,
    priceId: process.env.STRIPE_PRICE_TIER1,
    description: 'Basic fitness access',
    features: ['10 credits per month', 'No rollover']
  },
  {
    id: 'tier2', 
    name: 'Tier 2',
    credits: 25,
    price: 35,
    priceId: process.env.STRIPE_PRICE_TIER2,
    description: 'Popular choice',
    features: ['25 credits per month', 'Rollover up to 25 credits']
  },
  {
    id: 'tier3',
    name: 'Tier 3', 
    credits: 50,
    price: 65,
    priceId: process.env.STRIPE_PRICE_TIER3,
    description: 'Premium fitness access',
    features: ['50 credits per month', 'Rollover up to 50 credits']
  }
]

// Top-up packages
export const TOPUP_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 12,
    price: 25,
    priceId: process.env.STRIPE_PRICE_TOPUP_STARTER,
    description: '10 credits + 2 bonus',
    bonus: 2
  },
  {
    id: 'standard',
    name: 'Standard Pack', 
    credits: 33,
    price: 50,
    priceId: process.env.STRIPE_PRICE_TOPUP_STANDARD,
    description: '25 credits + 8 bonus',
    bonus: 8
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    credits: 70, 
    price: 90,
    priceId: process.env.STRIPE_PRICE_TOPUP_PREMIUM,
    description: '50 credits + 20 bonus',
    bonus: 20
  }
]

// Tourist pass
export const TOURIST_PASS = {
  id: '7day',
  name: '7-Day Tourist Pass',
  credits: 3,
  price: 50,
  priceId: process.env.STRIPE_PRICE_TOURIST_7DAY,
  description: '3 credits valid for 7 days',
  validityDays: 7
}