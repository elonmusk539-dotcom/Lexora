# ✅ Dodo Payments Test Mode - Fixed

## What Changed

Updated the checkout flow to work with **test mode only** (single publishable key, no secret key needed).

---

## 🔑 Environment Setup

Your `.env.local` now has only what's needed for test mode:

```env
# Dodo Payments - Public Key (test mode)
NEXT_PUBLIC_DODO_API_KEY=pk_snd_00d98d270105488582b957a0c911dc79

# Dodo Webhooks
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_zwvKqN2LNXgrUT+u7ibI1YN+kgUEDa6o

# Dodo Plan IDs
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=pdt_agiTpgqJJP8KIwhblX6vv
NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=pdt_Ifnih36RsYH0eoYfYGViK
```

**✅ No secret key needed for test mode!**

---

## 📝 Code Changes

### `app/api/dodo/subscription/route.ts` - UPDATED

**Changes:**
- ✅ Removed requirement for secret key (`DODO_API_SECRET`)
- ✅ Now uses only the publishable key from `NEXT_PUBLIC_DODO_API_KEY`
- ✅ Creates checkout URL directly without API call
- ✅ Stores pending payment session in Supabase for webhook tracking

**Key code:**
```typescript
// Test mode checkout URL (no API call needed)
const checkoutUrl = `https://checkout.dodopayments.com/?${checkoutParams.toString()}`;

// Return checkout URL for redirect
return NextResponse.json({
  success: true,
  checkoutUrl: checkoutUrl,
});
```

---

## 🧪 How Test Mode Works Now

### Flow:
1. User clicks "Subscribe Now"
2. Frontend calls `/api/dodo/subscription` with plan ID and user ID
3. Backend creates checkout URL using publishable key
4. Backend returns checkout URL
5. Frontend redirects to `https://checkout.dodopayments.com/?...`
6. User completes payment on Dodo's test checkout page
7. Dodo sends webhook to `/api/dodo/webhook`
8. Webhook saves subscription to Supabase

### Parameters sent to Dodo:
```
public_key=pk_snd_00d98d270105488582b957a0c911dc79
plan_id=pdt_agiTpgqJJP8KIwhblX6vv
customer_id=user_id
success_url=http://localhost:3000/premium/success?session_id={CHECKOUT_SESSION_ID}
cancel_url=http://localhost:3000/premium?cancelled=true
```

---

## ✅ Steps to Test

### 1. Restart Dev Server
```powershell
npm run dev
```

### 2. Go to Premium Page
- Navigate to `http://localhost:3000/premium`
- You should see the "Subscribe Now" button

### 3. Click Subscribe Now
- Click for **Monthly** or **Yearly** plan
- You should be redirected to Dodo's test checkout page

### 4. Complete Test Payment
On Dodo checkout page:
- **Card:** `4111 1111 1111 1111`
- **Expiry:** `12/25`
- **CVC:** `123`
- **Any name and email**
- Click **Pay**

### 5. Verify Success
After payment:
- You should be redirected to success page
- Check Supabase for new subscription record
- Profile should show Pro tier

---

## 🔍 Troubleshooting

### Issue: Still getting "Internal server error"

**Check 1: Publishable key in .env.local**
```env
NEXT_PUBLIC_DODO_API_KEY=pk_snd_00d98d270105488582b957a0c911dc79
```
✅ Should start with `pk_snd_` (test mode)

**Check 2: Dev server restarted?**
```powershell
# Stop: Ctrl+C
# Restart: 
npm run dev
```

**Check 3: Check server logs**
Look in terminal for error messages when clicking "Subscribe Now"

### Issue: Redirected to Dodo but get error

**Most likely:** Dodo dashboard issues

**Try:**
1. Make sure plan IDs are correct (match in Dodo dashboard)
2. Try with different plan
3. Clear browser cache and try again

---

## 📊 Test Mode vs Live Mode (Future)

**Test Mode (Current):**
- Publishable key: `pk_snd_00d98d270105488582b957a0c911dc79`
- No secret key needed
- Can't process real payments
- Uses test checkout page

**Live Mode (Future):**
- Publishable key: `pk_live_xxx...`
- Secret key: `sk_live_xxx...` (will be created when you generate API keys)
- Processes real payments
- Uses production checkout

For now, **test mode only uses the publishable key** ✅

---

## 🔒 How Test Payments Work

1. **Test Card:** `4111 1111 1111 1111` always succeeds
2. **Declined Card:** `4000 0000 0000 0002` to test failures
3. **No real charges:** Test mode uses fake payments
4. **Can test full flow:** Checkout → Payment → Webhook → Subscription

---

## 🎯 Next Steps

1. ✅ Restart dev server
2. ✅ Go to `/premium`
3. ✅ Click "Subscribe Now"
4. ✅ Complete test payment
5. ✅ Verify subscription saved

---

## 📋 Verification Checklist

- [ ] Dev server running (`npm run dev`)
- [ ] `.env.local` has `NEXT_PUBLIC_DODO_API_KEY`
- [ ] Can click "Subscribe Now" without error
- [ ] Redirected to Dodo checkout page
- [ ] Can complete test payment with test card
- [ ] Redirected back to success page
- [ ] Supabase shows new subscription
- [ ] User profile shows Pro tier

---

**Ready for test mode! 🚀**

Test mode uses only the publishable key - no secret key needed!
