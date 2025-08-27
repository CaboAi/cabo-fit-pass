-- Rollback script for migration 003_credit_system.sql
-- Run this if you need to revert the credit system changes

-- Step 1: Drop new functions
DROP FUNCTION IF EXISTS consume_credits_fifo(TEXT, INT);
DROP FUNCTION IF EXISTS get_active_credits(TEXT);

-- Step 2: Drop policies on new tables
DROP POLICY IF EXISTS "Users can view own credit ledger" ON credit_ledger;
DROP POLICY IF EXISTS "Service role has full access to credit ledger" ON credit_ledger;
DROP POLICY IF EXISTS "Users can view own tourist passes" ON tourist_pass;
DROP POLICY IF EXISTS "Service role has full access to tourist passes" ON tourist_pass;
DROP POLICY IF EXISTS "Gym members can view membership" ON gym_members;
DROP POLICY IF EXISTS "Service role can manage gym members" ON gym_members;
DROP POLICY IF EXISTS "Gym members can view pricing" ON gym_pricing;
DROP POLICY IF EXISTS "Service role can manage gym pricing" ON gym_pricing;
DROP POLICY IF EXISTS "Users can view own audit log" ON credit_audit_log;
DROP POLICY IF EXISTS "Service role has full access to audit log" ON credit_audit_log;

-- Step 3: Drop new tables
DROP TABLE IF EXISTS credit_audit_log CASCADE;
DROP TABLE IF EXISTS gym_pricing CASCADE;
DROP TABLE IF EXISTS gym_members CASCADE;
DROP TABLE IF EXISTS tourist_pass CASCADE;
DROP TABLE IF EXISTS credit_ledger CASCADE;

-- Step 4: Revert profiles table changes
-- Restore original tier values
UPDATE profiles 
SET tier = CASE 
  WHEN tier = 't1' THEN 'basic'
  WHEN tier = 't2' THEN 'premium'
  WHEN tier = 't3' THEN 'unlimited'
  ELSE 'basic'
END
WHERE tier IN ('t1', 't2', 't3');

-- Drop frozen column
ALTER TABLE profiles DROP COLUMN IF EXISTS frozen;

-- Restore original tier constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_tier_check 
  CHECK (tier IN ('basic', 'premium', 'unlimited'));

-- Step 5: Revert bookings table changes
ALTER TABLE bookings DROP COLUMN IF EXISTS cancelled_at;
ALTER TABLE bookings DROP COLUMN IF EXISTS cancellation_reason;
ALTER TABLE bookings DROP COLUMN IF EXISTS refund_credits;
ALTER TABLE bookings DROP COLUMN IF EXISTS penalty_credits;
ALTER TABLE bookings DROP COLUMN IF EXISTS attended;

-- Restore original booking_status constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_booking_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_booking_status_check 
  CHECK (booking_status IN ('confirmed', 'completed'));

-- Step 6: Drop indexes
DROP INDEX IF EXISTS idx_bookings_cancelled_at;
DROP INDEX IF EXISTS idx_bookings_attended;
DROP INDEX IF EXISTS idx_profiles_frozen;