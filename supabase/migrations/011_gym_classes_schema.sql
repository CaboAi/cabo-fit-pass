-- Create gym_classes table that's referenced in the booking system
CREATE TABLE IF NOT EXISTS gym_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  credit_cost INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  capacity INTEGER NOT NULL DEFAULT 20,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  class_type TEXT NOT NULL, -- 'yoga', 'pilates', 'strength', 'hiit', etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gym_classes_gym_id ON gym_classes(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_classes_type ON gym_classes(class_type);
CREATE INDEX IF NOT EXISTS idx_gym_classes_active ON gym_classes(is_active);

-- Enable Row Level Security
ALTER TABLE gym_classes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gym_classes
CREATE POLICY "Gyms can view own classes" ON gym_classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gyms 
      WHERE gyms.id = gym_classes.gym_id 
      AND gyms.stripe_connect_id IS NOT NULL
    )
  );

CREATE POLICY "Gyms can manage own classes" ON gym_classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM gyms 
      WHERE gyms.id = gym_classes.gym_id 
      AND gyms.stripe_connect_id IS NOT NULL
    )
  );

-- Create function to update gym_classes updated_at
CREATE OR REPLACE FUNCTION update_gym_classes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for gym_classes updated_at
CREATE TRIGGER update_gym_classes_updated_at
  BEFORE UPDATE ON gym_classes
  FOR EACH ROW
  EXECUTE FUNCTION update_gym_classes_updated_at();
