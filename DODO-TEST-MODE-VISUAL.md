# 🧪 Dodo Test Mode - One-Page Visual Guide

**Print this page or bookmark it for quick reference while testing**

---

## 🎯 Test Mode Setup Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DODO TEST MODE SETUP                     │
└─────────────────────────────────────────────────────────────┘

Step 1: Create Test Account        Step 2: Create Test Plans
     ↓                                   ↓
Go to dodopayments.com          Create 2 plans:
Toggle Test Mode ON             ✅ Monthly: $2.99
                                ✅ Yearly: $28.99

Step 3: Get API Keys               Step 4: Update .env.local
     ↓                                   ↓
Copy from Settings:             Add 5 variables:
✅ Public Key (pk_test_...)     ✅ DODO_MODE=test
✅ Secret Key (sk_test_...)     ✅ PUBLIC_API_KEY
                                ✅ SECRET_API_KEY
                                ✅ PLAN_ID_MONTHLY
                                ✅ PLAN_ID_YEARLY

Step 5: Restart Dev Server         Step 6: Verify Test Mode
     ↓                                   ↓
npm run dev                     Check /premium page:
                                ✅ Yellow banner visible?
                                ✅ Says "Test Mode Active"

Step 7: Test Payment               Step 8: Verify in Supabase
     ↓                                   ↓
Use card: 4111 1111 1111 1111   Check subscriptions table:
Expiry: 12/25                   ✅ dodo_subscription_id
CVC: 123                        ✅ dodo_plan_id
Click Subscribe                 ✅ status='active'

✅ SUCCESS! Test mode is working!
```

---

## 💳 Test Credit Cards (Copy & Paste)

### Test 1: Successful Payment ✅
```
Number: 4111 1111 1111 1111
Expiry: 12/25
CVC: 123
Result: Payment succeeds
```

### Test 2: Payment Declined ❌
```
Number: 4000 0000 0000 0002
Expiry: 12/25
CVC: 123
Result: Payment declines
```

### Test 3: Insufficient Funds ⚠️
```
Number: 4000 0000 0000 9995
Expiry: 12/25
CVC: 123
Result: Insufficient funds error
```

---

## 🔐 Environment Variables Template

Copy this to `.env.local`:

```env
# Dodo Test Mode
NEXT_PUBLIC_DODO_MODE=test

# Replace XXX with your actual values from Dodo Dashboard
NEXT_PUBLIC_DODO_API_KEY=pk_test_XXX_YOUR_PUBLIC_KEY_XXX
DODO_API_SECRET=sk_test_XXX_YOUR_SECRET_KEY_XXX
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=plan_test_XXX_MONTHLY_XXX
NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=plan_test_XXX_YEARLY_XXX

# Keep existing Supabase config
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxx...
```

---

## ✅ Test Scenarios (Quick Reference)

### Scenario 1: Monthly Subscription
```
1. Go to /premium
2. Select "Monthly"
3. Click Subscribe
4. Use: 4111 1111 1111 1111
5. Verify: Success page + Supabase record
```

### Scenario 2: Yearly Subscription
```
1. Go to /premium
2. Select "Yearly"
3. Click Subscribe
4. Use: 4111 1111 1111 1111
5. Verify: Success page + Supabase record
```

### Scenario 3: Payment Fails
```
1. Go to /premium
2. Click Subscribe
3. Use: 4000 0000 0000 0002
4. Verify: Error shown, no charge
```

### Scenario 4: Cancel Subscription
```
1. Settings → Subscription
2. Click "Cancel Subscription"
3. Verify: status='canceled' in Supabase
```

---

## 🔍 Quick Verification

### ✅ Test Mode Active?
```
Check #1: Go to /premium
  → Yellow banner visible? YES ✓

Check #2: Open browser console (F12)
  → Errors about Dodo? NO ✓

Check #3: Check .env.local
  → NEXT_PUBLIC_DODO_MODE=test? YES ✓
```

### ✅ Payment Works?
```
Go to /premium:
  → Enter test card: 4111 1111 1111 1111
  → Success page? YES ✓
  → Supabase has record? YES ✓
  → dodo_subscription_id filled? YES ✓
```

### ✅ Errors Handled?
```
Go to /premium:
  → Enter declined card: 4000 0000 0000 0002
  → Error shown? YES ✓
  → No database record? YES ✓
