import {
  PACKS,
  TIER_MONTHLY,
  TIER_CAPS,
  PENALTY_CREDITS,
  TOURIST_PASS_CONFIG,
  SUBSCRIPTION_TIERS,
  getPackById,
  getTouristPassById,
  isPurchaseWithinCap,
  calculateRollover,
  formatPrice,
  getStripePriceId,
  type PackType,
  type TouristPassType,
  type Tier
} from '../billing'

describe('Billing Configuration', () => {
  describe('Constants', () => {
    it('should have correct pack definitions', () => {
      expect(PACKS.starter).toEqual({
        credits: 12,
        priceUsd: 25,
        stripePriceId: 'price_starter_test'
      })

      expect(PACKS.standard).toEqual({
        credits: 33,
        priceUsd: 50,
        stripePriceId: 'price_standard_test'
      })

      expect(PACKS.premium).toEqual({
        credits: 70,
        priceUsd: 90,
        stripePriceId: 'price_premium_test'
      })
    })

    it('should have correct tier monthly allocations', () => {
      expect(TIER_MONTHLY).toEqual({
        t1: 5,
        t2: 12,
        t3: 20
      })
    })

    it('should have correct tier caps', () => {
      expect(TIER_CAPS).toEqual({
        t1: 10,
        t2: 24,
        t3: 40
      })
    })

    it('should have correct penalty credits', () => {
      expect(PENALTY_CREDITS).toBe(2)
    })

    it('should have correct tourist pass configurations', () => {
      expect(TOURIST_PASS_CONFIG.threeDay).toEqual({
        id: 'tourist_3day',
        name: '3-Day Tourist Pass',
        durationDays: 3,
        classes: 5,
        priceUsd: 50,
        stripePriceId: 'price_tourist_3day_test'
      })

      expect(TOURIST_PASS_CONFIG.sevenDay).toEqual({
        id: 'tourist_7day',
        name: '7-Day Tourist Pass',
        durationDays: 7,
        classes: 10,
        priceUsd: 85,
        stripePriceId: 'price_tourist_7day_test'
      })
    })

    it('should have correct subscription tier configurations', () => {
      expect(SUBSCRIPTION_TIERS.t1.rolloverAllowed).toBe(false)
      expect(SUBSCRIPTION_TIERS.t2.rolloverAllowed).toBe(true)
      expect(SUBSCRIPTION_TIERS.t3.rolloverAllowed).toBe(true)

      expect(SUBSCRIPTION_TIERS.t2.maxRollover).toBe(TIER_MONTHLY.t2)
      expect(SUBSCRIPTION_TIERS.t3.maxRollover).toBe(TIER_MONTHLY.t3)
    })
  })

  describe('getPackById', () => {
    it('should return correct pack for valid ID', () => {
      const pack = getPackById('starter')
      expect(pack).toEqual(PACKS.starter)
    })

    it('should return null for invalid ID', () => {
      const pack = getPackById('invalid')
      expect(pack).toBeNull()
    })

    it('should handle all pack types', () => {
      Object.keys(PACKS).forEach(packId => {
        const pack = getPackById(packId)
        expect(pack).toBeTruthy()
        expect(pack).toEqual(PACKS[packId as PackType])
      })
    })
  })

  describe('getTouristPassById', () => {
    it('should return correct pass for valid ID', () => {
      const pass = getTouristPassById('tourist_3day')
      expect(pass).toEqual(TOURIST_PASS_CONFIG.threeDay)
    })

    it('should return null for invalid ID', () => {
      const pass = getTouristPassById('invalid')
      expect(pass).toBeNull()
    })

    it('should handle all tourist pass types', () => {
      Object.values(TOURIST_PASS_CONFIG).forEach(config => {
        const pass = getTouristPassById(config.id)
        expect(pass).toBeTruthy()
        expect(pass?.id).toBe(config.id)
      })
    })
  })

  describe('isPurchaseWithinCap', () => {
    it('should return true when purchase is within cap', () => {
      // t1 cap is 10, current 5 + purchase 3 = 8, which is <= 10
      expect(isPurchaseWithinCap(5, 3, 't1')).toBe(true)
    })

    it('should return true when purchase exactly meets cap', () => {
      // t1 cap is 10, current 7 + purchase 3 = 10, which is = 10
      expect(isPurchaseWithinCap(7, 3, 't1')).toBe(true)
    })

    it('should return false when purchase exceeds cap', () => {
      // t1 cap is 10, current 8 + purchase 5 = 13, which is > 10
      expect(isPurchaseWithinCap(8, 5, 't1')).toBe(false)
    })

    it('should work for all tier types', () => {
      // Test t2 cap (24)
      expect(isPurchaseWithinCap(20, 4, 't2')).toBe(true)
      expect(isPurchaseWithinCap(20, 5, 't2')).toBe(false)

      // Test t3 cap (40)
      expect(isPurchaseWithinCap(35, 5, 't3')).toBe(true)
      expect(isPurchaseWithinCap(35, 6, 't3')).toBe(false)
    })
  })

  describe('calculateRollover', () => {
    it('should return 0 for tier with no rollover allowed (t1)', () => {
      expect(calculateRollover(8, 't1')).toBe(0)
      expect(calculateRollover(0, 't1')).toBe(0)
    })

    it('should return current credits when less than max rollover (t2)', () => {
      // t2 max rollover is 12, current 8 < 12, so should return 8
      expect(calculateRollover(8, 't2')).toBe(8)
    })

    it('should return max rollover when current exceeds it (t2)', () => {
      // t2 max rollover is 12, current 15 > 12, so should return 12
      expect(calculateRollover(15, 't2')).toBe(12)
    })

    it('should return exact max rollover when current equals it (t2)', () => {
      // t2 max rollover is 12, current 12 = 12, so should return 12
      expect(calculateRollover(12, 't2')).toBe(12)
    })

    it('should work for t3 tier', () => {
      // t3 max rollover is 20
      expect(calculateRollover(15, 't3')).toBe(15)
      expect(calculateRollover(25, 't3')).toBe(20)
      expect(calculateRollover(20, 't3')).toBe(20)
    })

    it('should handle zero credits', () => {
      expect(calculateRollover(0, 't2')).toBe(0)
      expect(calculateRollover(0, 't3')).toBe(0)
    })
  })

  describe('formatPrice', () => {
    it('should format USD prices correctly', () => {
      expect(formatPrice(2500)).toBe('$25.00')
      expect(formatPrice(1299)).toBe('$12.99')
      expect(formatPrice(10000)).toBe('$100.00')
    })

    it('should format MXN prices correctly', () => {
      expect(formatPrice(25000, 'MXN')).toBe('MX$250')
      expect(formatPrice(12999, 'MXN')).toBe('MX$130')
    })

    it('should handle zero amount', () => {
      expect(formatPrice(0)).toBe('$0.00')
      expect(formatPrice(0, 'MXN')).toBe('MX$0')
    })

    it('should default to USD when currency not specified', () => {
      expect(formatPrice(2500)).toBe('$25.00')
    })
  })

  describe('getStripePriceId', () => {
    it('should return correct price ID for pack products', () => {
      expect(getStripePriceId('pack', 'starter')).toBe('price_starter_test')
      expect(getStripePriceId('pack', 'standard')).toBe('price_standard_test')
      expect(getStripePriceId('pack', 'premium')).toBe('price_premium_test')
    })

    it('should return null for invalid pack products', () => {
      expect(getStripePriceId('pack', 'invalid')).toBeNull()
    })

    it('should return correct price ID for tourist products', () => {
      expect(getStripePriceId('tourist', 'tourist_3day')).toBe('price_tourist_3day_test')
      expect(getStripePriceId('tourist', 'tourist_7day')).toBe('price_tourist_7day_test')
    })

    it('should return null for invalid tourist products', () => {
      expect(getStripePriceId('tourist', 'invalid')).toBeNull()
    })

    it('should return correct price ID for subscription products', () => {
      expect(getStripePriceId('subscription', 't1')).toBe('price_tier1_test')
      expect(getStripePriceId('subscription', 't2')).toBe('price_tier2_test')
      expect(getStripePriceId('subscription', 't3')).toBe('price_tier3_test')
    })

    it('should return null for invalid subscription products', () => {
      expect(getStripePriceId('subscription', 'invalid')).toBeNull()
    })

    it('should return correct price ID for freeze product', () => {
      expect(getStripePriceId('freeze', 'any')).toBe('price_freeze_test')
    })

    it('should return null for invalid product type', () => {
      expect(getStripePriceId('invalid' as any, 'starter')).toBeNull()
    })
  })

  describe('Business Logic Validation', () => {
    it('should ensure tier caps are greater than monthly allocations', () => {
      Object.keys(TIER_CAPS).forEach(tier => {
        const tierKey = tier as Tier
        expect(TIER_CAPS[tierKey]).toBeGreaterThan(TIER_MONTHLY[tierKey])
      })
    })

    it('should ensure rollover amounts do not exceed caps', () => {
      const tiers: Tier[] = ['t2', 't3'] // Only these have rollover
      
      tiers.forEach(tier => {
        const subscription = SUBSCRIPTION_TIERS[tier]
        if (subscription.rolloverAllowed && subscription.maxRollover) {
          expect(subscription.maxRollover).toBeLessThanOrEqual(TIER_CAPS[tier])
        }
      })
    })

    it('should have positive prices for all products', () => {
      Object.values(PACKS).forEach(pack => {
        expect(pack.priceUsd).toBeGreaterThan(0)
        expect(pack.credits).toBeGreaterThan(0)
      })

      Object.values(TOURIST_PASS_CONFIG).forEach(pass => {
        expect(pass.priceUsd).toBeGreaterThan(0)
        expect(pass.classes).toBeGreaterThan(0)
        expect(pass.durationDays).toBeGreaterThan(0)
      })

      Object.values(SUBSCRIPTION_TIERS).forEach(tier => {
        expect(tier.priceUsd).toBeGreaterThan(0)
        expect(tier.monthlyCredits).toBeGreaterThan(0)
        expect(tier.creditCap).toBeGreaterThan(0)
      })
    })

    it('should have reasonable credit-to-price ratios', () => {
      Object.values(PACKS).forEach(pack => {
        const creditsPerDollar = pack.credits / pack.priceUsd
        expect(creditsPerDollar).toBeGreaterThan(0.3) // At least 0.3 credits per dollar
        expect(creditsPerDollar).toBeLessThan(5) // No more than 5 credits per dollar
      })
    })
  })
})