-- Add Stripe Connect ID to gyms table
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT,
ADD COLUMN IF NOT EXISTS connect_onboarded_at TIMESTAMP WITH TIME ZONE;

-- Add index for Connect account lookups
CREATE INDEX IF NOT EXISTS idx_gyms_stripe_connect_id ON gyms(stripe_connect_id);

-- Add RLS policy for Connect account access
CREATE POLICY "Admin can view Connect account details" ON gyms
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Create Connect onboarding history table
CREATE TABLE IF NOT EXISTS connect_onboarding_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL,
  onboarding_status TEXT NOT NULL CHECK (onboarding_status IN ('started', 'completed', 'failed')),
  requirements_completed JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_connect_onboarding_gym_id ON connect_onboarding_history(gym_id);
CREATE INDEX idx_connect_onboarding_status ON connect_onboarding_history(onboarding_status);

-- Add RLS policies
ALTER TABLE connect_onboarding_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view onboarding history" ON connect_onboarding_history
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can create onboarding records" ON connect_onboarding_history
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
