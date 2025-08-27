-- Create basic tables without complex columns
BEGIN;

-- Create gyms table (basic version)
CREATE TABLE IF NOT EXISTS gyms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gym_classes table (basic version)
CREATE TABLE IF NOT EXISTS gym_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  credit_cost INTEGER NOT NULL DEFAULT 1,
  drop_in_rate DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table (basic version)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  class_id UUID REFERENCES gym_classes(id),
  credits_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payout_snapshots table (basic version)
CREATE TABLE IF NOT EXISTS payout_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_payouts DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add basic indexes
CREATE INDEX IF NOT EXISTS idx_gyms_name ON gyms(name);
CREATE INDEX IF NOT EXISTS idx_gym_classes_gym_id ON gym_classes(gym_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);

COMMIT;

-- Add Stripe Connect columns
BEGIN;

-- Add stripe_connect_id to gyms
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT;

-- Create index for Stripe Connect
CREATE INDEX IF NOT EXISTS idx_gyms_stripe_connect_id ON gyms(stripe_connect_id);

COMMIT;

-- Add role system (corrected for your schema)
BEGIN;

-- Create enum type for roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('user', 'gym_owner', 'admin');
  END IF;
END
$$;

-- Add the role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role public.user_role;

-- Set default
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';

-- Set all existing users to 'user' role (since you don't have user_type)
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Enforce NOT NULL
ALTER TABLE profiles ALTER COLUMN role SET NOT NULL;

-- Create index for role checks
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

COMMIT;

-- Enable RLS and add policies
BEGIN;

-- Enable RLS on all tables
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_snapshots ENABLE ROW LEVEL SECURITY;

-- Admin can manage all tables
CREATE POLICY "Admin can manage gyms" ON gyms
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage gym classes" ON gym_classes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage bookings" ON bookings
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage payouts" ON payout_snapshots
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Users can view active gyms (basic policy)
CREATE POLICY "Users can view gyms" ON gyms
  FOR SELECT USING (true);

COMMIT;

-- Make your user an admin
UPDATE profiles SET role = 'admin' WHERE email = 'cabofitpass@gmail.com';

-- Verify
SELECT email, role FROM profiles WHERE email = 'cabofitpass@gmail.com';
