-- Migration 003: Credit System, Tourist Pass, and Gym Member Tables
-- This migration adds the credit ledger system, tourist passes, and gym membership features

-- Step 1: Update profiles table
-- Add frozen field and migrate tier values
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS frozen BOOLEAN DEFAULT FALSE;

-- Update tier values to new format (t1, t2, t3)
UPDATE profiles 
SET tier = CASE 
  WHEN tier = 'basic' THEN 't1'
  WHEN tier = 'premium' THEN 't2'
  WHEN tier = 'unlimited' THEN 't3'
  ELSE 't1'
END
WHERE tier IN ('basic', 'premium', 'unlimited');

-- Update tier constraint to accept new values
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_tier_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_tier_check 
CHECK (tier IN ('t1', 't2', 't3'));

-- Step 2: Create credit_ledger table for FIFO credit management
CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL, -- Positive for credits added, negative for credits spent
  source TEXT NOT NULL, -- 'monthly', 'topup:xxx', 'spend', 'penalty:xxx', 'refund'
  expires_at DATE, -- NULL for non-expiring credits (monthly, penalties)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_credit_ledger_user_id (user_id),
  INDEX idx_credit_ledger_expires_at (expires_at),
  INDEX idx_credit_ledger_created_at (created_at)
);

-- Step 3: Create tourist_pass table
CREATE TABLE IF NOT EXISTS tourist_pass (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  classes_total INTEGER NOT NULL DEFAULT 5, -- Number of classes included in pass
  classes_used INTEGER NOT NULL DEFAULT 0,
  stripe_session_id TEXT, -- For tracking payment source
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_tourist_pass_user_id (user_id),
  INDEX idx_tourist_pass_dates (starts_at, ends_at)
);

-- Step 4: Create gym_members table for gym pricing access
CREATE TABLE IF NOT EXISTS gym_members (
  gym_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  member_since TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (gym_id, user_id)
);

