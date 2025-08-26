export interface CreditRules {
  baselineValue: number // 1 credit ≈ $1.50
  subscriptionTiers: {
    [key: string]: {
      credits: number
      rolloverMax: number
      rolloverCycles: number
      cap: number // 2x allocation
    }
  }
  topUpPacks: {
    [key: string]: {
      price: number
      credits: number
      bonus: number
      expirationDays: number
      warningDays: number
    }
  }
}

export const CREDIT_RULES: CreditRules = {
  baselineValue: 1.50,
  subscriptionTiers: {
    'tier1': { credits: 10, rolloverMax: 0, rolloverCycles: 0, cap: 20 },
    'tier2': { credits: 25, rolloverMax: 25, rolloverCycles: 1, cap: 50 },
    'tier3': { credits: 50, rolloverMax: 50, rolloverCycles: 1, cap: 100 }
  },
  topUpPacks: {
    'starter': { price: 25, credits: 10, bonus: 2, expirationDays: 90, warningDays: 7 },
    'standard': { price: 50, credits: 25, bonus: 8, expirationDays: 90, warningDays: 7 },
    'premium': { price: 90, credits: 50, bonus: 20, expirationDays: 90, warningDays: 7 }
  }
}

export interface WalletState {
  monthlyAlloc: number
  monthlyRollover: number
  topupAvailable: number
  topupExpiresAt: Date | null
  tier: string
  totalCredits: number
  canPurchase: boolean
  purchaseCap: number
  warningDays: number
}

export interface CreditTransaction {
  userId: string
  gymId?: string
  classId?: string
  delta: number
  reason: 'subscription' | 'topup' | 'booking' | 'expiration' | 'rollover' | 'monthly_reset'
  metadata?: Record<string, any>
}

export class CreditManager {
  constructor(private supabase: any) {}

