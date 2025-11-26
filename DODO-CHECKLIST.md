# Dodo Payments Integration Checklist

**Quick reference for completing the migration**

---

## ✅ Phase 1: Dodo Account Setup (30 min)

- [ ] Visit https://dashboard.dodopayments.com
- [ ] Create business account
- [ ] Complete identity verification
- [ ] Set up payout information

**Plan 1: Monthly**
- [ ] Create subscription plan
- [ ] Name: "Lexora Pro - Monthly"
- [ ] Price: $2.99
- [ ] Billing: Monthly
- [ ] **SAVE PLAN ID:** `_____________________`

**Plan 2: Yearly**
- [ ] Create subscription plan
- [ ] Name: "Lexora Pro - Yearly"
- [ ] Price: $28.99
- [ ] Billing: Yearly
- [ ] **SAVE PLAN ID:** `_____________________`

**API Keys**
- [ ] Go to Developers → API Keys
- [ ] **SAVE PUBLIC KEY:** `pk_____________________`
- [ ] **SAVE SECRET KEY:** `sk_____________________`

---

## ✅ Phase 2: Environment Setup (10 min)

**Update `.env.local`**
```
NEXT_PUBLIC_DODO_API_KEY=pk_____________________
DODO_API_SECRET=sk_____________________
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=prod_____________________
NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=prod_____________________
```

- [ ] Added all 4 variables
- [ ] Used correct values from Phase 1
- [ ] Saved file
- [ ] Restarted dev server: `npm run dev`

**Update Production Environment**
- [ ] Log into hosting (Vercel, etc.)
- [ ] Go to Settings → Environment Variables
- [ ] Added same 4 variables (use production keys if available)
- [ ] Saved changes
- [ ] Redeployed application

---

## ✅ Phase 3: Database Migration (5 min)

**Supabase SQL Editor**
- [ ] Log into Supabase
- [ ] Open SQL Editor
- [ ] Create new query
- [ ] Copy entire content from: `lib/supabase/dodo-migration.sql`
- [ ] Execute script
- [ ] Verified no errors

**Verify Migration**
- [ ] Run: `SELECT * FROM subscriptions LIMIT 1;`
- [ ] Confirmed new columns exist:
  - [ ] `dodo_subscription_id`
  - [ ] `dodo_plan_id`

---

## ✅ Phase 4: Testing (15 min)

