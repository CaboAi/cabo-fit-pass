-- Create Tourist Passes table
CREATE TABLE IF NOT EXISTS tourist_passes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pass_type TEXT NOT NULL CHECK (pass_type IN ('3day', '7day', 'addon')),
  credits INTEGER NOT NULL,
  validity_days INTEGER NOT NULL,
  expires_after TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Tourist Pass Products table
CREATE TABLE IF NOT EXISTS tourist_pass_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pass_type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  credits INTEGER NOT NULL,
  validity_days INTEGER NOT NULL,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tourist pass products
INSERT INTO tourist_pass_products (pass_type, name, price, credits, validity_days) VALUES
  ('3day', '3-Day Tourist Pass', 50.00, 3, 7),
  ('addon', 'Additional Credit', 10.00, 1, 7);

-- Add indexes
CREATE INDEX idx_tourist_passes_user_id ON tourist_passes(user_id);
CREATE INDEX idx_tourist_passes_active ON tourist_passes(is_active);
CREATE INDEX idx_tourist_passes_expires ON tourist_passes(expires_after);

-- Add RLS policies
ALTER TABLE tourist_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tourist_pass_products ENABLE ROW LEVEL SECURITY;

-- Users can view their own passes
CREATE POLICY "Users can view own passes" ON tourist_passes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own passes
CREATE POLICY "Users can create own passes" ON tourist_passes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin can manage all passes
CREATE POLICY "Admin can manage all passes" ON tourist_passes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Anyone can view active products
CREATE POLICY "Anyone can view active products" ON tourist_pass_products
  FOR SELECT USING (is_active = true);

-- Admin can manage products
CREATE POLICY "Admin can manage products" ON tourist_pass_products
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
