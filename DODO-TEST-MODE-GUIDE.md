# 🧪 Dodo Payments Test Mode Setup Guide

**Complete guide to testing Dodo Payments in sandbox/test environment**

---

## ✨ What is Dodo Test Mode?

Dodo Payments provides a **test/sandbox mode** that allows you to:
- ✅ Test subscription creation without charging real cards
- ✅ Test cancellation without affecting live subscriptions
- ✅ Use fake payment cards
- ✅ Simulate different payment scenarios
- ✅ Verify your integration works before going live

**Key Point:** Test mode credentials are completely separate from live credentials. Your real customers are never affected.

---

## 🎯 Test Mode vs Live Mode Comparison

| Aspect | Test Mode | Live Mode |
|--------|-----------|-----------|
| **Real Money** | ❌ No | ✅ Yes |
| **Card Charges** | ❌ No | ✅ Yes |
| **Real Users** | ❌ No | ✅ Yes |
| **Credentials** | Separate | Production |
| **Database** | Separate | Production |
| **Use Case** | Development | Production |

---

## 📋 Test Mode Setup Steps

### Step 1: Create Dodo Test Mode Account

1. Go to **https://dashboard.dodopayments.com**
2. Sign up or log in with your existing account
3. Look for **"Test Mode"** toggle in the dashboard (usually top right)
4. Switch to **Test Mode** ✓

**What You'll See:**
- Dashboard labeled "TEST MODE"
- Sandbox API endpoints
- Test credentials

### Step 2: Create Test Subscription Plans

In **Test Mode Dashboard:**

#### Plan 1: Monthly Plan
1. Go to **"Plans"** or **"Subscription Plans"**
2. Click **"Create New Plan"**
3. Fill in details:
   - **Name:** `Pro Monthly (Test)`
   - **Amount:** `299` (cents = $2.99)
   - **Currency:** `USD`
   - **Billing Interval:** `Monthly`
   - **Interval Count:** `1`
4. Click **"Create Plan"**
5. **Copy the Plan ID** (looks like `plan_test_xxxxx`)

#### Plan 2: Yearly Plan
1. Click **"Create New Plan"** again
2. Fill in details:
   - **Name:** `Pro Yearly (Test)`
   - **Amount:** `2899` (cents = $28.99)
   - **Currency:** `USD`
   - **Billing Interval:** `Yearly`
   - **Interval Count:** `1`
3. Click **"Create Plan"**
4. **Copy the Plan ID** (looks like `plan_test_xxxxx`)

### Step 3: Get Test Mode API Credentials

In **Test Mode Dashboard:**

1. Go to **"Settings"** → **"API Keys"** (or similar)
2. You'll see two types of keys:

#### Public API Key (Test)
- **Label:** `pk_test_...` or `DODO_PUBLIC_TEST_KEY`
- **Usage:** Frontend (safe to expose)
- **Copy this value** ✓

#### Secret API Key (Test)
- **Label:** `sk_test_...` or `DODO_SECRET_TEST_KEY`
- **Usage:** Backend only (keep private)
- **Copy this value** ✓

**Security Note:** Never commit these keys to Git. Use environment variables.

### Step 4: Configure Environment Variables

Update your `.env.local` file with test mode credentials:

```bash
# Dodo Test Mode Credentials
NEXT_PUBLIC_DODO_API_KEY=pk_test_xxxxxxxxxxxxx
DODO_API_SECRET=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=plan_test_xxxxxxxxxxxxx
NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=plan_test_xxxxxxxxxxxxx

# Test Mode Flag (optional, for tracking)
NEXT_PUBLIC_DODO_MODE=test
```

**After updating .env.local:**
1. Stop your dev server
2. Restart: `npm run dev`
3. New environment variables are now loaded ✓

### Step 5: Update Supabase for Test Data

Optional but recommended: Create a separate Supabase schema or use a test database.

This keeps test subscriptions separate from production:

```sql
-- Add test flag to subscriptions (optional)
ALTER TABLE subscriptions 
ADD COLUMN is_test_subscription BOOLEAN DEFAULT false;

-- Update comments
COMMENT ON COLUMN subscriptions.is_test_subscription IS 
'Flag to mark test/sandbox subscriptions created during development';

-- Create index for filtering
CREATE INDEX idx_subscriptions_is_test 
ON subscriptions(is_test_subscription) 
WHERE is_test_subscription = true;
```

---

## 💳 Test Credit Cards

Use these test cards in test mode (they will NOT charge):

### Successful Subscription
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
```
**Result:** ✅ Payment succeeds

### Declined Card
```
Card Number: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
```
**Result:** ❌ Payment declined

### Insufficient Funds
```
Card Number: 4000 0000 0000 9995
Expiry: Any future date
CVC: Any 3 digits
```
**Result:** ❌ Insufficient funds error

---

## 🧪 Testing Your Integration

### Test Scenario 1: Successful Subscription

1. Open your app on `http://localhost:3000`
2. Go to **Premium/Pro** page
3. Click **"Subscribe Now"** button
4. Select **Monthly** plan
5. Use test card: `4111 1111 1111 1111`
6. Complete payment
7. **Verify:**
   - ✅ Payment succeeds
   - ✅ Supabase record created with `dodo_subscription_id`
   - ✅ User marked as Pro tier
   - ✅ Redirect to success page

