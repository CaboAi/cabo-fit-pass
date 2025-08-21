import { createClient } from '@/lib/supabase/server'
import { TIER_CAPS, TIER_MONTHLY, CREDIT_EXPIRATION, calculateRollover } from '@/lib/billing'

export type Tier = 't1' | 't2' | 't3'

// Get user's tier from profile
export async function getUserTier(userId: string): Promise<Tier> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single()
  
  if (error || !data) {
    console.error('Error fetching user tier:', error)
    return 't1' // Default to basic tier
  }
  
  return (data.tier as Tier) || 't1'
}

// Get total active credits (non-expired) for a user
export async function getActiveCredits(userId: string): Promise<number> {
  const supabase = createClient()
  
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  
  const { data, error } = await supabase
    .from('credit_ledger')
    .select('delta')
    .eq('user_id', userId)
    .or(`expires_at.is.null,expires_at.gte.${today}`)
  
  if (error) {
    console.error('Error fetching active credits:', error)
    return 0
  }
  
  // Sum all deltas
  const total = data?.reduce((sum, entry) => sum + entry.delta, 0) || 0
  return Math.max(0, total) // Never return negative
}

// Calculate projected balance after adding credits
export async function projectedBalanceAfterTopUp(userId: string, addCredits: number): Promise<number> {
  const currentCredits = await getActiveCredits(userId)
  return currentCredits + addCredits
}

// Check if user can purchase top-up without exceeding tier cap
export async function canPurchaseTopUp(userId: string, tier: Tier, addCredits: number): Promise<boolean> {
  const projected = await projectedBalanceAfterTopUp(userId, addCredits)
  return projected <= TIER_CAPS[tier]
}

// Grant monthly credits with rollover logic
export async function grantMonthlyCredits(userId: string, tier: Tier): Promise<void> {
  const supabase = createClient()
  
  // Step 1: Get current active credits
  const currentCredits = await getActiveCredits(userId)
  
  // Step 2: Calculate allowed rollover
  const rolloverAmount = calculateRollover(currentCredits, tier)
  
  // Step 3: If we need to trim excess credits (current > rollover), add negative entry
  if (currentCredits > rolloverAmount && rolloverAmount > 0) {
    const trimAmount = currentCredits - rolloverAmount
    
    const { error: trimError } = await supabase
      .from('credit_ledger')
      .insert({
        user_id: userId,
        delta: -trimAmount,
        source: 'rollover_trim',
        expires_at: null
      })
    
    if (trimError) {
      console.error('Error trimming rollover credits:', trimError)
      throw trimError
    }
  }
  
  // Step 4: Add monthly allocation
  const monthlyAllocation = TIER_MONTHLY[tier]
  
  const { error: grantError } = await supabase
    .from('credit_ledger')
    .insert({
      user_id: userId,
      delta: monthlyAllocation,
      source: 'monthly',
      expires_at: null // Monthly credits don't expire
    })
  
  if (grantError) {
    console.error('Error granting monthly credits:', grantError)
    throw grantError
  }
}

// Spend credits using FIFO (First In, First Out) logic
export async function spendCreditsFIFO(userId: string, amount: number): Promise<boolean> {
  const supabase = createClient()
  
  // Use the database function for atomic FIFO spending
  const { data, error } = await supabase
    .rpc('consume_credits_fifo', {
      p_user: userId,
      p_amount: amount
    })
  
  if (error) {
    console.error('Error spending credits FIFO:', error)
    return false
  }
  
  return data === true
}

// Alternative TypeScript implementation of FIFO spending (if not using DB function)
export async function spendCreditsFIFOTypeScript(userId: string, amount: number): Promise<boolean> {
  const supabase = createClient()
  
  // Fetch positive credit entries in FIFO order
  const today = new Date().toISOString().split('T')[0]
  
  const { data: credits, error: fetchError } = await supabase
    .from('credit_ledger')
    .select('id, delta, expires_at, created_at')
    .eq('user_id', userId)
    .gt('delta', 0)
    .or(`expires_at.is.null,expires_at.gte.${today}`)
    .order('expires_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
  
  if (fetchError || !credits) {
    console.error('Error fetching credits for FIFO:', fetchError)
    return false
  }
  
  let remaining = amount
  const spendEntries: Array<{ delta: number; source: string; expires_at: string | null }> = []
  
  // Walk through credits and consume FIFO
  for (const credit of credits) {
    if (remaining <= 0) break
    
    const toSpend = Math.min(credit.delta, remaining)
    spendEntries.push({
      delta: -toSpend,
      source: 'spend',
      expires_at: credit.expires_at
    })
    
    remaining -= toSpend
  }
  
  // Check if we have enough credits
  if (remaining > 0) {
    return false // Not enough credits
  }
  
  // Insert spend entries
  const { error: spendError } = await supabase
    .from('credit_ledger')
    .insert(
      spendEntries.map(entry => ({
        user_id: userId,
        ...entry
      }))
    )
  
  if (spendError) {
    console.error('Error recording credit spend:', spendError)
    return false
  }
  
  return true
}

// Add top-up credits with expiration
export async function addTopUp(userId: string, credits: number, sourceRef: string): Promise<void> {
  const supabase = createClient()
  
  // Calculate expiration date (90 days from now)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + CREDIT_EXPIRATION.topUpDays)
  
  const { error } = await supabase
    .from('credit_ledger')
    .insert({
      user_id: userId,
      delta: credits,
      source: `topup:${sourceRef}`,
      expires_at: expiresAt.toISOString().split('T')[0]
    })
  
  if (error) {
    console.error('Error adding top-up credits:', error)
    throw error
  }
}

// Add penalty (negative credits)
export async function addPenalty(userId: string, credits: number, reason: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('credit_ledger')
    .insert({
      user_id: userId,
      delta: -Math.abs(credits), // Ensure negative
      source: `penalty:${reason}`,
      expires_at: null // Penalties don't expire
    })
  
  if (error) {
    console.error('Error adding penalty:', error)
    throw error
  }
}

// Add refund credits (inherit expiration from original spend)
export async function addRefund(
  userId: string, 
  credits: number, 
  originalExpiration: string | null,
  reason: string
): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('credit_ledger')
    .insert({
      user_id: userId,
      delta: credits,
      source: `refund:${reason}`,
      expires_at: originalExpiration
    })
  
  if (error) {
    console.error('Error adding refund credits:', error)
    throw error
  }
}

