-- Migration 004: Payout Snapshots Table
-- This migration creates a table to store historical payout calculations

-- Create payout_snapshots table
CREATE TABLE IF NOT EXISTS payout_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gym_payouts JSONB NOT NULL, -- Array of GymPayout objects
  summary JSONB NOT NULL, -- Summary statistics
  total_revenue DECIMAL(10,2) NOT NULL,
  total_payouts DECIMAL(10,2) NOT NULL,
  total_gyms INTEGER NOT NULL,
  total_bookings INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT, -- User who generated the report
  
  -- Indexes for performance
  INDEX idx_payout_snapshots_period (period_start, period_end),
  INDEX idx_payout_snapshots_created_at (created_at)
);

-- Enable RLS
ALTER TABLE payout_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies - only admin/service role can access
CREATE POLICY "Service role has full access to payout snapshots" ON payout_snapshots
  FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Studio owners can view payout snapshots" ON payout_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND user_type = 'studio_owner'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE payout_snapshots IS 'Historical payout calculation snapshots for auditing and reporting';
COMMENT ON COLUMN payout_snapshots.gym_payouts IS 'Array of GymPayout objects with detailed breakdown per gym';
COMMENT ON COLUMN payout_snapshots.summary IS 'Summary statistics for the payout period';
COMMENT ON COLUMN payout_snapshots.period_start IS 'Start date of the payout period (inclusive)';
COMMENT ON COLUMN payout_snapshots.period_end IS 'End date of the payout period (inclusive)';

-- Create a view for easy querying of recent payouts
CREATE OR REPLACE VIEW recent_payouts AS
SELECT 
  id,
  period_start,
  period_end,
  total_revenue,
  total_payouts,
  total_gyms,
  total_bookings,
  created_at,
  (summary->>'average_payout_percentage')::decimal as avg_payout_percentage
FROM payout_snapshots
ORDER BY created_at DESC
LIMIT 50;

-- Grant access to the view
GRANT SELECT ON recent_payouts TO authenticated;

-- Create function to get payout summary for a date range
CREATE OR REPLACE FUNCTION get_payout_summary(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  total_classes INTEGER,
  total_attended INTEGER,
  total_revenue DECIMAL(10,2),
  total_payouts DECIMAL(10,2),
  gym_count INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT b.class_id)::INTEGER as total_classes,
    COUNT(b.id)::INTEGER as total_attended,
    COALESCE(SUM(c.price), 0)::DECIMAL(10,2) as total_revenue,
    COALESCE(SUM(c.price * 0.70), 0)::DECIMAL(10,2) as total_payouts,
    COUNT(DISTINCT c.gym_id)::INTEGER as gym_count
  FROM bookings b
  JOIN classes c ON b.class_id = c.id
  WHERE b.attended = TRUE
    AND b.booking_status = 'completed'
    AND c.start_time::DATE BETWEEN start_date AND end_date;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_payout_summary(DATE, DATE) TO service_role;

-- Create function to get gym payout details
CREATE OR REPLACE FUNCTION get_gym_payout_details(
  gym_id_param UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  class_id UUID,
  class_title TEXT,
  class_date DATE,
  attendees BIGINT,
  revenue DECIMAL(10,2),
  payout DECIMAL(10,2)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as class_id,
    c.title as class_title,
    c.start_time::DATE as class_date,
    COUNT(b.id) as attendees,
    COALESCE(SUM(c.price), 0)::DECIMAL(10,2) as revenue,
    COALESCE(SUM(c.price * 0.70), 0)::DECIMAL(10,2) as payout
  FROM classes c
  LEFT JOIN bookings b ON c.id = b.class_id 
    AND b.attended = TRUE 
    AND b.booking_status = 'completed'
  WHERE c.gym_id = gym_id_param
    AND c.start_time::DATE BETWEEN start_date AND end_date
  GROUP BY c.id, c.title, c.start_time::DATE
  ORDER BY c.start_time::DATE DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_gym_payout_details(UUID, DATE, DATE) TO service_role;

-- Create indexes for better performance on bookings queries
CREATE INDEX IF NOT EXISTS idx_bookings_attended ON bookings(attended) WHERE attended = TRUE;
CREATE INDEX IF NOT EXISTS idx_bookings_status_attended ON bookings(booking_status, attended);
CREATE INDEX IF NOT EXISTS idx_classes_start_time_date ON classes((start_time::DATE));
CREATE INDEX IF NOT EXISTS idx_classes_gym_start_time ON classes(gym_id, start_time);

-- Insert sample payout snapshot (for testing)
INSERT INTO payout_snapshots (
  period_start,
  period_end,
  gym_payouts,
  summary,
  total_revenue,
  total_payouts,
  total_gyms,
  total_bookings,
  created_by
) VALUES (
  CURRENT_DATE - INTERVAL '14 days',
  CURRENT_DATE,
  '[]'::jsonb,
  jsonb_build_object(
    'period_start', CURRENT_DATE - INTERVAL '14 days',
    'period_end', CURRENT_DATE,
    'total_gyms', 0,
    'total_bookings', 0,
    'total_revenue', 0,
    'total_payouts', 0,
    'average_payout_percentage', 0.70
  ),
  0,
  0,
  0,
  0,
  'system_initialization'
) ON CONFLICT DO NOTHING;