**Development Testing**
- [ ] Dev server running: `npm run dev`
- [ ] Navigate to `/premium`
- [ ] See pricing page with two plans
- [ ] Monthly/Yearly toggle works
- [ ] "Subscribe Now" button visible
- [ ] Click "Subscribe Now" → no errors
- [ ] Check Supabase:
  ```sql
  SELECT * FROM subscriptions 
  ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] New record created with:
  - [ ] `status = 'active'`
  - [ ] `dodo_subscription_id` is NOT NULL
  - [ ] `interval = 'month'` or `'year'`

**Cancellation Testing**
- [ ] Go to Settings page
- [ ] Click "Cancel Subscription"
- [ ] Confirm cancellation
- [ ] Check Supabase again
- [ ] Record updated with:
  - [ ] `status = 'canceled'`
  - [ ] `cancel_at_period_end = true`
  - [ ] `canceled_at` has timestamp

---

## ✅ Phase 5: Handle Existing PayPal Users

Choose one option:

**Option A: Let Them Continue (Recommended)**
- [ ] Do nothing special
- [ ] PayPal subscriptions continue until expiration
- [ ] New users sign up with Dodo
- [ ] Natural migration over time

**Option B: Immediate Migration**
- [ ] Send email to existing paid users
- [ ] Offer incentive (1 month free or discount)
- [ ] Ask them to resubscribe with Dodo
- [ ] Can manually cancel PayPal subscriptions

**Option C: Hybrid Mode**
- [ ] Keep both systems running
- [ ] PayPal users stay on PayPal
- [ ] New users go to Dodo
- [ ] Plan migration for later

**Selected Option:** _____________________

---

## ✅ Phase 6: Production Deployment (20 min)

**Git Commit**
```bash
git add .
git commit -m "Replace PayPal with Dodo Payments integration"
git push origin main
```

- [ ] Code committed
- [ ] Pushed to main branch
- [ ] Hosting auto-deployed OR manually deployed

**Production Testing**
- [ ] Go to live site `/premium`
- [ ] See "Subscribe Now" button
- [ ] Pricing displays correctly
- [ ] Monthly/Yearly toggle works
- [ ] Subscription can be created
- [ ] Test record appears in production Supabase
- [ ] No errors in hosting logs

**Verify Live Site**
- [ ] Premium page accessible
- [ ] All buttons work
- [ ] No console errors
- [ ] Mobile responsive

---

## ✅ Final Verification

**Complete Testing Checklist**

- [ ] Development site works perfectly
- [ ] Production site works perfectly
- [ ] All 4 environment variables configured
- [ ] Database migration executed
- [ ] Can create monthly subscription
- [ ] Can create yearly subscription
- [ ] Can cancel subscription
- [ ] Supabase records correct
- [ ] No errors in logs
- [ ] Mobile view works
- [ ] Dark mode works (if applicable)
- [ ] Settings page shows subscription status

---

## 🚨 If Something Goes Wrong

### "Subscription plan is not configured"
1. Check `.env.local` has all 4 variables
2. Verify variable names are EXACT (case-sensitive)
3. Verify values match Dodo dashboard
4. Restart dev server
5. Check browser console for specific error

### "Cannot save subscription"
1. Verify Supabase is accessible
2. Check if migration ran successfully
3. Verify service role key is set
4. Check Supabase logs for errors

### "Cannot cancel subscription"
1. Verify `dodo_subscription_id` is saved (not NULL)
2. Check if `DODO_API_SECRET` is set
3. Verify API credentials are correct
4. Check server logs for error message

### General Troubleshooting
1. Check `.env.local` first (most common issue)
2. Restart dev server
3. Clear browser cache
4. Check console/server logs
5. Verify all environment variables are set
6. Test with different browser

---

## 📞 Support

**Dodo Payments**
- Website: https://dodopayments.com
- Docs: https://docs.dodopayments.com
- Support: support@dodopayments.com

**Your Documentation**
- Detailed Setup: `DODO-PAYMENTS-SETUP.md`
- Action Items: `YOUR-ACTION-ITEMS.md`
- Migration Summary: `MIGRATION-SUMMARY.md`

---

## ⏱️ Time Tracking

| Phase | Estimated | Actual |
|-------|-----------|--------|
| Phase 1: Dodo Account | 30 min | ___ min |
| Phase 2: Environment | 10 min | ___ min |
| Phase 3: Database | 5 min | ___ min |
| Phase 4: Testing | 15 min | ___ min |
| Phase 5: Old Users | 5 min | ___ min |
| Phase 6: Deploy | 20 min | ___ min |
| **TOTAL** | **85 min** | **___ min** |

---

## 📋 Post-Completion

After everything is working:

- [ ] Backup Dodo API keys in secure location
- [ ] Document Dodo dashboard access for team
- [ ] Set up monitoring for API failures
- [ ] Test refund process with Dodo support
- [ ] Configure automatic notifications (optional)
- [ ] Set up webhook integration (optional)
- [ ] Announce to users (optional)
- [ ] Monitor first few user signups

---

## 🎉 Done!

Once all checkboxes are complete, your Lexora Pro subscriptions are fully running on Dodo Payments.

**Celebrate! 🚀**

---

**Status:** Ready to Begin  
**Complexity:** Low (mostly copy-paste + clicking)  
**Time Required:** ~1-2 hours  
**Difficulty:** ⭐ Easy