  async getUserWallet(userId: string): Promise<WalletState | null> {
    try {
      const { data: wallet, error } = await this.supabase
        .from('user_credit_wallet')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !wallet) return null

      const tier = wallet.tier || 'none'
      const tierRules = CREDIT_RULES.subscriptionTiers[tier] || CREDIT_RULES.subscriptionTiers.tier1
      
      const totalCredits = wallet.monthly_alloc + wallet.monthly_rollover + wallet.topup_available
      const canPurchase = totalCredits < tierRules.cap
      const purchaseCap = tierRules.cap

      // Check if topup credits are expiring soon
      let warningDays = 0
      if (wallet.topup_expires_at) {
        const daysUntilExpiry = Math.ceil((new Date(wallet.topup_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        if (daysUntilExpiry <= CREDIT_RULES.topUpPacks.starter.warningDays) {
          warningDays = daysUntilExpiry
        }
      }

      return {
        monthlyAlloc: wallet.monthly_alloc,
        monthlyRollover: wallet.monthly_rollover,
        topupAvailable: wallet.topup_available,
        topupExpiresAt: wallet.topup_expires_at ? new Date(wallet.topup_expires_at) : null,
        tier,
        totalCredits,
        canPurchase,
        purchaseCap,
        warningDays
      }
    } catch (error) {
      console.error('Error getting user wallet:', error)
      return null
    }
  }

  async processCreditTransaction(transaction: CreditTransaction): Promise<boolean> {
    try {
      // Get current wallet state
      const wallet = await this.getUserWallet(transaction.userId)
      if (!wallet) return false

      // Calculate new balances
      const newTotal = wallet.totalCredits + transaction.delta
      if (newTotal < 0) return false // Insufficient credits

      // Determine which credit pools to deduct from (for negative transactions)
      let newMonthlyAlloc = wallet.monthlyAlloc
      let newMonthlyRollover = wallet.monthlyRollover
      let newTopupAvailable = wallet.topupAvailable

      if (transaction.delta < 0) {
        let absDelta = Math.abs(transaction.delta)
        
        // Deduct in order: rollover -> monthly -> topup
        if (wallet.monthlyRollover > 0) {
          const deductFromRollover = Math.min(wallet.monthlyRollover, absDelta)
          newMonthlyRollover -= deductFromRollover
          absDelta -= deductFromRollover
        }
        
        if (absDelta > 0 && wallet.monthlyAlloc > 0) {
          const deductFromMonthly = Math.min(wallet.monthlyAlloc, absDelta)
          newMonthlyAlloc -= deductFromMonthly
          absDelta -= deductFromMonthly
        }
        
        if (absDelta > 0 && wallet.topupAvailable > 0) {
          const deductFromTopup = Math.min(wallet.topupAvailable, absDelta)
          newTopupAvailable -= deductFromTopup
        }
      } else {
        // Add credits based on reason
        if (transaction.reason === 'subscription') {
          newMonthlyAlloc += transaction.delta
        } else if (transaction.reason === 'topup') {
          newTopupAvailable += transaction.delta
        } else if (transaction.reason === 'rollover') {
          newMonthlyRollover += transaction.delta
        }
      }

      // Update wallet
      const { error: walletError } = await this.supabase
        .from('user_credit_wallet')
        .update({
          monthly_alloc: newMonthlyAlloc,
          monthly_rollover: newMonthlyRollover,
          topup_available: newTopupAvailable
        })
        .eq('user_id', transaction.userId)

      if (walletError) return false

      // Record in ledger
      const { error: ledgerError } = await this.supabase
        .from('credit_ledger')
        .insert({
          user_id: transaction.userId,
          gym_id: transaction.gymId,
          class_id: transaction.classId,
          delta: transaction.delta,
          reason: transaction.reason,
          balance_after: newTotal,
          payable_to_gym_cents: transaction.metadata?.payableToGymCents || 0,
          metadata: transaction.metadata
        })

      if (ledgerError) return false

      return true
    } catch (error) {
      console.error('Credit transaction error:', error)
      return false
    }
  }

  async processMonthlyReset(userId: string): Promise<boolean> {
    const wallet = await this.getUserWallet(userId)
    if (!wallet) return false

    const tierRules = CREDIT_RULES.subscriptionTiers[wallet.tier]
    if (!tierRules) return false

    // Calculate rollover
    let newRollover = 0
    if (tierRules.rolloverMax > 0 && tierRules.rolloverCycles > 0) {
      newRollover = Math.min(wallet.monthlyAlloc, tierRules.rolloverMax)
    }

    // Reset monthly allocation
    const newMonthlyAlloc = tierRules.credits

    // Process the reset transaction
    return await this.processCreditTransaction({
      userId,
      delta: newMonthlyAlloc - wallet.monthlyAlloc + newRollover - wallet.monthlyRollover,
      reason: 'monthly_reset',
      metadata: {
        oldMonthlyAlloc: wallet.monthlyAlloc,
        oldRollover: wallet.monthlyRollover,
        newMonthlyAlloc,
        newRollover
      }
    })
  }

  async processTopupExpiration(userId: string): Promise<boolean> {
    const wallet = await this.getUserWallet(userId)
    if (!wallet || !wallet.topupExpiresAt) return false

    const now = new Date()
    if (wallet.topupExpiresAt > now) return false

    // Expire topup credits
    if (wallet.topupAvailable > 0) {
      return await this.processCreditTransaction({
        userId,
        delta: -wallet.topupAvailable,
        reason: 'expiration',
        metadata: {
          expiredCredits: wallet.topupAvailable,
          expirationDate: wallet.topupExpiresAt
        }
      })
    }

    return true
  }

  async canBookClass(userId: string, requiredCredits: number): Promise<boolean> {
    const wallet = await this.getUserWallet(userId)
    if (!wallet) return false

    return wallet.totalCredits >= requiredCredits
  }

  async processClassBooking(
    userId: string, 
    gymId: string, 
    classId: string, 
    requiredCredits: number,
    classPrice: number
  ): Promise<boolean> {
    // Calculate payable amount to gym
    const payableToGymCents = Math.round(requiredCredits * CREDIT_RULES.baselineValue * 100)

    return await this.processCreditTransaction({
      userId,
      gymId,
      classId,
      delta: -requiredCredits,
      reason: 'booking',
      metadata: {
        payableToGymCents,
        classPrice,
        requiredCredits
      }
    })
  }

  async activateSubscription(userId: string, plan: string, subscriptionId: string): Promise<void> {
    try {
      // Get tier credits based on plan
      const tierCredits = this.getTierCredits(plan)
      
      // Update user profile with subscription
      await this.supabase
        .from('profiles')
        .update({
          stripe_subscription_id: subscriptionId,
          subscription_status: 'active',
          subscription_tier: plan,
          subscription_start_date: new Date().toISOString()
        })
        .eq('id', userId)

      // Initialize or update credit wallet
      await this.supabase
        .from('user_credit_wallet')
        .upsert({
          user_id: userId,
          monthly_alloc: tierCredits,
          tier: plan,
          created_at: new Date().toISOString()
        })

      // Log to ledger
      await this.supabase
        .from('credit_ledger')
        .insert({
          user_id: userId,
          delta: tierCredits,
          reason: `subscription_activation_${plan}`,
          created_at: new Date().toISOString()
        })

    } catch (error) {
      console.error('Error activating subscription:', error)
      throw error
    }
  }

  async addTopupCredits(userId: string, plan: string, amountCents: number): Promise<void> {
    try {
      const pack = CREDIT_RULES.topUpPacks[plan]
      if (!pack) {
        throw new Error(`Invalid pack type: ${plan}`)
      }

      // Check credit cap
      const wallet = await this.getUserWallet(userId)
      if (!wallet) {
        throw new Error('User wallet not found')
      }
      
      const currentCredits = wallet.topupAvailable + wallet.monthlyAlloc + wallet.monthlyRollover
      const tierCap = this.getTierCap(wallet.tier)
      
      if (currentCredits + pack.credits > tierCap * 2) {
        throw new Error('Credit cap exceeded')
      }

      // Add credits with expiration
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + pack.expirationDays)

      await this.supabase
        .from('user_credit_wallet')
        .update({
          topup_available: wallet.topupAvailable + pack.credits,  // Fixed property name
          topup_expires_at: expirationDate.toISOString()
        })
        .eq('user_id', userId)

      // Log to ledger
      await this.supabase
        .from('credit_ledger')
        .insert({
          user_id: userId,
          delta: pack.credits,
          reason: `topup_${plan}`,
          created_at: new Date().toISOString()
        })

    } catch (error) {
      console.error('Error adding topup credits:', error)
      throw error
    }
  }

  async addTouristPassCredits(userId: string, plan: string): Promise<void> {
    try {
      const passCredits = plan === 'starter' ? 10 : 0
      if (passCredits === 0) {
        throw new Error(`Invalid tourist pass plan: ${plan}`)
      }

      // Get wallet safely
      const wallet = await this.getUserWallet(userId)
      if (!wallet) {
        throw new Error('User wallet not found')
      }

      // Add credits with 7-day validity
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + 7)

      await this.supabase
        .from('user_credit_wallet')
        .update({
          topup_available: wallet.topupAvailable + passCredits,  // Fixed property name
          topup_expires_at: expirationDate.toISOString()
        })
        .eq('user_id', userId)

      // Log to ledger
      await this.supabase
        .from('credit_ledger')
        .insert({
          user_id: userId,
          delta: passCredits,
          reason: `tourist_pass_${plan}`,
          created_at: new Date().toISOString()
        })

    } catch (error) {
      console.error('Error adding tourist pass credits:', error)
      throw error
    }
  }

  private getTierCredits(plan: string): number {
    const credits = { 'tier1': 10, 'tier2': 25, 'tier3': 50 }
    return credits[plan as keyof typeof credits] || 0
  }

  private getTierCap(tier: string): number {
    const caps = { 'tier1': 20, 'tier2': 50, 'tier3': 100 }
    return caps[tier as keyof typeof caps] || 0
  }
}