// Check if user has an active tourist pass
export async function hasActiveTouristPass(userId: string): Promise<{
  id: string
  remaining: number
  ends_at: string
} | null> {
  const supabase = createClient()
  
  const now = new Date().toISOString()
  
  const { data, error } = await supabase
    .from('tourist_pass')
    .select('id, starts_at, ends_at, classes_total, classes_used')
    .eq('user_id', userId)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .gt('classes_total', 'classes_used')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return {
    id: data.id,
    remaining: data.classes_total - data.classes_used,
    ends_at: data.ends_at
  }
}

// Consume one class from tourist pass
export async function consumeTouristPass(passId: string): Promise<void> {
  const supabase = createClient()
  
  // First get current usage
  const { data: pass, error: fetchError } = await supabase
    .from('tourist_pass')
    .select('classes_used, classes_total')
    .eq('id', passId)
    .single()
  
  if (fetchError || !pass) {
    throw new Error('Tourist pass not found')
  }
  
  if (pass.classes_used >= pass.classes_total) {
    throw new Error('Tourist pass has no remaining classes')
  }
  
  // Increment usage
  const { error: updateError } = await supabase
    .from('tourist_pass')
    .update({ 
      classes_used: pass.classes_used + 1 
    })
    .eq('id', passId)
  
  if (updateError) {
    console.error('Error consuming tourist pass:', updateError)
    throw updateError
  }
}

// Add a new tourist pass
export async function addTouristPass(
  userId: string,
  durationDays: number,
  totalClasses: number,
  stripeSessionId: string
): Promise<void> {
  const supabase = createClient()
  
  const startsAt = new Date()
  const endsAt = new Date()
  endsAt.setDate(endsAt.getDate() + durationDays)
  
  const { error } = await supabase
    .from('tourist_pass')
    .insert({
      user_id: userId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      classes_total: totalClasses,
      classes_used: 0,
      stripe_session_id: stripeSessionId
    })
  
  if (error) {
    console.error('Error adding tourist pass:', error)
    throw error
  }
}

// Get detailed credit breakdown for a user
export async function getCreditBreakdown(userId: string): Promise<{
  total: number
  expiring: Array<{ amount: number; expires_at: string }>
  nonExpiring: number
}> {
  const supabase = createClient()
  
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('credit_ledger')
    .select('delta, expires_at')
    .eq('user_id', userId)
    .or(`expires_at.is.null,expires_at.gte.${today}`)
  
  if (error || !data) {
    return { total: 0, expiring: [], nonExpiring: 0 }
  }
  
  // Group by expiration
  const breakdown: Record<string, number> = {}
  let nonExpiring = 0
  
  for (const entry of data) {
    if (!entry.expires_at) {
      nonExpiring += entry.delta
    } else {
      breakdown[entry.expires_at] = (breakdown[entry.expires_at] || 0) + entry.delta
    }
  }
  
  // Convert to array and filter positive balances
  const expiring = Object.entries(breakdown)
    .filter(([_, amount]) => amount > 0)
    .map(([expires_at, amount]) => ({ amount, expires_at }))
    .sort((a, b) => a.expires_at.localeCompare(b.expires_at))
  
  const total = nonExpiring + expiring.reduce((sum, e) => sum + e.amount, 0)
  
  return {
    total: Math.max(0, total),
    expiring,
    nonExpiring: Math.max(0, nonExpiring)
  }
}

// Check if user account is frozen
export async function isAccountFrozen(userId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('frozen')
    .eq('id', userId)
    .single()
  
  if (error || !data) {
    console.error('Error checking frozen status:', error)
    return false
  }
  
  return data.frozen || false
}