### Test Scenario 2: Test Yearly Subscription

1. Go to **Premium/Pro** page
2. Click **"Subscribe Now"** button
3. Select **Yearly** plan
4. Use test card: `4111 1111 1111 1111`
5. Complete payment
6. **Verify:**
   - ✅ Yearly subscription created
   - ✅ `dodo_plan_id_yearly` matches configuration
   - ✅ User has Pro access

### Test Scenario 3: Payment Declined

1. Go to **Premium/Pro** page
2. Click **"Subscribe Now"** button
3. Select any plan
4. Use declined test card: `4000 0000 0000 0002`
5. **Verify:**
   - ✅ Payment fails gracefully
   - ✅ Error message displayed
   - ✅ No database record created
   - ✅ User remains on Free tier

### Test Scenario 4: Cancellation

1. Subscribe successfully first (using test card)
2. Go to **Settings** → **Subscription**
3. Click **"Cancel Subscription"**
4. Confirm cancellation
5. **Verify:**
   - ✅ API call to `/api/dodo/cancel` succeeds
   - ✅ Supabase updated: `status='canceled'`
   - ✅ `cancel_at_period_end=true`
   - ✅ User downgraded to Free tier
   - ✅ UI updates correctly

---

## 🔧 Code Configuration for Test Mode

### Option 1: Environment Variables (Recommended)

In `lib/dodo/config.ts`, the code already uses environment variables:

```typescript
// This automatically uses test credentials if you set them in .env.local
export const DODO_CONFIG = {
  apiBase: 'https://api.dodopayments.com', // Works for both test & live
  // ...
  publicKey: process.env.NEXT_PUBLIC_DODO_API_KEY || '', // Uses test key
};

export function getDodoHeaders() {
  const apiKey = process.env.DODO_API_KEY;
  const apiSecret = process.env.DODO_API_SECRET;
  // Uses test secret automatically
}
```

**No code changes needed!** Just use test credentials in `.env.local`.

### Option 2: Add Test Mode Detection (Optional)

If you want to explicitly show test mode status in your app:

```typescript
// lib/dodo/config.ts - Add this function

export function getDodoMode() {
  const isTest = process.env.NEXT_PUBLIC_DODO_MODE === 'test';
  return isTest ? 'TEST' : 'LIVE';
}

export function isTestMode() {
  return process.env.NEXT_PUBLIC_DODO_MODE === 'test';
}
```

Then use it in your UI:

```typescript
// In your Premium page or component
import { isTestMode } from '@/lib/dodo/config';

export default function PremiumPage() {
  const testMode = isTestMode();
  
  return (
    <div>
      {testMode && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
          🧪 <strong>Test Mode Active</strong> - Subscriptions won't charge real cards
        </div>
      )}
      {/* Rest of premium page */}
    </div>
  );
}
```

---

## 📊 Monitoring Test Subscriptions

### In Dodo Dashboard

1. Go to **Test Mode Dashboard**
2. Check **"Subscriptions"** section
3. You'll see all test subscriptions you created
4. Status updates in real-time

### In Supabase

Query test subscriptions:

```sql
-- See all test subscriptions
SELECT * FROM subscriptions 
WHERE dodo_subscription_id IS NOT NULL 
AND status = 'active'
ORDER BY created_at DESC;

-- See cancelled test subscriptions
SELECT * FROM subscriptions 
WHERE dodo_subscription_id IS NOT NULL 
AND status = 'canceled'
ORDER BY created_at DESC;

-- Count test subscriptions by plan
SELECT 
  dodo_plan_id,
  COUNT(*) as count,
  status
FROM subscriptions
WHERE dodo_subscription_id IS NOT NULL
GROUP BY dodo_plan_id, status;
```

### In Logs

Check browser console and server logs:

```
Frontend (Browser Console):
✅ Subscription created: sub_test_xxxxx
❌ Payment failed: Card declined

Backend (Terminal):
POST /api/dodo/subscription - 200 OK
POST /api/dodo/cancel - 200 OK
```

---

## 🔄 Switching Between Test and Live

### Step 1: Get Live Credentials

1. In Dodo Dashboard, toggle **OFF** Test Mode
2. Go to **"Settings"** → **"API Keys"**
3. Copy **Live API Key** (`pk_live_...`)
4. Copy **Live Secret Key** (`sk_live_...`)

### Step 2: Create Live Plans

1. Go to **"Plans"** in Live mode
2. Create **Monthly Plan** (same setup as test)
3. Create **Yearly Plan** (same setup as test)
4. Copy both Plan IDs

### Step 3: Update Environment

Update `.env.local`:

