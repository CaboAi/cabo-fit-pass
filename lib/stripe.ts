import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
})

export { stripe }

export const CREDIT_PACKAGES = [
  {
    id: 'credits-5',
    credits: 5,
    price: 250, // Price in pesos (MXN)
    priceUSD: 1500, // Price in cents for Stripe
    bonus: 0,
    popular: false,
    name: '5 Credits Package'
  },
  {
    id: 'credits-10',
    credits: 10,
    price: 450, // Price in pesos (MXN)
    priceUSD: 2700, // Price in cents for Stripe 
    bonus: 2,
    popular: true,
    name: '10 Credits Package + 2 Bonus'
  },
  {
    id: 'credits-20',
    credits: 20,
    price: 800, // Price in pesos (MXN)
    priceUSD: 4800, // Price in cents for Stripe
    bonus: 5,
    popular: false,
    name: '20 Credits Package + 5 Bonus'
  }
]