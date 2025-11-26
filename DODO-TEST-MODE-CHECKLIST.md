# 🧪 Dodo Test Mode - Quick Setup Checklist

**Follow this checklist to set up and test Dodo Payments in test mode**

---

## ⏱️ Estimated Time: 45 minutes

---

## Phase 1: Dodo Account Setup (15 min)

- [ ] Go to https://dashboard.dodopayments.com
- [ ] Sign up or log in
- [ ] Toggle **Test Mode** ON (top right)
- [ ] Verify dashboard shows "TEST MODE"

---

## Phase 2: Create Test Plans (15 min)

### Monthly Plan
- [ ] Go to **Plans** section
- [ ] Click **Create New Plan**
- [ ] Enter Name: `Pro Monthly (Test)`
- [ ] Enter Amount: `299` (cents)
- [ ] Select Interval: `Monthly`
- [ ] Click **Create Plan**
- [ ] **Copy and save** Plan ID: `________________`

### Yearly Plan
- [ ] Click **Create New Plan** again
- [ ] Enter Name: `Pro Yearly (Test)`
- [ ] Enter Amount: `2899` (cents)
- [ ] Select Interval: `Yearly`
- [ ] Click **Create Plan**
- [ ] **Copy and save** Plan ID: `________________`

---

## Phase 3: Get API Credentials (10 min)

- [ ] Go to **Settings** → **API Keys**
- [ ] **Copy Test Public Key:**
  ```
  pk_test_________________________
  ```
  Save here: `________________`

- [ ] **Copy Test Secret Key:**
  ```
  sk_test_________________________
  ```
  Save here: `________________`

---

## Phase 4: Configure Environment Variables (10 min)