-- Step 5: Create gym_pricing table
CREATE TABLE IF NOT EXISTS gym_pricing (
  gym_id UUID PRIMARY KEY REFERENCES studios(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT TRUE,
  base_price DECIMAL(10,2) DEFAULT 15.00,
  payout_percentage DECIMAL(3,2) DEFAULT 0.70, -- 70% payout to gym
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 6: Add booking status and cancellation fields to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS penalty_credits INTEGER DEFAULT 0;

-- Update booking_status to include 'cancelled' status
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_booking_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_booking_status_check 
CHECK (booking_status IN ('confirmed', 'cancelled', 'completed', 'no_show'));

-- Step 7: Add attended field for payout calculation
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT FALSE;

-- Step 8: Set up Row Level Security (RLS) policies

-- Enable RLS on new tables
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE tourist_pass ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_pricing ENABLE ROW LEVEL SECURITY;

-- Credit ledger policies
CREATE POLICY "Users can view own credit ledger" ON credit_ledger
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Service role has full access to credit ledger" ON credit_ledger
  FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Tourist pass policies
CREATE POLICY "Users can view own tourist passes" ON tourist_pass
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Service role has full access to tourist passes" ON tourist_pass
  FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Gym members policies
CREATE POLICY "Gym members can view membership" ON gym_members
  FOR SELECT USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'email' OR
    gym_id IN (SELECT id FROM studios WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'email')
  );

CREATE POLICY "Service role can manage gym members" ON gym_members
  FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Gym pricing policies (locked down - only viewable by gym members and service role)
CREATE POLICY "Gym members can view pricing" ON gym_pricing
  FOR SELECT USING (
    gym_id IN (
      SELECT gym_id FROM gym_members 
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'email'
    ) OR
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

CREATE POLICY "Service role can manage gym pricing" ON gym_pricing
  FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Step 9: Migrate existing credits to credit_ledger
-- This preserves existing credit balances in the new ledger system
INSERT INTO credit_ledger (user_id, delta, source, expires_at)
SELECT 
  id as user_id,
  credits as delta,
  'migration' as source,
  NULL as expires_at -- Non-expiring credits for existing balances
FROM profiles
WHERE credits > 0;

-- Step 10: Create function for FIFO credit spending (optional SQL implementation)
CREATE OR REPLACE FUNCTION consume_credits_fifo(p_user TEXT, p_amount INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  remaining INT := p_amount;
  r RECORD;
BEGIN
  -- Loop through available credits in FIFO order
  FOR r IN 
    SELECT 
      id, 
      delta,
      COALESCE(expires_at, DATE '2099-12-31') as exp,
      created_at
    FROM credit_ledger
    WHERE user_id = p_user
      AND delta > 0
      AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
    ORDER BY exp ASC, created_at ASC
  LOOP
    EXIT WHEN remaining <= 0;
    
    IF r.delta >= remaining THEN
      -- This entry has enough credits to cover the remaining amount
      INSERT INTO credit_ledger (user_id, delta, source, expires_at)
      VALUES (p_user, -remaining, 'spend', r.exp);
      
      remaining := 0;
    ELSE
      -- Use all credits from this entry
      INSERT INTO credit_ledger (user_id, delta, source, expires_at)
      VALUES (p_user, -r.delta, 'spend', r.exp);
      
      remaining := remaining - r.delta;
    END IF;
  END LOOP;
  
  -- Return true if we had enough credits, false otherwise
  RETURN remaining = 0;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION consume_credits_fifo(TEXT, INT) TO authenticated;

-- Step 11: Create helper function to get active credits balance
CREATE OR REPLACE FUNCTION get_active_credits(p_user TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(delta), 0) INTO total
  FROM credit_ledger
  WHERE user_id = p_user
    AND (expires_at IS NULL OR expires_at >= CURRENT_DATE);
  
  RETURN total;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_active_credits(TEXT) TO authenticated;

-- Step 12: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON bookings(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_attended ON bookings(attended);
CREATE INDEX IF NOT EXISTS idx_profiles_frozen ON profiles(frozen);

-- Step 13: Insert default gym pricing for existing studios
INSERT INTO gym_pricing (gym_id, active, base_price, payout_percentage)
SELECT id, true, 15.00, 0.70
FROM studios
ON CONFLICT (gym_id) DO NOTHING;

-- Step 14: Create audit log table for tracking all credit transactions
CREATE TABLE IF NOT EXISTS credit_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'booking', 'cancellation', 'topup', 'monthly_grant', 'penalty'
  credits_before INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  credits_changed INTEGER NOT NULL,
  metadata JSONB, -- Additional context (class_id, booking_id, stripe_session_id, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_audit_user_id (user_id),
  INDEX idx_audit_created_at (created_at)
);

-- Enable RLS on audit log
ALTER TABLE credit_audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log policies
CREATE POLICY "Users can view own audit log" ON credit_audit_log
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Service role has full access to audit log" ON credit_audit_log
  FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Step 15: Add comment documentation
COMMENT ON TABLE credit_ledger IS 'Tracks all credit transactions with FIFO support and expiration';
COMMENT ON TABLE tourist_pass IS 'Tourist passes with limited class access over a time period';
COMMENT ON TABLE gym_members IS 'Associates users with gyms for pricing access control';
COMMENT ON TABLE gym_pricing IS 'Gym-specific pricing and payout configuration';
COMMENT ON TABLE credit_audit_log IS 'Audit trail for all credit-related transactions';

COMMENT ON COLUMN credit_ledger.delta IS 'Positive for credits added, negative for credits spent';
COMMENT ON COLUMN credit_ledger.source IS 'Source of transaction: monthly, topup:xxx, spend, penalty:xxx, refund';
COMMENT ON COLUMN credit_ledger.expires_at IS 'NULL for non-expiring credits (monthly allocations, penalties)';

COMMENT ON COLUMN profiles.frozen IS 'TRUE when account is frozen (no bookings allowed)';
COMMENT ON COLUMN profiles.tier IS 't1 (basic), t2 (premium), or t3 (unlimited)';

COMMENT ON COLUMN bookings.attended IS 'TRUE when user attended the class (for payout calculation)';
COMMENT ON COLUMN bookings.refund_credits IS 'Number of credits refunded on cancellation';
COMMENT ON COLUMN bookings.penalty_credits IS 'Number of penalty credits charged for late cancellation';