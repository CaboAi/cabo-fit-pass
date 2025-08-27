-- Add freeze fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS frozen_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS freeze_fee DECIMAL(10,2) DEFAULT 5.00;

-- Create freeze history table
CREATE TABLE IF NOT EXISTS user_freeze_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('freeze', 'unfreeze')),
  frozen_until TIMESTAMP WITH TIME ZONE,
  fee_amount DECIMAL(10,2),
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_profiles_frozen ON profiles(is_frozen);
CREATE INDEX idx_user_freeze_history_user_id ON user_freeze_history(user_id);

-- Add RLS policies
ALTER TABLE user_freeze_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own freeze history
CREATE POLICY "Users can view own freeze history" ON user_freeze_history
  FOR SELECT USING (auth.uid() = user_id);

-- Admin can manage all freeze history
CREATE POLICY "Admin can manage freeze history" ON user_freeze_history
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
