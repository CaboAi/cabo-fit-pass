import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
})

export { stripe }

// New pricing structure using environment variables
export const STRIPE_PRICES = {
  TIER1: process.env.STRIPE_PRICE_TIER1 || '25',
  TIER2: process.env.STRIPE_PRICE_TIER2 || '45', 
  TIER3: process.env.STRIPE_PRICE_TIER3 || '65',
  FREEZE: process.env.STRIPE_PRICE_FREEZE || '5',
  TOURIST_3DAY: process.env.STRIPE_PRICE_TOURIST_3DAY || '50',
  TOURIST_ADDON: process.env.STRIPE_PRICE_TOURIST_ADDON || '10'
}

// Updated credit packages with new pricing structure
export const CREDIT_PACKAGES = [
  {
    id: 'credits-5',
    credits: 5,
    price: 250, // Price in pesos (MXN)
    priceUSD: 1500, // Price in cents for Stripe
    bonus: 0,
    popular: false,
    name: '5 Credits Package',
    stripePriceId: STRIPE_PRICES.TIER1
  },
  {
    id: 'credits-10',
    credits: 10,
    price: 450, // Price in pesos (MXN)
    priceUSD: 2700, // Price in cents for Stripe 
    bonus: 2,
    popular: true,
    name: '10 Credits Package + 2 Bonus',
    stripePriceId: STRIPE_PRICES.TIER2
  },
  {
    id: 'credits-20',
    credits: 20,
    price: 800, // Price in pesos (MXN)
    priceUSD: 4800, // Price in cents for Stripe
    bonus: 5,
    popular: false,
    name: '20 Credits Package + 5 Bonus',
    stripePriceId: STRIPE_PRICES.TIER3
  }
]

// New tourist packages
export const TOURIST_PACKAGES = [
  {
    id: 'tourist-3day',
    name: '3-Day Tourist Pass',
    duration: '3 days',
    price: 50, // USD
    stripePriceId: STRIPE_PRICES.TOURIST_3DAY,
    description: 'Perfect for short-term visitors'
  },
  {
    id: 'tourist-addon',
    name: 'Tourist Add-on',
    price: 10, // USD
    stripePriceId: STRIPE_PRICES.TOURIST_ADDON,
    description: 'Additional day pass for tourists'
  }
]

// Freeze package
export const FREEZE_PACKAGE = {
  id: 'freeze',
  name: 'Freeze Membership',
  price: 5, // USD
  stripePriceId: STRIPE_PRICES.FREEZE,
  description: 'Pause your membership temporarily'
}

// Helper function to get package by Stripe price ID
export const getPackageByStripePriceId = (stripePriceId: string) => {
  const creditPackage = CREDIT_PACKAGES.find(pkg => pkg.stripePriceId === stripePriceId)
  if (creditPackage) return creditPackage
  
  const touristPackage = TOURIST_PACKAGES.find(pkg => pkg.stripePriceId === stripePriceId)
  if (touristPackage) return touristPackage
  
  if (stripePriceId === STRIPE_PRICES.FREEZE) return FREEZE_PACKAGE
  
  return null
}