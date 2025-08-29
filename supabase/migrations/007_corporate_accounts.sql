-- Create Corporate Accounts table
CREATE TABLE IF NOT EXISTS corporate_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  discount_rate DECIMAL(5,2) NOT NULL DEFAULT 0.10,
  credit_balance INTEGER NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Corporate Sub-accounts table
CREATE TABLE IF NOT EXISTS corporate_sub_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  corporate_id UUID REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  allocated_credits INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_corporate_accounts_business_name ON corporate_accounts(business_name);
CREATE INDEX idx_corporate_accounts_active ON corporate_accounts(is_active);
CREATE INDEX idx_corporate_sub_accounts_corporate_id ON corporate_sub_accounts(corporate_id);
CREATE INDEX idx_corporate_sub_accounts_user_id ON corporate_sub_accounts(user_id);

-- Add RLS policies
ALTER TABLE corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_sub_accounts ENABLE ROW LEVEL SECURITY;

-- Admin can manage all corporate accounts
CREATE POLICY "Admin can manage corporate accounts" ON corporate_accounts
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Users can view their corporate sub-account
CREATE POLICY "Users can view own sub-account" ON corporate_sub_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Admin can manage all sub-accounts
CREATE POLICY "Admin can manage sub-accounts" ON corporate_sub_accounts
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
