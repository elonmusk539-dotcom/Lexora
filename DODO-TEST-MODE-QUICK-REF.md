# 🧪 Dodo Test Mode - Quick Reference Card

**Print this or keep it open while testing**

---

## 📌 What is Test Mode?

Test mode lets you try out Dodo Payments **without charging real credit cards**. Perfect for development and testing.

---

## 🎯 Quick Start (5 minutes)

1. **Get test credentials:**
   - Go to https://dashboard.dodopayments.com
   - Toggle **Test Mode** ON
   - Go to Settings → API Keys
   - Copy public & secret keys

2. **Create test plans:**
   - Go to Plans section
   - Create two plans: Monthly ($2.99) and Yearly ($28.99)
   - Copy both plan IDs

3. **Update `.env.local`:**
   ```env
   NEXT_PUBLIC_DODO_MODE=test
   NEXT_PUBLIC_DODO_API_KEY=pk_test_...
   DODO_API_SECRET=sk_test_...
   NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=plan_test_...
   NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=plan_test_...
   ```

4. **Restart dev server:** `npm run dev`

5. **Verify:** Yellow banner shows on `/premium` page ✓

---

## 💳 Test Credit Cards

Use these cards to test (they will NOT charge):

### ✅ Successful Payment
```
Number: 4111 1111 1111 1111
Expiry: 12/25
CVC: 123
Result: ✅ Payment succeeds
```

### ❌ Declined Payment
```
Number: 4000 0000 0000 0002
Expiry: 12/25
CVC: 123
Result: ❌ Payment declines
```

### ⚠️ Insufficient Funds
```
Number: 4000 0000 0000 9995
Expiry: 12/25
CVC: 123
Result: ⚠️ Insufficient funds error
```

---

## 🧪 Test Scenarios

### Scenario 1: Create Monthly Subscription
```
1. Go to /premium
2. Select "Monthly"
3. Click "Subscribe Now"
4. Use card: 4111 1111 1111 1111
5. Verify: Success page + Supabase record
```

### Scenario 2: Create Yearly Subscription
```
1. Go to /premium
2. Select "Yearly"
3. Click "Subscribe Now"
4. Use card: 4111 1111 1111 1111
5. Verify: Success page + Supabase record
```

### Scenario 3: Payment Declines
```
1. Go to /premium
2. Click "Subscribe Now"
3. Use card: 4000 0000 0000 0002
4. Verify: Error shown, no charge, no database record
```

### Scenario 4: Cancel Subscription
```
1. Go to Settings → Subscription
2. Click "Cancel Subscription"
3. Confirm
4. Verify: Status = 'canceled' in Supabase
```

---

## ✅ Verification Checklist

### Yellow Banner Visible?
```
🧪 Test Mode Active: Subscriptions will not charge real credit cards
```
- If YES ✅ Test mode is working
- If NO ❌ Check NEXT_PUBLIC_DODO_MODE=test in .env.local

### Credentials Correct?
```powershell
# In .env.local:
NEXT_PUBLIC_DODO_API_KEY=pk_test_...      ✅ Public key
DODO_API_SECRET=sk_test_...               ✅ Secret key
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=plan_... ✅ Monthly plan
NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=plan_...  ✅ Yearly plan
```

### Supabase Updated?
```sql
SELECT * FROM subscriptions 
WHERE dodo_subscription_id IS NOT NULL 
LIMIT 5;
```
- Should show test subscriptions created

### No Errors in Console?
```
Press F12 → Console tab → Look for red errors
Should be clean ✅
```

---

## 🔧 If Something Goes Wrong

| Problem | Solution |
|---------|----------|
| **Banner not showing** | Check `NEXT_PUBLIC_DODO_MODE=test`, restart dev server |
| **API error** | Verify credentials in `.env.local` |
| **Database not updating** | Check Supabase credentials, verify migration ran |
| **Payment always fails** | Try test card `4111 1111 1111 1111` |
| **Plan ID error** | Ensure plan ID starts with `plan_test_` |

---

## 📊 Where to Check Status

### In Your App
```
URL: http://localhost:3000/premium
Yellow banner = Test mode active
```

### In Dodo Dashboard
```
URL: https://dashboard.dodopayments.com
Mode: Test Mode ON (toggle)
Section: Subscriptions (see your test subscriptions)
```

### In Supabase
```
Table: subscriptions
Columns: dodo_subscription_id, dodo_plan_id, status
Should show: Your test subscriptions
```

---

## 🚀 When to Switch to Live Mode

1. ✅ All tests pass in test mode
2. ✅ Subscriptions create successfully
3. ✅ Cancellations work
4. ✅ No errors in logs
5. ✅ Database updates correctly

Then:
1. Get live credentials from Dodo (toggle OFF test mode)
2. Create live subscription plans
3. Update `.env.local` with `NEXT_PUBLIC_DODO_MODE=live`
4. Update credentials to live keys
5. Restart dev server
6. Test once more

---

## 📌 Important Notes

### Security
- ✅ Never commit `.env.local` to Git
- ✅ Never share secret keys
- ✅ Use test mode for development
- ✅ Use live mode for production

### Environment Variables
```
.env.local = Local development ONLY (not in Git)
Production = Set via hosting dashboard (Vercel, Railway, etc.)
```

### Test Data
- Test mode uses separate test infrastructure
- Real customers not affected
- Test subscriptions completely isolated
- Safe to test anything!

---

## 💡 Pro Tips

1. **Keep credentials in `.env.local`** - Don't hardcode them
2. **Restart dev server** after changing `.env.local`
3. **Use test cards only** in test mode
4. **Monitor Supabase** to verify data saves
5. **Check Dodo dashboard** to see transaction history
6. **Document what you test** for your notes

---

## 📞 Need Help?

- **Test Mode Details** → Read `DODO-TEST-MODE-GUIDE.md`
- **Environment Setup** → Read `DODO-ENV-SETUP.md`
- **Full Setup** → Read `DODO-PAYMENTS-SETUP.md`
- **Dodo Docs** → https://docs.dodopayments.com

---

## 🎯 Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /premium` | Premium subscription page |
| `POST /api/dodo/subscription` | Create subscription |
| `POST /api/dodo/cancel` | Cancel subscription |

---

## 📋 Before You Test

- [ ] `.env.local` has all 5 Dodo variables
- [ ] Dev server restarted
- [ ] Yellow test mode banner visible
- [ ] At least one test plan created
- [ ] Test credit cards handy

---

## ✨ You're Ready!

Everything is configured. Time to test! 🚀

Use test cards, verify Supabase updates, and let us know if anything breaks.

Good luck! 🎉
