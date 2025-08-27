-- FINAL CORRECTED Database Indexes - Based on REAL Schema
-- Run each command individually in Supabase SQL Editor

-- ========================================
-- FINAL CORRECTED INDEXES
-- ========================================

-- 1. User booking queries (REAL COLUMN: payment_status)
CREATE INDEX IF NOT EXISTS idx_bookings_user_payment_date 
ON bookings(user_id, payment_status, created_at) 
WHERE payment_status = 'paid';

-- 2. Class booking counts (REAL COLUMN: payment_status)
CREATE INDEX IF NOT EXISTS idx_bookings_class_paid 
ON bookings(class_id, payment_status) 
WHERE payment_status = 'paid';

-- 3. Already worked:
-- idx_gym_classes_active_type (SUCCESS)

-- 4. Already worked: 
-- idx_profiles_email (SUCCESS)

-- 5. User credits queries (REAL COLUMN: tier)
CREATE INDEX IF NOT EXISTS idx_profiles_credits_tier 
ON profiles(credits, tier);

-- 6. Already worked:
-- idx_gym_classes_gym_active (SUCCESS)

-- ========================================
-- ADDITIONAL PERFORMANCE INDEXES
-- ========================================

-- 7. Recent bookings for users
CREATE INDEX IF NOT EXISTS idx_bookings_user_recent 
ON bookings(user_id, created_at DESC);

-- 8. Class capacity and price queries
CREATE INDEX IF NOT EXISTS idx_classes_capacity_price 
ON classes(capacity, price);

-- 9. Classes by gym and time
CREATE INDEX IF NOT EXISTS idx_classes_gym_time 
ON classes(gym_id, start_time);

-- 10. Booking date range queries
CREATE INDEX IF NOT EXISTS idx_bookings_date_range 
ON bookings(booking_date);

-- ========================================
-- PERFORMANCE MONITORING VIEW
-- ========================================

CREATE OR REPLACE VIEW booking_performance_metrics AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as bookings_per_hour,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT class_id) as unique_classes
FROM bookings 
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND payment_status = 'paid'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

COMMENT ON VIEW booking_performance_metrics IS 'Hourly booking metrics for performance monitoring';