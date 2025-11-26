# Dodo Payments Integration Setup Guide

> **Lexora Pro Subscription System - Migrated from PayPal to Dodo Payments**

This guide provides step-by-step instructions for setting up Dodo Payments as the payment processor for Lexora Pro subscriptions.

---

## Table of Contents

1. [Overview](#overview)
2. [What Changed from PayPal](#what-changed-from-paypal)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Database Migration](#database-migration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## Overview

Lexora Pro now uses **Dodo Payments** instead of PayPal for subscription management. Dodo Payments provides:

- Global payment processing with 100+ payment methods
- Simple API integration
- Competitive transaction fees
- Better user experience for international users
- Real-time subscription management

### Pricing (Unchanged)

- **Monthly Plan:** $2.99/month
- **Yearly Plan:** $28.99/year ($2.41/month equivalent)

---

## What Changed from PayPal

### Removed Components

1. ❌ PayPal SDK integration (`Script` tag with PayPal SDK)
2. ❌ PayPal API routes (`/app/api/paypal/subscription`, `/app/api/paypal/cancel`)
3. ❌ PayPal environment variables (`NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_SECRET_KEY`, etc.)
4. ❌ PayPal subscription button rendering logic

### New Components

1. ✅ Dodo Payments API routes (`/app/api/dodo/subscription`, `/app/api/dodo/cancel`)
2. ✅ Dodo configuration file (`lib/dodo/config.ts`)
3. ✅ Dodo environment variables (`NEXT_PUBLIC_DODO_API_KEY`, `DODO_API_SECRET`, etc.)
4. ✅ Simple "Subscribe Now" button (without third-party SDK)

### Modified Files

1. `app/premium/page.tsx` - Removed PayPal SDK, replaced with Dodo integration
2. `lib/subscription/config.ts` - Updated plan ID environment variables
3. `components/SubscriptionManagement.tsx` - Updated cancel endpoint
4. Database schema - Added Dodo columns while keeping PayPal columns for backward compatibility

---

## Prerequisites

### 1. Dodo Payments Account

You'll need a **Dodo Payments business account**:

1. Visit [Dodo Payments Dashboard](https://dashboard.dodopayments.com)
2. Sign up for a business account (or log in if you have one)
3. Complete identity verification
4. Set up your business details and payout information

### 2. Required Information

You'll need the following from your Dodo Payments dashboard:

- **Public API Key** (`NEXT_PUBLIC_DODO_API_KEY`)
- **Secret API Key** (`DODO_API_SECRET`)
- **Monthly Plan ID** (`NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY`)
- **Yearly Plan ID** (`NEXT_PUBLIC_DODO_PLAN_ID_YEARLY`)

### 3. System Requirements

- Node.js 18+ (already installed)
- Next.js 15+ (already installed)
- Supabase account with database access

---

## Step-by-Step Setup

### Phase 1: Dodo Payments Configuration

#### Step 1: Create Dodo Payments Plans

1. Log in to [Dodo Payments Dashboard](https://dashboard.dodopayments.com)
2. Navigate to **Products** → **Create New Product**
3. Create two subscription plans:

**Plan 1: Lexora Pro Monthly**
- Name: `Lexora Pro - Monthly`
- Description: `Unlimited vocabulary lists and custom content`
- Price: `$2.99 USD`
- Billing Interval: `Monthly`
- Recurrence: `Enabled`
- Trial Period: `None` (or set your preferred trial)
- Save and note the **Plan ID** (e.g., `prod_monthly_xxx`)

**Plan 2: Lexora Pro Yearly**
- Name: `Lexora Pro - Yearly`
- Description: `Unlimited vocabulary lists and custom content (annual)`
- Price: `$28.99 USD`
- Billing Interval: `Yearly`
- Recurrence: `Enabled`
- Trial Period: `None` (or set your preferred trial)
- Save and note the **Plan ID** (e.g., `prod_yearly_xxx`)

#### Step 2: Get API Keys

1. Go to **Developers** → **API Keys** in your Dodo dashboard
2. Find or create a new API key pair:
   - **Public Key**: Copy this (starts with `pk_` in some systems)
   - **Secret Key**: Copy this (starts with `sk_` in some systems)
3. Keep these safe - you'll need them next

#### Step 3: Configure Webhook (Optional but Recommended)

For production, set up webhooks to handle subscription events:

1. Go to **Developers** → **Webhooks**
2. Add endpoint: `https://yourdomain.com/api/dodo/webhooks` (replace with your domain)
3. Subscribe to events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `invoice.paid`
   - `invoice.failed`

---

### Phase 2: Environment Variables Setup

#### Step 4: Update `.env.local`

Add these environment variables to your `.env.local` file:

```env
# Dodo Payments Configuration
NEXT_PUBLIC_DODO_API_KEY=pk_your_public_key_here
DODO_API_SECRET=sk_your_secret_key_here
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=prod_monthly_xxx
NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=prod_yearly_xxx

# Keep PayPal vars commented for reference (for existing subscriptions)
# NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
# PAYPAL_SECRET_KEY=...
# NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY=...
# NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY=...
```

**Where to find these values:**
- `NEXT_PUBLIC_DODO_API_KEY`: Dodo Dashboard → Developers → API Keys → Public Key
- `DODO_API_SECRET`: Dodo Dashboard → Developers → API Keys → Secret Key
- `NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY`: Plan ID from Step 1 (Monthly Plan)
- `NEXT_PUBLIC_DODO_PLAN_ID_YEARLY`: Plan ID from Step 1 (Yearly Plan)

#### Step 5: Update Production Environment Variables

For production deployment (Vercel, etc.):

1. Go to your hosting platform (e.g., Vercel)
2. Navigate to project **Settings** → **Environment Variables**
3. Add the same four variables above:
   ```
   NEXT_PUBLIC_DODO_API_KEY=pk_live_your_production_public_key
   DODO_API_SECRET=sk_live_your_production_secret_key
   NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=prod_live_monthly_xxx
   NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=prod_live_yearly_xxx
   ```

> **Important:** Use your **production API keys** for live deployments, not sandbox keys.

---

### Phase 3: Database Migration

#### Step 6: Run Database Migration

1. Open your Supabase SQL Editor
2. Copy the entire content from `lib/supabase/dodo-migration.sql`
3. Paste it into the Supabase SQL editor
4. Execute the script

**What this does:**
- Adds `dodo_subscription_id` column to subscriptions table
- Adds `dodo_plan_id` column to subscriptions table
- Creates indexes for fast lookups
- Keeps old PayPal columns for backward compatibility

**Verify the migration:**
```sql
SELECT * FROM subscriptions LIMIT 5;
```

You should see the new columns: `dodo_subscription_id` and `dodo_plan_id` (both NULL for existing records).

#### Step 7: Handle Existing PayPal Subscriptions (if any)

**If you have existing PayPal subscribers:**

Option A: **Grandfathered Transition** (Recommended)
- Let PayPal subscriptions continue until they expire naturally
- New subscriptions use Dodo
- Update payment method on renewal

Option B: **Manual Migration**
```sql
-- Mark active PayPal users as free tier (they'll need to re-subscribe with Dodo)
UPDATE subscriptions
SET status = 'canceled', cancel_at_period_end = true, canceled_at = NOW()
WHERE paypal_subscription_id IS NOT NULL 
  AND status = 'active'
  AND dodo_subscription_id IS NULL;
```

Option C: **Keep Both Systems Running**
- PayPal users continue on PayPal
- New users sign up with Dodo
- Later migrate PayPal users during a maintenance window

---

### Phase 4: Testing

#### Step 8: Test Development Environment

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Test the Premium Page:**
   - Navigate to `/premium`
   - Verify you see the pricing cards
   - Toggle between Monthly/Yearly
   - Click "Subscribe Now" (should work without errors)

3. **Test Subscription Creation:**
   - Log in as a test user
   - Click "Subscribe Now" for monthly plan
   - Verify subscription is created in Supabase:
     ```sql
     SELECT user_id, status, dodo_subscription_id, interval 
     FROM subscriptions 
     WHERE status = 'active'
     LIMIT 5;
     ```

4. **Test Subscription Cancellation:**
   - Go to Settings page
   - Click "Cancel Subscription"
   - Verify status changes to `canceled` in database
   - Verify `cancel_at_period_end` is true

#### Step 9: Test with Dodo Sandbox Mode (Optional)

If Dodo provides sandbox credentials:

1. Update `.env.local` with sandbox keys
2. Create test payment methods in Dodo sandbox
3. Run through full subscription flow
4. Verify webhooks are triggered (if configured)

---

## Database Migration

### Current Schema (After Migration)

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  
  -- Old PayPal columns (deprecated, kept for backward compatibility)
  paypal_subscription_id TEXT,
  paypal_plan_id TEXT,
  
  -- New Dodo Payments columns
  dodo_subscription_id TEXT,
  dodo_plan_id TEXT,
  
  -- Subscription details (used by both systems)
  status TEXT NOT NULL DEFAULT 'none', -- 'active', 'canceled', 'past_due', 'trialing', 'none'
  interval TEXT, -- 'month' or 'year'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_dodo_subscription_id ON subscriptions(dodo_subscription_id);
CREATE INDEX idx_subscriptions_dodo_plan_id ON subscriptions(dodo_plan_id);
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
```

### Future Cleanup (After Full Migration)

Once all PayPal subscriptions have expired:

```sql
ALTER TABLE subscriptions 
DROP COLUMN paypal_subscription_id,
DROP COLUMN paypal_plan_id;
```

---

## Testing Checklist

- [ ] Development server starts without errors
- [ ] Premium page loads and displays pricing
- [ ] Monthly/Yearly toggle works
- [ ] "Subscribe Now" button appears (not PayPal button)
- [ ] Clicking subscribe creates record in `subscriptions` table
- [ ] New subscription has `dodo_subscription_id` set
- [ ] New subscription has status = 'active'
- [ ] Cancel subscription endpoint works (`/api/dodo/cancel`)
- [ ] Canceling a subscription updates database correctly
- [ ] `cancel_at_period_end` is set to true after cancellation
- [ ] `canceled_at` timestamp is recorded
- [ ] Settings page shows "Subscription Cancelled" message after cancellation

---

## Troubleshooting

### Issue: "Subscription plan is not configured"

**Cause:** Missing or incorrect environment variables

**Solution:**
1. Check `.env.local` has all four DODO variables
2. Verify values match Dodo dashboard exactly
3. Restart dev server after changing `.env.local`
4. Check for typos in variable names

### Issue: Subscription not saving to database

**Cause:** Database connection or permission issue

**Solution:**
1. Verify Supabase service role key is set
2. Check RLS policies allow inserts on subscriptions table
3. Verify user_id exists in auth.users table
4. Check browser console for specific error message

### Issue: Cancel subscription fails

**Cause:** Missing API credentials or wrong endpoint

**Solution:**
1. Verify `DODO_API_SECRET` is set in environment
2. Check subscription has `dodo_subscription_id` (not NULL)
3. Verify Dodo API endpoint is correct
4. Check Dodo API credentials are valid

### Issue: Webhooks not working

**Cause:** Endpoint not configured or unreachable

**Solution:**
1. Verify webhook endpoint is publicly accessible
2. Check Dodo dashboard shows webhook delivery attempts
3. Review webhook logs in Dodo dashboard
4. Verify your domain is correct in webhook URL
5. Test endpoint with curl:
   ```bash
   curl -X POST https://yourdomain.com/api/dodo/webhooks \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

---

## Pricing

### Dodo Payments Fees

Confirm current fees with Dodo Payments support:
- Typical processing fees: 2.9% + $0.30 per transaction
- Subscription fees may differ
- International payments may have additional fees

### Your Pro Plans

- **Monthly:** $2.99 USD
- **Yearly:** $28.99 USD

Calculate your net revenue after Dodo fees.

---

## FAQ

### Q: Can existing PayPal users keep their subscriptions?

**A:** Yes! PayPal subscriptions continue working. The old PayPal columns are kept in the database for backward compatibility. When their subscription renews, you can either let them continue with PayPal or ask them to switch to Dodo.

### Q: How do I test payments without real money?

**A:** 
1. Check if Dodo offers sandbox mode
2. If yes, use sandbox API keys in `.env.local`
3. Use test payment cards provided by Dodo
4. Switch back to production keys for live deployments

### Q: What happens to users' Pro access during migration?

**A:** 
- Existing active subscriptions continue as-is
- New users sign up with Dodo
- Users can cancel anytime and lose Pro access after billing period ends
- There's no forced migration - users keep their current access

### Q: How do I handle refunds?

**A:** 
1. Contact Dodo support for refund processing
2. Update database record status after refund
3. Implement refund logic in `/api/dodo/cancel` if desired

### Q: Can I use both PayPal and Dodo simultaneously?

**A:** Yes! The database supports both. New users get Dodo, existing PayPal users keep PayPal. Eventually migrate everyone to Dodo when convenient.

### Q: What if Dodo Payments API goes down?

**A:** 
- Users can't subscribe during the outage
- Display error message: "Payment service temporarily unavailable"
- Implement retry logic with exponential backoff
- Set up monitoring to alert you of API issues

### Q: How do I process refunds?

**A:**
1. User requests refund in your app
2. Admin approves refund in Dodo dashboard
3. Dodo processes refund to customer
4. Update subscription status in database:
   ```sql
   UPDATE subscriptions 
   SET status = 'canceled', canceled_at = NOW()
   WHERE user_id = 'user_id_here';
   ```

### Q: Do I need webhooks?

**A:** 
- Optional for basic functionality
- Recommended for production to handle payment events
- Webhooks update subscription status automatically
- Without webhooks, status updates happen on-demand

---

## Support

### Dodo Payments Support
- Email: support@dodopayments.com
- Website: https://dodopayments.com
- Documentation: https://docs.dodopayments.com

### Your Application Support
- Check `app/api/dodo/` routes for implementation details
- Review `lib/dodo/config.ts` for configuration
- Check browser console and server logs for errors

---

## Next Steps

1. ✅ Set up Dodo Payments account
2. ✅ Create monthly and yearly subscription plans
3. ✅ Get API keys and plan IDs
4. ✅ Update `.env.local` and production environment
5. ✅ Run database migration
6. ✅ Test subscription creation and cancellation
7. ✅ Deploy to production
8. ✅ Monitor subscription flow and handle errors

---

## Files Modified

- `app/api/dodo/subscription/route.ts` - NEW (handles subscription creation)
- `app/api/dodo/cancel/route.ts` - NEW (handles subscription cancellation)
- `lib/dodo/config.ts` - NEW (Dodo configuration and helpers)
- `app/premium/page.tsx` - MODIFIED (replaced PayPal with Dodo)
- `lib/subscription/config.ts` - MODIFIED (updated environment variables)
- `components/SubscriptionManagement.tsx` - MODIFIED (updated cancel endpoint)
- `lib/supabase/dodo-migration.sql` - NEW (database migration)

---

**Last Updated:** November 2025
**Version:** 1.0
**Status:** Production Ready ✅
