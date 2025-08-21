import { Tier } from '@/utils/credits'

// Credit package definitions with Stripe price IDs
export const PACKS = {
  starter: { 
    credits: 12, 
    priceUsd: 25, 
    stripePriceId: process.env.STRIPE_PRICE_STARTER || 'price_starter_test' 
  },
  standard: { 
    credits: 33, 
    priceUsd: 50, 
    stripePriceId: process.env.STRIPE_PRICE_STANDARD || 'price_standard_test' 
  },
  premium: { 
    credits: 70, 
    priceUsd: 90, 
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM || 'price_premium_test' 
  }
} as const

export type PackType = keyof typeof PACKS

// Penalty credits for late cancellation
export const PENALTY_CREDITS = 2

// Monthly credit allocations per tier
export const TIER_MONTHLY: Record<Tier, number> = { 
  t1: 5, 
  t2: 12, 
  t3: 20 
}

// Credit caps per tier
export const TIER_CAPS: Record<Tier, number> = { 
  t1: 10, 
  t2: 24, 
  t3: 40 
}

// Tourist pass configurations
export const TOURIST_PASS_CONFIG = {
  threeDay: {
    id: 'tourist_3day',
    name: '3-Day Tourist Pass',
    durationDays: 3,
    classes: 5,
    priceUsd: 50,
    stripePriceId: process.env.STRIPE_PRICE_TOURIST_3DAY || 'price_tourist_3day_test'
  },
  sevenDay: {
    id: 'tourist_7day', 
    name: '7-Day Tourist Pass',
    durationDays: 7,
    classes: 10,
    priceUsd: 85,
    stripePriceId: process.env.STRIPE_PRICE_TOURIST_7DAY || 'price_tourist_7day_test'
  }
} as const

export type TouristPassType = keyof typeof TOURIST_PASS_CONFIG

// Freeze plan configuration
export const FREEZE_PLAN = {
  priceUsd: 5,
  stripePriceId: process.env.STRIPE_PRICE_FREEZE || 'price_freeze_test',
  description: 'Account freeze - maintains credits but prevents bookings'
}

// Subscription tier configurations with Stripe price IDs
export const SUBSCRIPTION_TIERS = {
  t1: {
    name: 'Basic',
    monthlyCredits: TIER_MONTHLY.t1,
    creditCap: TIER_CAPS.t1,
    priceUsd: 25,
    stripePriceId: process.env.STRIPE_PRICE_TIER1 || 'price_tier1_test',
    rolloverAllowed: false
  },
  t2: {
    name: 'Premium',
    monthlyCredits: TIER_MONTHLY.t2,
    creditCap: TIER_CAPS.t2,
    priceUsd: 45,
    stripePriceId: process.env.STRIPE_PRICE_TIER2 || 'price_tier2_test',
    rolloverAllowed: true,
    maxRollover: TIER_MONTHLY.t2 // Can rollover up to monthly allocation
  },
  t3: {
    name: 'Unlimited',
    monthlyCredits: TIER_MONTHLY.t3,
    creditCap: TIER_CAPS.t3,
    priceUsd: 65,
    stripePriceId: process.env.STRIPE_PRICE_TIER3 || 'price_tier3_test',
    rolloverAllowed: true,
    maxRollover: TIER_MONTHLY.t3 // Can rollover up to monthly allocation
  }
} as const

// Gym payout configuration
export const GYM_PAYOUT = {
  percentage: 0.70, // 70% of class value goes to gym
  minimumPayout: 100, // Minimum payout amount in USD
  payoutSchedule: 'monthly' // Payout frequency
} as const

// Credit expiration settings
export const CREDIT_EXPIRATION = {
  topUpDays: 90, // Top-up credits expire after 90 days
  monthlyCreditsExpire: false, // Monthly credits don't expire
  penaltyCreditsExpire: false // Penalty deductions don't expire
} as const

// Cancellation policy
export const CANCELLATION_POLICY = {
  freeWindowHours: 6, // Can cancel free if more than 6 hours before class
  penaltyCredits: PENALTY_CREDITS, // Penalty for late cancellation
  noShowPenalty: 0, // No additional penalty for no-show (class is fully charged)
  refundExpiration: 'inherit' // Refunded credits inherit original expiration
} as const

// Helper function to get pack by ID
export function getPackById(packId: string): typeof PACKS[PackType] | null {
  const pack = Object.entries(PACKS).find(([key]) => key === packId)
  return pack ? pack[1] : null
}

// Helper function to get tourist pass by ID
export function getTouristPassById(passId: string): typeof TOURIST_PASS_CONFIG[TouristPassType] | null {
  const pass = Object.entries(TOURIST_PASS_CONFIG).find(([_, config]) => config.id === passId)
  return pass ? pass[1] : null
}

// Helper function to validate if purchase is within tier cap
export function isPurchaseWithinCap(
  currentCredits: number, 
  purchaseCredits: number, 
  tier: Tier
): boolean {
  const cap = TIER_CAPS[tier]
  return (currentCredits + purchaseCredits) <= cap
}

// Helper function to calculate rollover amount for a tier
export function calculateRollover(currentCredits: number, tier: Tier): number {
  const tierConfig = SUBSCRIPTION_TIERS[tier]
  
  if (!tierConfig.rolloverAllowed) {
    return 0
  }
  
  // Can rollover up to the monthly allocation amount
  return Math.min(currentCredits, tierConfig.maxRollover || 0)
}

// Helper function to format price for display
export function formatPrice(cents: number, currency: 'USD' | 'MXN' = 'USD'): string {
  const amount = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'MXN' ? 0 : 2,
    maximumFractionDigits: currency === 'MXN' ? 0 : 2
  }).format(amount)
}

// Helper function to get Stripe price ID for a product
export function getStripePriceId(
  productType: 'pack' | 'tourist' | 'subscription' | 'freeze',
  productId: string
): string | null {
  switch (productType) {
    case 'pack':
      const pack = getPackById(productId)
      return pack?.stripePriceId || null
      
    case 'tourist':
      const pass = getTouristPassById(productId)
      return pass?.stripePriceId || null
      
    case 'subscription':
      const tier = SUBSCRIPTION_TIERS[productId as Tier]
      return tier?.stripePriceId || null
      
    case 'freeze':
      return FREEZE_PLAN.stripePriceId
      
    default:
      return null
  }
}