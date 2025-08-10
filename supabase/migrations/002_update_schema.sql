-- Update schema to match application structure

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS studios CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table (updated structure)
CREATE TABLE profiles (
  id TEXT PRIMARY KEY, -- Using email as primary key to match auth
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  credits INTEGER DEFAULT 5, -- Start with 5 free credits
  tier TEXT CHECK (tier IN ('basic', 'premium', 'unlimited')) DEFAULT 'basic',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create studios table
CREATE TABLE studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create classes table (updated structure)
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES studios(id), -- renamed from studio_id
  title TEXT NOT NULL, -- renamed from name
  instructor TEXT,
  difficulty TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  capacity INTEGER DEFAULT 20, -- renamed from max_capacity
  price DECIMAL(10,2) DEFAULT 15.00, -- Added price in MXN
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table (updated structure)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'drop-in',
  payment_status TEXT DEFAULT 'paid',
  booking_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, class_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = current_setting('request.jwt.claims', true)::json->>'email');

-- Create policies for public data
CREATE POLICY "Studios are viewable by everyone" ON studios
  FOR SELECT USING (true);

CREATE POLICY "Classes are viewable by everyone" ON classes
  FOR SELECT USING (true);

-- Create policies for bookings
CREATE POLICY "Users can view all bookings" ON bookings
  FOR SELECT USING (true);

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- Insert sample data
INSERT INTO studios (id, name, location) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Cabo Fitness Center', 'Downtown Cabo San Lucas'),
  ('00000000-0000-0000-0000-000000000002', 'Beachside Yoga Studio', 'Medano Beach'),
  ('00000000-0000-0000-0000-000000000003', 'Los Cabos CrossFit', 'San José del Cabo');

-- Insert sample classes
INSERT INTO classes (gym_id, title, instructor, difficulty, start_time, end_time, capacity, price) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Morning Yoga', 'Maria Lopez', 'Beginner', '2024-12-20 08:00:00+00', '2024-12-20 09:00:00+00', 20, 15.00),
  ('00000000-0000-0000-0000-000000000002', 'Sunset Beach Yoga', 'Carlos Martinez', 'Intermediate', '2024-12-20 18:00:00+00', '2024-12-20 19:00:00+00', 15, 25.00),
  ('00000000-0000-0000-0000-000000000003', 'CrossFit WOD', 'Ana Rodriguez', 'Advanced', '2024-12-20 07:00:00+00', '2024-12-20 08:00:00+00', 12, 30.00),
  ('00000000-0000-0000-0000-000000000001', 'Pilates Class', 'Sofia Hernandez', 'Intermediate', '2024-12-20 10:00:00+00', '2024-12-20 11:00:00+00', 15, 20.00),
  ('00000000-0000-0000-0000-000000000002', 'Vinyasa Flow', 'Diego Ramirez', 'Beginner', '2024-12-20 16:00:00+00', '2024-12-20 17:30:00+00', 18, 18.00);