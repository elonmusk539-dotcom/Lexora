# 🔄 Dodo Payments - Proper Integration Flow

**How the new integration works**

---

## ✨ What Changed

Instead of directly subscribing without payment, the app now:

1. ✅ Creates a checkout session with Dodo
2. ✅ Redirects user to Dodo's checkout page
3. ✅ User enters payment information
4. ✅ Dodo processes the payment
5. ✅ Dodo sends a webhook to your server
6. ✅ Your server saves subscription to Supabase
7. ✅ User is redirected to success page

---

## 📊 New Flow Diagram

```
User clicks "Subscribe Now"
        ↓
Frontend calls /api/dodo/subscription
        ↓
API creates checkout session with Dodo
        ↓
API returns checkout URL
        ↓
Frontend redirects to Dodo checkout page
        ↓
User enters payment details
        ↓
User completes payment on Dodo
        ↓
Dodo processes payment
        ↓
Dodo sends webhook to /api/dodo/webhook
        ↓
Webhook saves subscription to Supabase
        ↓
Dodo redirects user to success page
        ↓
✅ Subscription activated!
```

---

## 🔧 Code Changes Made

### 1. `app/api/dodo/subscription/route.ts` - UPDATED

**What it does:**
- Creates a checkout session with Dodo API
- Uses your `DODO_API_KEY` and `DODO_API_SECRET` (secret key)
- Returns the checkout URL

**Key code:**
```typescript
// Call Dodo API to create checkout session
const dodoResponse = await fetch('https://api.dodopayments.com/v1/checkout/sessions', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(checkoutData),
});
```

### 2. `app/premium/page.tsx` - UPDATED

**What it does:**
- Calls `/api/dodo/subscription` to create a checkout session
- Redirects user to Dodo checkout URL
- No longer creates mock subscriptions

**Key code:**
```typescript
// Redirect user to Dodo checkout page
window.location.href = checkoutUrl;
```

### 3. `app/api/dodo/webhook/route.ts` - NEW

**What it does:**
- Receives webhooks from Dodo after payment
- Saves subscription to Supabase when payment succeeds
- Handles subscription cancellations

**Webhook events handled:**
- `checkout.session.completed` - Payment successful
- `subscription.canceled` - Subscription cancelled

---

## 🔑 Environment Variables Needed

Make sure your `.env.local` has:

```env
# Publishable key (frontend-safe, no secret needed for test mode)
NEXT_PUBLIC_DODO_API_KEY=pk_test_xxx

# Secret key (server-side only, must be kept private)
DODO_API_KEY=pk_test_xxx
DODO_API_SECRET=sk_test_xxx

# Plan IDs
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=plan_test_xxx
NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=plan_test_xxx

# App URL (for success/cancel redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🧪 How to Test

### Step 1: Click Subscribe Now
1. Go to `/premium`
2. Click "Subscribe Now" button
3. You should be redirected to Dodo checkout page

### Step 2: Complete Payment
1. On Dodo checkout page
2. Use test card: `4111 1111 1111 1111`
3. Expiry: 12/25, CVC: 123
4. Click Pay

### Step 3: Verify in Supabase
1. Open Supabase dashboard
2. Go to `subscriptions` table
3. Check for new record with:
   - `dodo_subscription_id` populated
   - `status` = 'active'
   - `dodo_plan_id` correct

### Step 4: Check Success Page
1. After payment, you should see success page
2. Your user profile should show Pro tier

---

## ⚙️ Configuration in Dodo

### Required Setup in Dodo Dashboard

1. **Set Webhook URL**
   - Go to Settings → Webhooks
   - Add webhook URL: `https://yourapp.com/api/dodo/webhook`
   - Select events:
     - `checkout.session.completed`
     - `subscription.canceled`

2. **Test Mode vs Live Mode**
   - Test Mode: Use `pk_test_` and `sk_test_` keys
   - Live Mode: Use `pk_live_` and `sk_live_` keys

---

## 🔐 How Payment Data Stays Secure

1. ✅ User never enters card on your site
2. ✅ Payment processed by Dodo (PCI compliant)
3. ✅ Your server only handles subscription data
4. ✅ API calls use Basic Auth with secret key
5. ✅ Webhook validates payment before saving

---

## 📝 What Happens in Each Step

### Step 1: Frontend - Subscribe Button Click
```
User: Clicks "Subscribe Now"
Frontend: Gets user ID from Supabase auth
Frontend: Gets plan ID from environment
Frontend: Calls POST /api/dodo/subscription with:
  - planId
  - userId
  - interval (month/year)
```

