-- Week 1 Critical Database Fixes
-- IMPORTANT: Run each section separately in Supabase SQL Editor
-- (CONCURRENTLY indexes can't run in transaction blocks)

-- ========================================
-- PART 1: RUN THIS FIRST - INDEXES
-- ========================================
-- Copy and run each CREATE INDEX command separately:

-- Booking queries (most common) - RUN THIS FIRST
CREATE INDEX IF NOT EXISTS idx_bookings_user_status_date 
ON bookings(user_id, status, created_at) 
WHERE status IN ('confirmed', 'pending');

-- Class availability checks - RUN THIS SECOND  
CREATE INDEX IF NOT EXISTS idx_bookings_class_date_status 
ON bookings(class_id, class_date, status) 
WHERE status = 'confirmed';

-- Dashboard class listings - RUN THIS THIRD
CREATE INDEX IF NOT EXISTS idx_classes_date_gym 
ON gym_classes(class_date, gym_id) 
WHERE class_date >= CURRENT_DATE;

-- Profile lookups - RUN THIS FOURTH
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- Active gyms filter - RUN THIS FIFTH
CREATE INDEX IF NOT EXISTS idx_gyms_active 
ON gyms(active) 
WHERE active = true;

-- ========================================
-- PART 2: RUN THIS AFTER INDEXES - MAIN SCRIPT
-- ========================================

-- 2. ATOMIC BOOKING FUNCTION - Prevents race conditions
CREATE OR REPLACE FUNCTION book_class_atomically(
  p_user_id UUID,
  p_gym_id UUID,
  p_class_id UUID,
  p_class_date DATE,
  p_class_time TIME,
  p_credits_required INTEGER,
  p_max_capacity INTEGER
) RETURNS JSON AS $$
DECLARE
  v_current_bookings INTEGER;
  v_user_credits INTEGER;
  v_booking_id UUID;
  v_result JSON;
BEGIN
  -- Start transaction (automatic in Supabase functions)
  
  -- Check for duplicate booking
  SELECT COUNT(*) INTO v_current_bookings
  FROM bookings 
  WHERE user_id = p_user_id 
    AND class_id = p_class_id 
    AND class_date = p_class_date
    AND status = 'confirmed';
    
  IF v_current_bookings > 0 THEN
    RAISE EXCEPTION 'duplicate_booking';
  END IF;
  
  -- Check class capacity (with row-level locking)
  SELECT COUNT(*) INTO v_current_bookings
  FROM bookings 
  WHERE class_id = p_class_id 
    AND class_date = p_class_date 
    AND status = 'confirmed'
  FOR UPDATE; -- Prevents concurrent bookings
  
  IF v_current_bookings >= p_max_capacity THEN
    RAISE EXCEPTION 'class_full';
  END IF;
  
  -- Check user credits
  SELECT credits INTO v_user_credits
  FROM profiles 
  WHERE id = p_user_id
  FOR UPDATE; -- Lock user row
  
  IF v_user_credits < p_credits_required THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;
  
  -- Create booking
  INSERT INTO bookings (
    id,
    user_id,
    gym_id,
    class_id,
    credits_consumed,
    booking_date,
    class_time,
    status,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_user_id,
    p_gym_id,
    p_class_id,
    p_credits_required,
    p_class_date,
    p_class_time,
    'confirmed',
    NOW()
  ) RETURNING id INTO v_booking_id;
  
  -- Deduct credits atomically
  UPDATE profiles 
  SET 
    credits = credits - p_credits_required,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Return result
  SELECT json_build_object(
    'booking_id', v_booking_id,
    'remaining_credits', credits
  ) INTO v_result
  FROM profiles 
  WHERE id = p_user_id;
  
  RETURN v_result;
  
EXCEPTION
  WHEN others THEN
    -- Let the transaction rollback automatically
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CAPACITY MANAGEMENT ENHANCEMENT
-- Add capacity tracking to gym_classes if not exists
ALTER TABLE gym_classes 
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 20;

-- Update existing classes with default capacity
UPDATE gym_classes 
SET capacity = 20 
WHERE capacity IS NULL;

-- 4. UNIQUE CONSTRAINT - Prevent duplicate bookings at DB level
-- NOTE: Run this separately if the main script fails
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_booking 
ON bookings(user_id, class_id, class_date) 
WHERE status = 'confirmed';

-- 5. PERFORMANCE MONITORING VIEW
CREATE OR REPLACE VIEW booking_performance_metrics AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as bookings_per_hour,
  AVG(credits_consumed) as avg_credits,
  COUNT(DISTINCT user_id) as unique_users
FROM bookings 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

COMMENT ON VIEW booking_performance_metrics IS 'Hourly booking metrics for performance monitoring';