- [ ] Open `.env.local` in VS Code (create if doesn't exist)
- [ ] Add or update these variables:

```env
# Test Mode Flag
NEXT_PUBLIC_DODO_MODE=test

# Test Credentials
NEXT_PUBLIC_DODO_API_KEY=pk_test_________________________
DODO_API_SECRET=sk_test_________________________

# Test Plan IDs
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=plan_test_________________________
NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=plan_test_________________________
```

- [ ] **Save** `.env.local` file
- [ ] **Stop** dev server (Ctrl+C)
- [ ] **Restart** dev server: `npm run dev`
- [ ] Verify dev server started successfully

---

## Phase 5: Verify Test Mode is Active

### Check 1: Premium Page
- [ ] Go to `http://localhost:3000/premium`
- [ ] Look for **yellow banner** at the top
- [ ] Banner should say: "🧪 Test Mode Active..."
- [ ] If banner shows → ✅ Test mode is working!

### Check 2: Browser Console
- [ ] Press `F12` to open DevTools
- [ ] Go to **Console** tab
- [ ] No error messages about Dodo API keys
- [ ] No 500 errors

### Check 3: Verify Config
- [ ] Open `lib/dodo/config.ts`
- [ ] Check line shows: `mode: 'test'`
- [ ] Check line shows: `isTestMode: true`
- [ ] If yes → ✅ Config is correct!

---

## Phase 6: Test Subscription Creation

### Monthly Subscription Test
- [ ] Go to `/premium` page
- [ ] Select **Monthly** option (if toggle present)
- [ ] Click **"Subscribe Now"** button
- [ ] At payment screen, use test card:
  ```
  Card: 4111 1111 1111 1111
  Expiry: 12/25
  CVC: 123
  ```
- [ ] Complete payment
- [ ] **Verify:**
  - [ ] No error occurred
  - [ ] Redirected to success page
  - [ ] Check Supabase:
    - [ ] New row in `subscriptions` table
    - [ ] `dodo_subscription_id` is filled
    - [ ] `status` is `'active'`
    - [ ] `dodo_plan_id` matches monthly plan ID

### Yearly Subscription Test
- [ ] Go to `/premium` page again
- [ ] Select **Yearly** option
- [ ] Click **"Subscribe Now"** button
- [ ] Use test card again: `4111 1111 1111 1111`
- [ ] Complete payment
- [ ] **Verify:**
  - [ ] Success page shown
  - [ ] Supabase updated:
    - [ ] New row created (or existing updated)
    - [ ] `dodo_plan_id` matches yearly plan ID
    - [ ] Correct interval stored

---

## Phase 7: Test Error Handling

### Declined Card Test
- [ ] Go to `/premium` page
- [ ] Click **"Subscribe Now"**
- [ ] Use declined test card:
  ```
  Card: 4000 0000 0000 0002
  Expiry: 12/25
  CVC: 123
  ```
- [ ] **Verify:**
  - [ ] Payment fails gracefully
  - [ ] Error message shown to user
  - [ ] No Supabase record created
  - [ ] User remains on Free tier
  - [ ] No 500 errors in logs

---

## Phase 8: Test Cancellation

### Cancel Subscription
- [ ] Log in with account that has active subscription
- [ ] Go to **Settings** → **Subscription**
- [ ] Look for **"Cancel Subscription"** button
- [ ] Click it
- [ ] Confirm cancellation when prompted
- [ ] **Verify:**
  - [ ] Cancellation succeeds
  - [ ] Supabase updated:
    - [ ] `status` is `'canceled'`
    - [ ] `cancel_at_period_end` is `true`
  - [ ] UI updates (Pro badge removed)
  - [ ] User downgraded to Free tier

---

## Phase 9: Verify in Dodo Dashboard

- [ ] Go to Dodo Dashboard (Test Mode ON)
- [ ] Go to **Subscriptions** section
- [ ] Look for subscriptions you just created
- [ ] **Verify:**
  - [ ] Monthly subscription shows
  - [ ] Yearly subscription shows
  - [ ] Status matches what you expect
  - [ ] Plan IDs are correct

---

## Phase 10: Database Verification

Run this query in Supabase:

```sql
SELECT 
  user_id,
  dodo_subscription_id,
  dodo_plan_id,
  status,
  cancel_at_period_end,
  created_at
FROM subscriptions
WHERE dodo_subscription_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

- [ ] Query returns test subscriptions
- [ ] All fields populated correctly
- [ ] No errors in database

---

## 🎉 Test Mode Setup Complete!

If all checkboxes above are ✅, you're ready!

---

## 🚀 Next Steps

1. ✅ Continue testing with different scenarios
2. ✅ Test with multiple users
3. ✅ Verify all features work
4. ✅ When satisfied, prepare for production

---

## 📞 Troubleshooting

**Yellow banner not showing?**
- [ ] Check `NEXT_PUBLIC_DODO_MODE=test` in `.env.local`
- [ ] Stop and restart dev server
- [ ] Refresh browser

**Payment fails with API error?**
- [ ] Check credentials in `.env.local`
- [ ] Verify plan IDs are correct
- [ ] Check Dodo Dashboard shows test plans
- [ ] Look at browser console for errors

**Supabase not updating?**
- [ ] Check Supabase credentials in `.env.local`
- [ ] Verify migration ran: `dodo-migration.sql`
- [ ] Check database has new columns: `dodo_subscription_id`, `dodo_plan_id`

---

## 📋 Summary

| Component | Status |
|-----------|--------|
| Dodo Test Account | ✅ Ready |
| Test Plans Created | ✅ Monthly & Yearly |
| API Credentials | ✅ Configured |
| Environment Variables | ✅ Set up |
| Dev Server | ✅ Restarted |
| Test Mode Active | ✅ Verified |
| Monthly Subscription | ✅ Tested |
| Yearly Subscription | ✅ Tested |
| Error Handling | ✅ Tested |
| Cancellation | ✅ Tested |
| Database | ✅ Verified |

**Everything Works! 🎉**

---

## 🔑 Keep These Values Safe

Save these for reference (don't share):

| Item | Value |
|------|-------|
| Dodo Test Public Key | `pk_test_...` |
| Dodo Test Secret Key | `sk_test_...` |
| Monthly Plan ID | `plan_test_...` |
| Yearly Plan ID | `plan_test_...` |

---

## ✨ You're Ready to Test!

Use this guide as you work through test mode. Come back to verify each step.

**Questions? Check these files:**
- `DODO-TEST-MODE-GUIDE.md` - Detailed test mode guide
- `DODO-ENV-SETUP.md` - Environment variable details
- `DODO-PAYMENTS-SETUP.md` - Complete setup guide

---

**Happy Testing! Let's get Dodo Payments working! 🚀**