### Step 2: Backend - Create Checkout Session
```
API: Receives request
API: Validates inputs
API: Creates Basic Auth header with secret key
API: Calls Dodo API: POST /v1/checkout/sessions
API: Receives checkout URL from Dodo
API: Returns checkout URL to frontend
```

### Step 3: Frontend - Redirect to Dodo
```
Frontend: Receives checkout URL
Frontend: Redirects: window.location.href = checkoutUrl
User: Now on Dodo checkout page
```

### Step 4: User - Enter Payment
```
User: Enters card details
User: Clicks "Pay"
Dodo: Processes payment
Dodo: Sends webhook to your app
Dodo: Redirects user to success page
```

### Step 5: Backend - Webhook Processing
```
Dodo: Sends webhook POST to /api/dodo/webhook
API: Validates webhook data
API: Extracts subscription info
API: Saves to Supabase subscriptions table
API: Returns success to Dodo
```

### Step 6: Frontend - Show Success
```
User: Sees success page
Frontend: Queries Supabase for new subscription
User: Profile now shows "Pro" tier
```

---

## 🐛 Troubleshooting

### Issue: Redirected to Dodo but get error

**Cause:** Missing credentials or wrong Dodo URL

**Fix:**
- Check `DODO_API_KEY` and `DODO_API_SECRET` in `.env.local`
- Verify credentials are for test mode (start with `pk_test_` and `sk_test_`)
- Restart dev server after changing `.env.local`

### Issue: Payment succeeds but no subscription appears

**Cause:** Webhook not received or webhook URL not configured

**Fix:**
1. Check webhook is configured in Dodo dashboard
2. Make sure webhook URL is correct: `https://yourapp.com/api/dodo/webhook`
3. Check server logs for webhook errors
4. Verify Supabase credentials in webhook handler

### Issue: Get error "checkout URL is undefined"

**Cause:** Dodo API returned error

**Fix:**
1. Check plan ID is correct (matches Dodo dashboard)
2. Verify plan ID starts with `plan_test_` for test mode
3. Check browser console for error message
4. Check server logs for Dodo API response

### Issue: Webhook not saving to Supabase

**Cause:** Webhook receives data but can't save

**Fix:**
1. Check Supabase credentials in webhook handler
2. Verify `subscriptions` table exists
3. Verify required columns exist: `user_id`, `dodo_subscription_id`, `dodo_plan_id`, `status`, `interval`
4. Check Supabase RLS policies allow inserts

---

## 📊 Flow Comparison

### Old Flow (Mock)
```
Subscribe → Direct save to DB → Success page
```
**Problem:** No actual payment

### New Flow (Real)
```
Subscribe → Create Dodo session → Redirect to Dodo 
→ User pays → Webhook received → Save to DB → Success page
```
**Benefit:** Actual payment processed by Dodo

---

## ✅ Verification Checklist

- [ ] Credentials set in `.env.local`
- [ ] Dev server restarted
- [ ] Can click "Subscribe Now"
- [ ] Redirected to Dodo checkout
- [ ] Can complete test payment
- [ ] Webhook URL configured in Dodo
- [ ] Subscription appears in Supabase
- [ ] User profile shows Pro tier
- [ ] No errors in server logs

---

## 🔑 Key Points

1. **Publishable key** = Used by frontend (safe to expose)
2. **Secret key** = Used by backend API (keep private)
3. **Webhook** = Dodo → Your server (payment confirmation)
4. **Checkout URL** = Where user enters payment details
5. **Supabase save** = Only happens after Dodo confirms payment

---

## 📞 Testing Dodo Checkout

### Test Card (Always Succeeds)
```
Card: 4111 1111 1111 1111
Expiry: 12/25
CVC: 123
Name: Any name
Email: Any email
```

### Declined Card
```
Card: 4000 0000 0000 0002
Expiry: 12/25
CVC: 123
```

---

## 🎯 Summary

**What changed:**
- Mock subscription → Real Dodo checkout
- Direct DB save → Webhook-triggered save
- No payment → Real payment processing

**Why it's better:**
- ✅ Actual payments processed
- ✅ Only save after confirmed payment
- ✅ PCI compliant (Dodo handles card data)
- ✅ Production-ready integration

---

## 🚀 Next Steps

1. Restart dev server
2. Go to `/premium`
3. Click "Subscribe Now"
4. Complete test payment on Dodo
5. Verify subscription saved in Supabase
6. Check your user profile shows Pro tier

---

**Ready to test the real payment flow! 🎉**
