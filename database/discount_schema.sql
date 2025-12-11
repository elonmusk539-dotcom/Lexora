-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  code TEXT PRIMARY KEY,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  duration_months INTEGER DEFAULT 1, -- For 100% off, how long does it last?
  max_uses INTEGER, -- NULL means unlimited
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on discount_codes
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users (to check validity) 
-- OR strictly keep it server-side. 
-- For safety, let's keep it private and only accessible via service role (API).
-- So no policies for 'anon' or 'authenticated' meant for direct select.
-- Admin/Service role bypasses RLS.

-- Modify subscriptions table to support internal/discount subs
-- Add provider column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'provider') THEN 
        ALTER TABLE subscriptions ADD COLUMN provider TEXT DEFAULT 'dodo'; 
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'discount_code') THEN
        ALTER TABLE subscriptions ADD COLUMN discount_code TEXT REFERENCES discount_codes(code);
    END IF;
END $$;
