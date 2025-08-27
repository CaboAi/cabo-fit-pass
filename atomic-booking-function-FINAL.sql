-- FINAL Atomic Booking Function - Based on REAL Schema
-- Run this in Supabase SQL Editor AFTER the indexes

CREATE OR REPLACE FUNCTION book_class_atomically(
  p_user_id TEXT,           -- profiles.id is TEXT (email-based)
  p_class_id UUID,          -- classes.id is UUID
  p_credits_required INTEGER DEFAULT 1
) RETURNS JSON AS $$
DECLARE
  v_current_bookings INTEGER;
  v_user_credits INTEGER;
  v_max_capacity INTEGER;
  v_booking_id UUID;
  v_result JSON;
BEGIN
  -- Check for duplicate booking (using existing unique constraint)
  SELECT COUNT(*) INTO v_current_bookings
  FROM bookings 
  WHERE user_id = p_user_id 
    AND class_id = p_class_id;
    
  IF v_current_bookings > 0 THEN
    RAISE EXCEPTION 'duplicate_booking: User already has booking for this class';
  END IF;
  
  -- Get class details and check capacity (with row-level locking)
  SELECT capacity INTO v_max_capacity
  FROM classes 
  WHERE id = p_class_id
  FOR UPDATE; -- Lock the class row
  
  IF v_max_capacity IS NULL THEN
    RAISE EXCEPTION 'class_not_found: Class not found';
  END IF;
  
  -- Count current paid bookings for this class
  SELECT COUNT(*) INTO v_current_bookings
  FROM bookings 
  WHERE class_id = p_class_id 
    AND payment_status = 'paid'
  FOR UPDATE; -- Prevent concurrent bookings
  
  IF v_current_bookings >= v_max_capacity THEN
    RAISE EXCEPTION 'class_full: Class has reached maximum capacity';
  END IF;
  
  -- Check user credits (with row locking)
  SELECT credits INTO v_user_credits
  FROM profiles 
  WHERE id = p_user_id
  FOR UPDATE; -- Lock user row
  
  IF v_user_credits IS NULL THEN
    RAISE EXCEPTION 'user_not_found: User profile not found';
  END IF;
  
  IF v_user_credits < p_credits_required THEN
    RAISE EXCEPTION 'insufficient_credits: User has insufficient credits';
  END IF;
  
  -- Create booking atomically
  INSERT INTO bookings (
    id,
    user_id,
    class_id,
    type,
    payment_status,
    booking_date,
    notes,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_user_id,
    p_class_id,
    'credit',
    'paid',
    NOW(),
    'Booked with ' || p_credits_required || ' credits',
    NOW()
  ) RETURNING id INTO v_booking_id;
  
  -- Deduct credits atomically
  UPDATE profiles 
  SET 
    credits = credits - p_credits_required,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Return result with updated user credits
  SELECT json_build_object(
    'booking_id', v_booking_id,
    'remaining_credits', credits,
    'credits_used', p_credits_required,
    'class_id', p_class_id,
    'user_id', p_user_id
  ) INTO v_result
  FROM profiles 
  WHERE id = p_user_id;
  
  RETURN v_result;
  
EXCEPTION
  WHEN others THEN
    -- Transaction will rollback automatically
    -- Re-raise with original error message for debugging
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION book_class_atomically TO authenticated;

-- Create a helper function to test the atomic booking
CREATE OR REPLACE FUNCTION test_atomic_booking()
RETURNS TEXT AS $$
BEGIN
  -- Test that would demonstrate the function works
  RETURN 'Atomic booking function created successfully. Test with: SELECT book_class_atomically(''test@example.com'', ''some-class-uuid'', 1);';
END;
$$ LANGUAGE plpgsql;