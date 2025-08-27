-- Create user_credit_wallet table
CREATE TABLE IF NOT EXISTS user_credit_wallet (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  monthly_alloc INTEGER NOT NULL DEFAULT 0,
  monthly_rollover INTEGER NOT NULL DEFAULT 0,
  topup_available INTEGER NOT NULL DEFAULT 0,
  topup_expires_at TIMESTAMP WITH TIME ZONE,
  tier TEXT NOT NULL DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create credit_ledger table for transaction tracking
CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
  class_id UUID REFERENCES gym_classes(id) ON DELETE SET NULL,
  delta INTEGER NOT NULL, -- positive for credits added, negative for credits consumed
  reason TEXT NOT NULL, -- 'subscription', 'topup', 'booking', 'expiration', 'rollover'
  balance_after INTEGER NOT NULL,
  payable_to_gym_cents INTEGER NOT NULL DEFAULT 0, -- amount owed to gym in cents
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES gym_classes(id) ON DELETE CASCADE NOT NULL,
  credits_consumed INTEGER NOT NULL,
  booking_date DATE NOT NULL,
  class_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gym_payouts table
CREATE TABLE IF NOT EXISTS gym_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_credits_consumed INTEGER NOT NULL DEFAULT 0,
  total_payable_cents INTEGER NOT NULL DEFAULT 0,
  stripe_payout_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add stripe_connect_id to gyms table
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credit_wallet_user_id ON user_credit_wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id ON credit_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_gym_id ON credit_ledger(gym_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_gym_id ON bookings(gym_id);
CREATE INDEX IF NOT EXISTS idx_bookings_class_id ON bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_gym_payouts_gym_id ON gym_payouts(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_payouts_period ON gym_payouts(period_start, period_end);

-- Enable Row Level Security
ALTER TABLE user_credit_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credit_wallet
CREATE POLICY "Users can view own wallet" ON user_credit_wallet
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON user_credit_wallet
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallet records" ON user_credit_wallet
  FOR INSERT WITH CHECK (true);

-- RLS Policies for credit_ledger
CREATE POLICY "Users can view own ledger" ON credit_ledger
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert ledger records" ON credit_ledger
  FOR INSERT WITH CHECK (true);

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Gyms can view their bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gyms 
      WHERE gyms.id = bookings.gym_id 
      AND gyms.stripe_connect_id IS NOT NULL
    )
  );

-- RLS Policies for gym_payouts
CREATE POLICY "Gyms can view own payouts" ON gym_payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gyms 
      WHERE gyms.id = gym_payouts.gym_id 
      AND gyms.stripe_connect_id IS NOT NULL
    )
  );

CREATE POLICY "System can insert payout records" ON gym_payouts
  FOR INSERT WITH CHECK (true);

-- Create function to update wallet updated_at
CREATE OR REPLACE FUNCTION update_wallet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for wallet updated_at
CREATE TRIGGER update_wallet_updated_at
  BEFORE UPDATE ON user_credit_wallet
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_updated_at();

-- Create function to update bookings updated_at
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bookings updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();