```

---

## 📊 Key Endpoints & URLs

| What | URL/Endpoint |
|------|--------------|
| Premium Page | `http://localhost:3000/premium` |
| Dodo Dashboard | `https://dashboard.dodopayments.com` |
| Create Subscription | `POST /api/dodo/subscription` |
| Cancel Subscription | `POST /api/dodo/cancel` |
| Config File | `lib/dodo/config.ts` |

---

## 🐛 Quick Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| Banner not showing | Check `DODO_MODE=test`, restart server |
| Payment fails | Try card `4111 1111 1111 1111` |
| No DB record | Check Supabase credentials |
| API error | Verify keys in `.env.local` |
| Plan not found | Ensure plan ID starts with `plan_test_` |

---

## 🔄 Terminal Commands

```powershell
# Restart dev server
Ctrl+C
npm run dev

# Check if .env.local exists
Test-Path .env.local

# Open in VS Code
code .env.local

# View supabase subscriptions
# (Run in Supabase SQL Editor)
SELECT * FROM subscriptions 
WHERE dodo_subscription_id IS NOT NULL 
ORDER BY created_at DESC LIMIT 10;
```

---

## ⏱️ Timeline

```
Account Setup    → 5 min  |████░░░░░░░
Create Plans     → 15 min |████████░░░
Get Credentials  → 5 min  |████░░░░░░░
Env Config       → 10 min |██████░░░░░
Verify Mode      → 5 min  |████░░░░░░░
Test Creation    → 20 min |████████████░
Test Errors      → 10 min |██████░░░░░
Test Cancel      → 10 min |██████░░░░░
────────────────────────────────────
TOTAL            → 80 min |████████████
```

---

## 📋 Pre-Testing Checklist

- [ ] Dodo account created
- [ ] Test mode toggled ON
- [ ] 2 test plans created (monthly & yearly)
- [ ] API keys copied
- [ ] Plan IDs copied
- [ ] `.env.local` updated with all 5 variables
- [ ] Dev server restarted
- [ ] No errors in browser console
- [ ] Yellow test banner visible on `/premium`

**All ✓? Ready to test! →**

---

## 🧪 During Testing

Keep these visible:

1. **This card** (quick reference)
2. **Browser DevTools** (F12 for console)
3. **Dodo Dashboard** (verify transactions)
4. **Supabase Console** (verify database)
5. **Premium Page** (test transactions)

---

## 📱 Mobile Testing

Test mode works on mobile too!

```
1. On same WiFi as dev machine
2. Go to: http://[YOUR_IP]:3000/premium
3. Replace [YOUR_IP] with your machine IP
4. Test all scenarios on mobile
5. Verify responsive design
```

---

## 🚀 When All Tests Pass

```
✅ Yellow banner showing
✅ Monthly subscription works
✅ Yearly subscription works  
✅ Card decline handled
✅ Cancellation works
✅ Database updates correct
✅ No console errors

→ Ready for production! 🎉

Next: Switch to live mode credentials
```

---

## 🔐 Security Checklist

- [ ] Public key in `.env.local` (safe)
- [ ] Secret key in `.env.local` (keep private)
- [ ] `.env.local` NOT in Git (check .gitignore)
- [ ] No credentials in commit messages
- [ ] Test/live kept separate
- [ ] Never share secret keys
- [ ] Restart server after changes

---

## 💡 Pro Tips

1. **Keep this card open** while testing
2. **Use browser DevTools** to monitor network
3. **Check Supabase** after each test
4. **Document your tests** for reference
5. **Note the exact plan IDs** from Dodo
6. **Save API keys** in a password manager
7. **Test both** monthly and yearly plans
8. **Verify cancellation** works fully

---

## 📚 For More Help

- Quick answers → `DODO-TEST-MODE-QUICK-REF.md`
- Environment setup → `DODO-ENV-SETUP.md`
- Step-by-step → `DODO-TEST-MODE-CHECKLIST.md`
- Complete guide → `DODO-TEST-MODE-GUIDE.md`
- Master index → `DODO-TEST-MODE-INDEX.md`

---

## ✨ Test Mode Status

After completing all tests, you should have:

✅ Working test mode
✅ All scenarios tested
✅ Database verified
✅ Error handling confirmed
✅ Ready for production

---

## 🎯 Success Indicators

| Indicator | Status |
|-----------|--------|
| Test banner visible | ✓ |
| Test card works | ✓ |
| Declined card fails | ✓ |
| DB records created | ✓ |
| Cancellation works | ✓ |
| No errors | ✓ |

**Everything green? You're done! 🎉**

---

**Print this page! Keep it handy while testing! 📄**

---

**You've got this! Happy testing! 🚀✨**
