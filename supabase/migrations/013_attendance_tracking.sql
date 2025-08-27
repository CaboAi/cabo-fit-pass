-- Add attendance tracking to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS attended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS marked_by UUID REFERENCES profiles(id);

-- Add index for attendance queries
CREATE INDEX IF NOT EXISTS idx_bookings_attended ON bookings(attended, attended_at);

-- Update credit_ledger to track payout status
ALTER TABLE credit_ledger 
ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'transferred', 'failed')),
ADD COLUMN IF NOT EXISTS payout_id UUID REFERENCES gym_payouts(id);

-- Add index for payout queries
CREATE INDEX IF NOT EXISTS idx_credit_ledger_payout_status ON credit_ledger(payout_status, gym_id);
