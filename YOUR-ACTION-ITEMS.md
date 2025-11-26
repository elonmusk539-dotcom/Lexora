# Dodo Payments Migration - Your Action Items

> **Complete Integration Package Ready**  
> All code changes are complete. Below are the manual steps YOU need to take.

---

## 🎯 Quick Summary

Your Lexora app has been **fully updated to use Dodo Payments** instead of PayPal:

### ✅ What I've Done (Code Changes)

1. ✅ Created new Dodo Payments API routes:
   - `/app/api/dodo/subscription/route.ts` - Handles new subscriptions
   - `/app/api/dodo/cancel/route.ts` - Handles subscription cancellations

2. ✅ Updated premium page (`app/premium/page.tsx`):
   - Removed PayPal SDK integration
   - Added "Subscribe Now" button with Dodo integration
   - Updated FAQ to mention Dodo Payments

3. ✅ Updated subscription config (`lib/subscription/config.ts`):
   - Changed environment variables from `PAYPAL_PLAN_ID_*` to `DODO_PLAN_ID_*`

4. ✅ Updated subscription management component:
   - Changed cancel endpoint from `/api/paypal/cancel` to `/api/dodo/cancel`

5. ✅ Created Dodo configuration file (`lib/dodo/config.ts`):
   - Helper functions for Dodo API integration
   - Configuration validation

6. ✅ Created database migration SQL (`lib/supabase/dodo-migration.sql`):
   - Adds `dodo_subscription_id` and `dodo_plan_id` columns
   - Keeps PayPal columns for backward compatibility
   - Creates indexes for performance

7. ✅ Created comprehensive setup guide (`DODO-PAYMENTS-SETUP.md`):
   - Step-by-step instructions for YOU to follow

---

## 📋 Your Action Items (Manual Steps)

### Phase 1: Set Up Dodo Payments Account (30 minutes)

#### Step 1: Create Dodo Business Account
- [ ] Visit https://dashboard.dodopayments.com
- [ ] Sign up for a business account
- [ ] Complete identity verification
- [ ] Set up payout information

#### Step 2: Create Subscription Plans
- [ ] Log into Dodo dashboard
- [ ] Create **Monthly Plan**: $2.99/month
  - Save the **Plan ID** (looks like: `prod_monthly_abc123`)
- [ ] Create **Yearly Plan**: $28.99/year
  - Save the **Plan ID** (looks like: `prod_yearly_abc123`)

**SAVE THESE PLAN IDs - YOU'LL NEED THEM NEXT**

#### Step 3: Get API Keys
- [ ] In Dodo dashboard, go to **Developers** → **API Keys**
- [ ] Copy your **Public API Key** (e.g., `pk_...`)
- [ ] Copy your **Secret API Key** (e.g., `sk_...`)

**SAVE THESE KEYS SECURELY**

---

### Phase 2: Configure Environment Variables (10 minutes)

#### Step 4: Update Development Environment
1. Open `.env.local` in your project root
2. Add these four lines:

```env
NEXT_PUBLIC_DODO_API_KEY=pk_your_public_key_here
DODO_API_SECRET=sk_your_secret_key_here
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=prod_monthly_abc123
NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=prod_yearly_abc123
```

Replace values with your actual keys and plan IDs from Step 3 and Step 2.

3. Save the file
4. **RESTART YOUR DEV SERVER**:
   ```bash
   npm run dev
   ```

#### Step 5: Update Production Environment (Vercel/Hosting)
1. Log into your hosting platform (Vercel, etc.)
2. Go to project **Settings** → **Environment Variables**
3. Add the same four variables (use production keys if available)
4. Redeploy your app

---

### Phase 3: Database Migration (5 minutes)

