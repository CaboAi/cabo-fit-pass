-- Add missing Stripe-related columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_billing_date TIMESTAMPTZ;

-- Update existing profiles to have proper subscription status
UPDATE profiles 
SET subscription_status = CASE 
  WHEN subscription_tier = 'free' THEN 'inactive'
  ELSE 'active'
END
WHERE subscription_status IS NULL;

-- Create index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription ON profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- Add check constraint for subscription status
ALTER TABLE profiles 
ADD CONSTRAINT check_subscription_status 
CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due', 'unpaid'));
