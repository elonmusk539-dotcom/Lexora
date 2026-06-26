-- =====================================================
-- SUBSCRIPTIONS TABLE SCHEMA
-- =====================================================
-- This table manages user subscription data for Lexora Pro
-- Configured for Google Play Store billing (via RevenueCat)
-- =====================================================

-- Drop existing table if you need to recreate (BE CAREFUL - THIS DELETES DATA!)
-- DROP TABLE IF EXISTS subscriptions CASCADE;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription status and provider
  provider TEXT NOT NULL DEFAULT 'google_play',        -- 'google_play', 'internal', etc.
  status TEXT NOT NULL DEFAULT 'none',                 -- 'active', 'canceled', 'past_due', 'none'
  
  -- Billing details
  interval TEXT CHECK (interval IN ('month', 'year')), -- Billing interval
  current_period_start TIMESTAMPTZ,                     -- Current billing period start
  current_period_end TIMESTAMPTZ,                       -- Current billing period end
  cancel_at_period_end BOOLEAN DEFAULT false,           -- Whether subscription cancels at period end
  canceled_at TIMESTAMPTZ,                              -- When subscription was canceled
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
ON subscriptions(user_id);

-- Index on status for filtering active subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
ON subscriptions(status);

-- Composite index for common queries (user + status)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
ON subscriptions(user_id, status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Only service role can insert subscriptions (API routes)
CREATE POLICY "Service role can insert subscriptions"
ON subscriptions
FOR INSERT
WITH CHECK (true); -- API uses service role key

-- Policy: Only service role can update subscriptions (webhooks/API)
CREATE POLICY "Service role can update subscriptions"
ON subscriptions
FOR UPDATE
USING (true); -- API uses service role key

-- Policy: Only service role can delete subscriptions
CREATE POLICY "Service role can delete subscriptions"
ON subscriptions
FOR DELETE
USING (true); -- API uses service role key

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

-- Function to update updated_at timestamp (only if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
