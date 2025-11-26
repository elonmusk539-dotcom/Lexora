-- Supabase Database Migration: PayPal to Dodo Payments
-- This migration updates the subscriptions table to use Dodo Payments instead of PayPal
-- Run this in your Supabase SQL editor

-- Step 1: Add new Dodo columns to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN dodo_subscription_id TEXT,
ADD COLUMN dodo_plan_id TEXT;

-- Step 2: Migrate existing PayPal data to Dodo columns (if any)
-- Note: This is a data mapping. In practice, you'll need to manually set these values
-- or use a data migration script if you have existing PayPal subscriptions
UPDATE subscriptions
SET 
  dodo_subscription_id = NULL,  -- PayPal subscriptions don't directly map to Dodo
  dodo_plan_id = NULL
WHERE paypal_subscription_id IS NOT NULL AND dodo_subscription_id IS NULL;

-- Step 3: Make old PayPal columns nullable (for backward compatibility during transition)
-- They're already nullable, so this is just for reference

-- Step 4: Create indexes for Dodo columns (for fast lookups)
CREATE INDEX idx_subscriptions_dodo_subscription_id 
ON subscriptions(dodo_subscription_id);

CREATE INDEX idx_subscriptions_dodo_plan_id 
ON subscriptions(dodo_plan_id);

-- Step 5: View the current subscriptions table structure
-- SELECT * FROM subscriptions LIMIT 5;

-- ====================================================================
-- IMPORTANT NOTES:
-- ====================================================================
-- 1. The old PayPal columns (paypal_subscription_id, paypal_plan_id) are 
--    left in place for backward compatibility. They will be NULL for new Dodo subscriptions.
--
-- 2. If you have existing PayPal subscriptions and want to migrate them to Dodo:
--    - You'll need to manually update users with new Dodo subscription IDs
--    - Or set their status to 'none' and let them resubscribe with Dodo
--    - Or create a migration script to map PayPal subscription IDs to Dodo equivalents
--
-- 3. Future cleanup (optional, after full migration to Dodo):
--    ALTER TABLE subscriptions DROP COLUMN paypal_subscription_id;
--    ALTER TABLE subscriptions DROP COLUMN paypal_plan_id;
--
-- 4. Full subscriptions table schema after this migration:
--    - id (UUID, primary key)
--    - user_id (UUID, foreign key to auth.users, unique)
--    - paypal_subscription_id (TEXT, NULL) - DEPRECATED
--    - paypal_plan_id (TEXT, NULL) - DEPRECATED
--    - dodo_subscription_id (TEXT, NULL) - NEW
--    - dodo_plan_id (TEXT, NULL) - NEW
--    - status (TEXT) - 'active', 'canceled', 'past_due', 'trialing', 'none'
--    - interval (TEXT) - 'month' or 'year'
--    - current_period_start (TIMESTAMPTZ)
--    - current_period_end (TIMESTAMPTZ)
--    - cancel_at_period_end (BOOLEAN)
--    - canceled_at (TIMESTAMPTZ)
--    - created_at (TIMESTAMPTZ)
--    - updated_at (TIMESTAMPTZ)