```bash
# Switch to Live Mode Credentials
NEXT_PUBLIC_DODO_API_KEY=pk_live_xxxxxxxxxxxxx
DODO_API_SECRET=sk_live_xxxxxxxxxxxxx
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=plan_live_xxxxxxxxxxxxx
NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=plan_live_xxxxxxxxxxxxx

# Update mode flag
NEXT_PUBLIC_DODO_MODE=live
```

### Step 4: Restart Dev Server

```bash
# Stop current dev server (Ctrl+C)
# Restart
npm run dev
```

**Now you're using live credentials!**

---

## ⚠️ Test Mode Best Practices

### ✅ DO

- [x] Test everything in test mode before going live
- [x] Use test cards for all testing
- [x] Verify error handling with declined cards
- [x] Test cancellation workflow
- [x] Check database records are correct
- [x] Monitor Dodo dashboard for activity
- [x] Document test results
- [x] Have live credentials ready before deploying

### ❌ DON'T

- [ ] Don't use live credentials in development
- [ ] Don't test with real credit cards
- [ ] Don't mix test and live environment variables
- [ ] Don't commit credentials to Git (use .env.local)
- [ ] Don't skip testing before going live
- [ ] Don't keep test mode on in production

---

## 🐛 Common Test Mode Issues

### Issue: "Invalid Plan ID"

**Cause:** Using test plan ID with live credentials (or vice versa)

**Fix:**
```bash
# Ensure test mode credentials:
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=plan_test_xxxxx  # Must start with plan_test
```

### Issue: "API Authentication Failed"

**Cause:** Wrong API credentials or not restarted dev server

**Fix:**
1. Verify credentials in `.env.local`
2. Stop dev server (Ctrl+C)
3. Restart: `npm run dev`
4. Check console for validation errors

### Issue: Database Not Updating

**Cause:** Supabase credentials not configured

**Fix:**
```bash
# Verify in .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### Issue: Payment Always Declines

**Cause:** Using wrong test card or incorrect card details

**Fix:**
```
Use this test card:
4111 1111 1111 1111
Expiry: 12/25
CVC: 123
```

---

## 📝 Test Checklist

Use this checklist to verify everything works:

### Credentials Setup
- [ ] Test API Key obtained from Dodo
- [ ] Test Secret Key obtained from Dodo
- [ ] Test Monthly Plan ID created
- [ ] Test Yearly Plan ID created
- [ ] All credentials added to `.env.local`
- [ ] Dev server restarted

### Monthly Subscription
- [ ] Can create monthly subscription
- [ ] Test card accepted
- [ ] Supabase record created
- [ ] `dodo_subscription_id` populated
- [ ] User can see Pro badge
- [ ] Success page shown

### Yearly Subscription
- [ ] Can create yearly subscription
- [ ] Test card accepted
- [ ] Supabase record created
- [ ] `dodo_plan_id_yearly` correct
- [ ] User can see Pro badge
- [ ] Success page shown

### Error Handling
- [ ] Declined card shows error
- [ ] No database record on failure
- [ ] Error message clear to user
- [ ] User stays on payment page

### Cancellation
- [ ] Can cancel active subscription
- [ ] Supabase updated with `canceled` status
- [ ] `cancel_at_period_end` set to true
- [ ] User downgraded to Free tier
- [ ] Settings page reflects change

### Integration
- [ ] Logs show successful operations
- [ ] No console errors
- [ ] No 500 errors in logs
- [ ] Dodo dashboard shows test subscriptions
- [ ] Feature flags work correctly

---

## 🚀 When Ready for Production

Once all test mode checks pass:

1. ✅ Get live Dodo credentials
2. ✅ Create live subscription plans
3. ✅ Update `.env.local` with live credentials
4. ✅ Test one more time with live credentials
5. ✅ Update production environment variables
6. ✅ Deploy to production
7. ✅ Monitor live transactions
8. ✅ Handle any live issues

---

## 📞 Support & Resources

### Dodo Payments
- **Website:** https://dodopayments.com
- **Dashboard:** https://dashboard.dodopayments.com
- **Docs:** https://docs.dodopayments.com
- **Test Mode Guide:** https://docs.dodopayments.com/testing

### Your Application
- **Premium Page:** `app/premium/page.tsx`
- **Subscription Route:** `app/api/dodo/subscription/route.ts`
- **Cancel Route:** `app/api/dodo/cancel/route.ts`
- **Config:** `lib/dodo/config.ts`

---

## ✅ Ready to Test!

You now have everything needed to:
1. ✅ Set up Dodo test mode
2. ✅ Create test subscription plans
3. ✅ Get test credentials
4. ✅ Configure your application
5. ✅ Test all payment scenarios
6. ✅ Verify integration works
7. ✅ Deploy with confidence

**Next Step:** Create your Dodo test account and follow Step 1 above! 🎉

---

**Good luck testing! Questions? Refer to this guide or the main DODO-PAYMENTS-SETUP.md**
