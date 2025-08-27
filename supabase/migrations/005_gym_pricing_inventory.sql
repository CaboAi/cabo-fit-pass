-- Create Gyms table
CREATE TABLE IF NOT EXISTS gyms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  drop_in_rate DECIMAL(10,2) NOT NULL,
  pack_prices JSONB NOT NULL DEFAULT '{}',
  capacity INTEGER NOT NULL DEFAULT 20,
  peak_hours JSONB NOT NULL DEFAULT '{"start": "18:00", "end": "20:00"}',
  off_peak_hours JSONB NOT NULL DEFAULT '{"start": "06:00", "end": "18:00"}',
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Gym Classes table for class-specific pricing
CREATE TABLE IF NOT EXISTS gym_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  credit_cost INTEGER NOT NULL DEFAULT 1,
  drop_in_rate DECIMAL(10,2) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 20,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_gyms_name ON gyms(name);
CREATE INDEX idx_gym_classes_gym_id ON gym_classes(gym_id);
CREATE INDEX idx_gym_classes_active ON gym_classes(is_active);

-- Add RLS policies
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_classes ENABLE ROW LEVEL SECURITY;

-- Admin can manage all gyms
CREATE POLICY "Admin can manage gyms" ON gyms
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Users can view active gyms
CREATE POLICY "Users can view active gyms" ON gyms
  FOR SELECT USING (is_active = true);

-- Admin can manage all gym classes
CREATE POLICY "Admin can manage gym classes" ON gym_classes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Users can view active gym classes
CREATE POLICY "Users can view active gym classes" ON gym_classes
  FOR SELECT USING (is_active = true);
