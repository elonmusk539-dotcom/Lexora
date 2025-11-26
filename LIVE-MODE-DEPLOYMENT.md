# Dodo Payments - Live Mode Deployment Guide

## Overview

Your Lexora Premium subscription system is now configured to automatically switch between **Test Mode** (development) and **Live Mode** (production) based on your environment variables.

---

## Environment Detection Logic

The system automatically detects your environment:

```
If NODE_ENV=production AND NEXT_PUBLIC_APP_URL starts with https
  ↓
Use LIVE MODE: https://live.dodopayments.com
  ↓
Charge real credit cards


Otherwise
  ↓
Use TEST MODE: https://test.dodopayments.com
  ↓
Use Dodo test cards (no real charges)
```

---

## Current Setup (Development/Test)

**Server:** `http://localhost:3000` (local development)
**Dodo Environment:** TEST
**Test Cards Available:**
- Success: `4111 1111 1111 1111`
- Failed: `4000 0000 0000 0002`

---

## Deploying to Live Mode

Follow these steps to deploy with live Dodo payments:

### Step 1: Get Live Dodo Credentials

1. Go to **Dodo Dashboard** → **Settings** → **API Keys**
2. Switch to **LIVE MODE** (not test mode)
3. Copy your live API credentials:
   - **Live Publishable Key** (pk_live_...)
   - **Live API Key** (for server-side API calls)
   - **Live Plan IDs** (if different from test)
   - **Live Webhook Secret** (if using webhook verification)

### Step 2: Update Environment Variables

Update your deployment platform's environment variables with LIVE credentials:

**Example for Vercel:**

1. Go to: **Project Settings** → **Environment Variables**
2. Update/Add these variables:

```env
# ==========================================
# SUPABASE (Database)
# ==========================================
# Keep same as development (unless you have separate production DB)
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# ==========================================
# LIVE DODO CREDENTIALS
# ==========================================
# Get from Dodo Dashboard - LIVE MODE
NEXT_PUBLIC_DODO_API_KEY=pk_live_xxxxxxxxxxxxx
DODO_API_KEY=live_api_key_xxxxxxxxxxxxx
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_live_xxxxxxxxxxxxx

# LIVE Dodo Plan IDs (from your LIVE Dodo account products)
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=pdt_live_monthly_xxxxx
NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=pdt_live_yearly_xxxxx

# ==========================================
# APP URLS (your production domain)
# ==========================================
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_VERCEL_URL=https://your-domain.com

# ==========================================
# ENVIRONMENT (CRITICAL - must be production)
# ==========================================
NODE_ENV=production
```

### Step 3: Configure Webhooks in Dodo Dashboard

Dodo must send payment confirmation webhooks to your app:

1. **In Dodo Dashboard** → **Settings** → **Webhooks**
2. **Add new endpoint:**
   - **URL:** `https://your-domain.com/api/dodo/webhook`
   - **Events:** Select:
     - ✓ `checkout.session.completed`
     - ✓ `checkout.canceled`
     - ✓ `subscription.canceled`
   - **Secret:** Your webhook secret (if using verification)
   - **Status:** Active

3. **Test the webhook** in Dodo dashboard to ensure it's reachable

### Step 4: Update Plan IDs (If Different in Live)

If your live Dodo account has different plan IDs than test:

1. **In Dodo Dashboard** → **Products** → Note your LIVE plan IDs
2. Update environment variables: `NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY`, `NEXT_PUBLIC_DODO_PLAN_ID_YEARLY`

### Step 5: Deploy to Production

**For Vercel:**
```bash
git add .
git commit -m "Deploy Lexora Premium with live Dodo payments"
git push origin main
```

Vercel will automatically deploy with your production environment variables.

**For Other Platforms:**
- Ensure `NODE_ENV=production`
- Ensure your domain uses HTTPS
- Set all environment variables from Step 2
- Deploy your code

### Step 6: Verify Live Setup

After deployment:

1. **Test Payment Flow:**
   - Go to: `https://your-domain.com/premium`
   - Click "Subscribe Now"
   - Complete payment with a real credit card (or Dodo test card if available)
   - Should redirect to success page

2. **Check Server Logs:**
   - Look for: `Using Dodo environment: LIVE (https://live.dodopayments.com)`
   - Verify subscription saved to Supabase