#### Step 6: Run Database Migration
1. Log into **Supabase** (https://supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Create a new query
5. Copy-paste the entire content from `lib/supabase/dodo-migration.sql`
6. Execute the query

**Expected Result:** No errors, and you can see new columns in subscriptions table.

#### Step 7: Verify Migration
1. In Supabase SQL Editor, run:
   ```sql
   SELECT * FROM subscriptions LIMIT 1;
   ```
2. You should see new columns: `dodo_subscription_id` and `dodo_plan_id`

---

### Phase 4: Test Everything (15 minutes)

#### Step 8: Test Development
- [ ] Start your dev server: `npm run dev`
- [ ] Navigate to `/premium`
- [ ] See the pricing page with two plans
- [ ] Click monthly/yearly toggle
- [ ] See "Subscribe Now" button (NOT a PayPal button)
- [ ] Click "Subscribe Now"
- [ ] Check Supabase: `SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 5;`
- [ ] You should see a new record with `status='active'` and `dodo_subscription_id` filled

#### Step 9: Test Cancellation
- [ ] Go to Settings page
- [ ] Click "Cancel Subscription"
- [ ] Confirm cancellation
- [ ] Check Supabase again
- [ ] Record should show `status='canceled'` and `cancel_at_period_end=true`

---

### Phase 5: Handle Existing PayPal Subscriptions (Choose One)

#### Option A: Let Them Continue (Easiest - Recommended for now)
- [ ] Do nothing special
- [ ] PayPal subscriptions continue working until they expire
- [ ] New users sign up with Dodo
- [ ] Migration happens naturally over time

#### Option B: Immediate Migration (More complex)
If you want to migrate existing PayPal users to Dodo immediately:
1. Send email to existing paid users: "We've switched to Dodo Payments"
2. Ask them to resubscribe with Dodo
3. Offer them a month free or discount code
4. Old PayPal subscriptions can be manually canceled

#### Option C: Hybrid Mode (Most complex)
- [ ] Keep both systems running
- [ ] PayPal users stay on PayPal
- [ ] New users go to Dodo
- [ ] Eventually migrate PayPal users in a future phase

**Recommendation:** Go with **Option A** (Let them continue). It's the least disruptive.

---

### Phase 6: Deploy to Production (20 minutes)

#### Step 10: Push Code to Git
```bash
git add .
git commit -m "Replace PayPal with Dodo Payments integration"
git push origin main
```

#### Step 11: Deploy
- [ ] Your hosting platform (Vercel, etc.) automatically deploys
- [ ] Or manually trigger deployment
- [ ] Verify site is running

#### Step 12: Test Production
- [ ] Go to your live site `/premium` page
- [ ] Verify "Subscribe Now" button works
- [ ] Try creating a test subscription (don't use real card)
- [ ] Check production Supabase for the test record

---

## 🗂️ Files You Modified / Need to Know About

### Created (New Files)
- `app/api/dodo/subscription/route.ts` - Subscription creation API
- `app/api/dodo/cancel/route.ts` - Subscription cancellation API
- `lib/dodo/config.ts` - Dodo configuration helpers
- `lib/supabase/dodo-migration.sql` - Database migration
- `DODO-PAYMENTS-SETUP.md` - Detailed setup guide (you're reading similar info)

### Modified (Updated Existing Files)
- `app/premium/page.tsx` - Removed PayPal, added Dodo
- `lib/subscription/config.ts` - Updated environment variable names
- `components/SubscriptionManagement.tsx` - Updated cancel endpoint

### Not Touched (For Reference Only)
- `SUBSCRIPTION-CANCELLATION.md` - Old PayPal guide (for history)
- `scripts/test-paypal-config.js` - Old PayPal test (for history)
- All other files remain unchanged

---

## 🔐 Important Security Notes

### API Keys Security
- **Never commit** `.env.local` to Git (it's in `.gitignore`)
- **Never share** your API keys in code, logs, or publicly
- **Rotate keys regularly** in production
- **Use different keys** for development and production

### Database Security
- **Backup your database** before running migrations
- **Test migrations in staging** first if possible
- **Monitor logs** for any errors during migration

---

## 🐛 Common Issues & Fixes

### "Subscription plan is not configured"
**Fix:** Check your `.env.local` has all 4 environment variables with correct values, then restart dev server.

### Plan IDs not showing
**Fix:** Make sure you saved the plan IDs from Step 2. They should look like `prod_monthly_abc123`.

### API Key errors
**Fix:** Verify you copied keys correctly from Dodo dashboard. Check for extra spaces.

### Database migration fails
**Fix:** 
1. Make sure you have Supabase service role key set up
2. Run migration in SQL Editor, not from terminal
3. Check for typos in SQL

### "Subscribe Now" button doesn't work
**Fix:** Check browser console for errors. Likely missing environment variables.

---

## 📞 Support Resources

### Dodo Payments Support
- Website: https://dodopayments.com
- Docs: https://docs.dodopayments.com
- Email: support@dodopayments.com

### Your Implementation
- Check `DODO-PAYMENTS-SETUP.md` for detailed setup guide
- Review API routes in `app/api/dodo/` folder
- Check `lib/dodo/config.ts` for configuration

### Debugging
- Check browser **Console** for frontend errors
- Check **Server Logs** (Vercel/hosting) for API errors
- Check **Supabase Logs** in SQL Editor for database issues

---

## ✨ What's Different from PayPal

| Aspect | PayPal | Dodo |
|--------|--------|------|
| **SDK** | Complex JavaScript SDK | Simple API calls |
| **Button** | PayPal branded button | Custom "Subscribe Now" button |
| **Plans** | Created in PayPal dashboard | Created in Dodo dashboard |
| **API** | Complex OAuth flow | Basic Auth (username:password) |
| **Configuration** | Many env variables | Minimal env variables |
| **Setup** | 45+ minutes | ~30 minutes |

---

## 🎯 Next Steps Checklist

- [ ] Phase 1: Set up Dodo account (30 min)
- [ ] Phase 2: Configure environment variables (10 min)
- [ ] Phase 3: Run database migration (5 min)
- [ ] Phase 4: Test everything (15 min)
- [ ] Phase 5: Handle existing PayPal users (decision only)
- [ ] Phase 6: Deploy to production (20 min)

**Total Time Required:** ~1-2 hours

---

## 📝 Testing Checklist

Before considering this complete, test:

- [ ] Development site loads without errors
- [ ] `/premium` page displays correctly
- [ ] Monthly/Yearly toggle works
- [ ] "Subscribe Now" button is visible
- [ ] Clicking "Subscribe Now" doesn't error
- [ ] New subscription appears in Supabase
- [ ] Subscription has `status='active'`
- [ ] Subscription has `dodo_subscription_id` (not null)
- [ ] Settings page shows subscription details
- [ ] Cancel button appears and works
- [ ] Canceling updates database correctly
- [ ] Production deployment works
- [ ] Production premium page works

---

## 🚀 You're Ready to Go!

All the code is in place. Now it's just about:
1. Setting up Dodo account (straightforward)
2. Adding environment variables (copy-paste)
3. Running database migration (one SQL script)
4. Testing (clicking buttons on your site)
5. Deploying (git push)

**Estimated time: 1-2 hours total**

Once you complete these steps, your Lexora Pro subscriptions will work with Dodo Payments! 🎉

---

**Last Updated:** November 2025  
**Status:** Ready for Setup ✅
