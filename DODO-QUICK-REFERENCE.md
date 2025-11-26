# Dodo Payments - Quick Reference Card

**One-page reference for the migration**

---

## 🎯 What Changed?

| Aspect | Before | After |
|--------|--------|-------|
| **Payment Provider** | PayPal | Dodo Payments |
| **SDK** | PayPal SDK script | No SDK (API calls) |
| **Button** | PayPal branded button | Custom "Subscribe Now" button |
| **Pricing** | $2.99/mo, $28.99/yr | $2.99/mo, $28.99/yr (same) |
| **Setup Time** | Complex | ~1-2 hours |

---

## 🔑 Environment Variables

```
NEXT_PUBLIC_DODO_API_KEY=pk_your_public_key
DODO_API_SECRET=sk_your_secret_key
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=prod_monthly_id
NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=prod_yearly_id
```

**Where to find:**
- Keys: Dodo Dashboard → Developers → API Keys
- Plan IDs: Dodo Dashboard → Products → Your Plans

---

## 🗄️ Database

**New Columns:**
- `dodo_subscription_id` (stores Dodo subscription ID)
- `dodo_plan_id` (stores Dodo plan ID)

**Old Columns (Still There):**
- `paypal_subscription_id` (for backward compatibility)
- `paypal_plan_id` (for backward compatibility)

**Migration Script:** `lib/supabase/dodo-migration.sql`

---

## 📂 New Files

| File | Purpose |
|------|---------|
| `app/api/dodo/subscription/route.ts` | Create subscriptions |
| `app/api/dodo/cancel/route.ts` | Cancel subscriptions |
| `lib/dodo/config.ts` | Dodo configuration |
| `lib/supabase/dodo-migration.sql` | Database migration |

---

## ✏️ Modified Files

| File | Change |
|------|--------|
| `app/premium/page.tsx` | Removed PayPal SDK, added Dodo button |
| `lib/subscription/config.ts` | Updated env var names |
| `components/SubscriptionManagement.tsx` | Updated cancel endpoint |

---

## 📋 Setup Steps

1. **Dodo Account** (30 min)
   - Create account
   - Create 2 plans
   - Get API keys

2. **Environment** (10 min)
   - Add 4 env vars to `.env.local`
   - Add 4 env vars to production
   - Restart server

3. **Database** (5 min)
   - Run migration SQL
   - Verify new columns exist

4. **Test** (15 min)
   - Create test subscription
   - Cancel test subscription
   - Check database records

5. **Deploy** (20 min)
   - Git push
   - Verify production works

**Total: ~80 minutes**

---

## 🧪 Quick Test

```bash
# 1. Start server
npm run dev

# 2. Go to /premium
# 3. Click "Subscribe Now"
# 4. Check database
SELECT * FROM subscriptions 
ORDER BY created_at DESC LIMIT 1;

# 5. Should show:
# - status = 'active'
# - dodo_subscription_id = (not null)
# - interval = 'month' or 'year'
```

---

## 🆘 Common Issues

| Issue | Fix |
|-------|-----|
| "Plan not configured" | Check all 4 env vars in `.env.local` |
| Subscription not saving | Check Supabase is accessible |
| API errors | Check API keys are correct |
| Button doesn't work | Restart dev server after env changes |

---

## 📞 Support

**Dodo:** https://dodopayments.com/support  
**Docs:** `DODO-PAYMENTS-SETUP.md`  
**Checklist:** `DODO-CHECKLIST.md`

---

## 💾 Save These Credentials

```
Public Key: ___________________________

Secret Key: ___________________________

Monthly Plan ID: ___________________________

Yearly Plan ID: ___________________________

Date Configured: ___________________________
```

---

## ✅ Success Criteria

- [x] Premium page shows "Subscribe Now" button
- [x] Subscriptions save to Supabase
- [x] Can cancel subscriptions
- [x] Users get Pro access
- [x] No errors in logs

---

**Version:** 1.0 | **Date:** Nov 2025 | **Status:** Ready ✅
