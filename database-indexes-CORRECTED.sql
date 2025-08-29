-- CORRECTED Database Indexes - Based on Actual Schema
-- Run each command individually in Supabase SQL Editor

-- ========================================
-- CORRECTED INDEXES (Run Each Separately)
-- ========================================

-- 1. Booking User Queries (CORRECTED: booking_status not status)
CREATE INDEX IF NOT EXISTS idx_bookings_user_status_date 
ON bookings(user_id, booking_status, created_at) 
WHERE booking_status = 'confirmed';

-- 2. Class Booking Counts (CORRECTED: using class_id directly)  
CREATE INDEX IF NOT EXISTS idx_bookings_class_confirmed 
ON bookings(class_id, booking_status) 
WHERE booking_status = 'confirmed';

-- 3. Active Gym Classes (CORRECTED: using is_active not active)
CREATE INDEX IF NOT EXISTS idx_gym_classes_active_type 
ON gym_classes(is_active, class_type) 
WHERE is_active = true;

-- 4. Profile Email Lookup (this one worked already)
-- CREATE INDEX IF NOT EXISTS idx_profiles_email 
-- ON profiles(email);  -- Already successful

-- 5. User Credits and Tier Queries
CREATE INDEX IF NOT EXISTS idx_profiles_credits_tier 
ON profiles(credits, subscription_tier);

-- ========================================
-- ADDITIONAL PERFORMANCE INDEXES
-- ========================================

-- 6. Gym Classes by Gym (for dashboard queries)
CREATE INDEX IF NOT EXISTS idx_gym_classes_gym_active 
ON gym_classes(gym_id, is_active) 
WHERE is_active = true;

-- 7. Recent Bookings (for user history)
CREATE INDEX IF NOT EXISTS idx_bookings_user_recent 
ON bookings(user_id, created_at DESC);

-- 8. Class Capacity Monitoring (for availability checks)
CREATE INDEX IF NOT EXISTS idx_gym_classes_capacity 
ON gym_classes(capacity, credit_cost) 
WHERE is_active = true;

-- ========================================
-- UNIQUE CONSTRAINT (Run After Indexes)
-- ========================================

-- Prevent duplicate bookings (already exists in schema)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_class_booking 
-- ON bookings(user_id, class_id);  -- Already exists as UNIQUE(user_id, class_id)