3. **Check Supabase:**
   - Go to: `subscriptions` table
   - Verify new subscription record with `status='active'`

4. **Check Dodo Dashboard:**
   - Verify payment appears in transactions
   - Check webhook log shows successful delivery

---

## Reverting to Test Mode (If Needed)

To switch back to test mode:

1. Set `NODE_ENV=development` OR
2. Set `NEXT_PUBLIC_APP_URL=http://localhost:3000`

The system will automatically use `https://test.dodopayments.com`

---

## Key Files Modified

| File | Changes |
|------|---------|
| `app/api/dodo/subscription/route.ts` | Added environment detection: test vs live |
| `.env.local` | Contains test credentials (local only) |
| Deployment config | Contains live credentials (production only) |

---

## How It Works (Technical)

### Local Development (Test)
```
User clicks "Subscribe Now"
  ↓
POST /api/dodo/subscription
  ↓
Detects: NODE_ENV ≠ production OR URL is http://localhost:3000
  ↓
Calls: https://test.dodopayments.com/checkouts
  ↓
Test mode active - use test cards
```

### Production (Live)
```
User clicks "Subscribe Now"
  ↓
POST /api/dodo/subscription
  ↓
Detects: NODE_ENV = production AND URL is https://domain.com
  ↓
Calls: https://live.dodopayments.com/checkouts
  ↓
Live mode active - charges real cards
```

---

## Critical Checklist Before Going Live

- [ ] **API Keys:** Updated with LIVE keys from Dodo (not test keys)
- [ ] **Plan IDs:** Updated with LIVE plan IDs from Dodo
- [ ] **Webhook URL:** Configured in Dodo Dashboard as `https://your-domain.com/api/dodo/webhook`
- [ ] **Domain:** Using HTTPS (required for production)
- [ ] **NODE_ENV:** Set to `production` in deployment
- [ ] **NEXT_PUBLIC_APP_URL:** Set to your domain (starts with https)
- [ ] **Webhook Secret:** Updated with LIVE secret (if using verification)
- [ ] **Tested:** Full payment flow works end-to-end
- [ ] **Logs:** Confirm server shows "LIVE" mode, not "TEST"

---

## Troubleshooting

### "Using Dodo environment: TEST" in production logs

**Cause:** Environment variables not set correctly
**Fix:** Check:
- `NODE_ENV=production` is set
- `NEXT_PUBLIC_APP_URL` starts with `https://`
- Deployment restarted after env vars changed

### "Checkout session failed" error

**Cause:** Plan IDs don't exist in live account
**Fix:**
- Verify plan IDs in Dodo Dashboard
- Ensure you're using LIVE plan IDs (not test)
- Update environment variables

### "Webhook not received" / Subscription not saved

**Cause 1:** Webhook URL not configured in Dodo
**Fix:** Add webhook URL in Dodo Dashboard → Settings → Webhooks

**Cause 2:** Webhook URL not reachable
**Fix:** Verify HTTPS domain is publicly accessible

**Cause 3:** Webhook secret mismatch
**Fix:** Verify `DODO_PAYMENTS_WEBHOOK_SECRET` matches Dodo dashboard

### Payment completes but success page shows "Payment Failed"

**Cause:** Webhook not saving subscription
**Fix:** Check server logs for webhook processing errors

---

## Security Best Practices

1. **Never commit live credentials** to version control
2. **Use platform secrets** (Vercel/Render/etc) for sensitive keys
3. **Keep API keys private** - don't expose in frontend code
4. **Enable webhook signature verification** (see webhook handler)
5. **Use HTTPS** for all production URLs
6. **Rotate credentials regularly** if compromised

---

## Support

If you encounter issues:

1. Check server logs for environment detection message
2. Verify all environment variables are set
3. Test webhook delivery in Dodo Dashboard
4. Check Supabase for subscription records
5. Verify domain uses HTTPS and is publicly accessible

---

## What's Included

✅ Automatic test/live mode switching
✅ Dodo API integration (checkout sessions)
✅ Webhook handling (payment confirmation)
✅ Supabase subscription storage
✅ Success/failure page validation
✅ Environment-based configuration

---

## Next Steps

1. Gather live Dodo credentials
2. Update environment variables in your deployment platform
3. Configure webhooks in Dodo Dashboard
4. Deploy to production
5. Test with a real payment
6. Monitor logs and Supabase for confirmation
