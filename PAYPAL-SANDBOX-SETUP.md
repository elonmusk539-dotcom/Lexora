# PayPal Sandbox Setup Guide

## 🎯 Overview
You've switched to PayPal Sandbox mode for testing. Follow these steps to complete the setup and test your subscription flow.

## ✅ What's Already Done
- ✅ Sandbox Client ID configured: `AXo8K6v4riUpmUTjbxqmAvpJGO-L4SGGIOGAsSVp7GMimavGrw-V4HzpjEIBtxd4P5VAzSoHiAIOSjoo`
- ✅ Sandbox Secret Key saved (for future API calls if needed)
- ✅ Code updated to use environment variables

---

## 📋 Required Steps

### Step 1: Create Sandbox Subscription Plans

You need to create test subscription plans in the PayPal sandbox.

#### Option A: Create Plans via PayPal Developer Dashboard (Recommended)

1. **Go to PayPal Developer Dashboard**
   ```
   https://developer.paypal.com/dashboard/
   ```

2. **Log in** with your PayPal account

3. **Navigate to Sandbox > Accounts**
   - You should see your sandbox business account
   - Note the email address (you'll need it)

4. **Create Subscription Plans**
   
   Since there's no direct UI for subscription plans in the sandbox dashboard, you'll need to use the PayPal API or create them programmatically.

#### Option B: Create Plans Using API (Quick Method)

I'll create a script for you to generate the plans:

**Run this script to create sandbox plans:**

```bash
# In your terminal
node scripts/create-sandbox-plans.js
```

#### Option C: Use REST API Directly

You can also create plans using curl or Postman. Here's the workflow:

1. **Get Access Token**
   ```bash
   curl -v https://api-m.sandbox.paypal.com/v1/oauth2/token \
     -H "Accept: application/json" \
     -H "Accept-Language: en_US" \
     -u "AXo8K6v4riUpmUTjbxqmAvpJGO-L4SGGIOGAsSVp7GMimavGrw-V4HzpjEIBtxd4P5VAzSoHiAIOSjoo:EPCUrk65TBpZHxqRla69sNuL5fLVadNucNqoN0tCTbweR59PxAiItpKIekfRmFvKux7LWMAtzKkekeJC" \
     -d "grant_type=client_credentials"
   ```

2. **Create Monthly Plan**
   ```bash
   curl -v -X POST https://api-m.sandbox.paypal.com/v1/billing/plans \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -d '{
       "product_id": "PROD-XXXX",
       "name": "Lexora Pro Monthly",
       "description": "Monthly subscription to Lexora Pro",
       "status": "ACTIVE",
       "billing_cycles": [
         {
           "frequency": {
             "interval_unit": "MONTH",
             "interval_count": 1
           },
           "tenure_type": "REGULAR",
           "sequence": 1,
           "total_cycles": 0,
           "pricing_scheme": {
             "fixed_price": {
               "value": "2.99",
               "currency_code": "USD"
             }
           }
         }
       ],
       "payment_preferences": {
         "auto_bill_outstanding": true,
         "setup_fee": {
           "value": "0",
           "currency_code": "USD"
         },
         "setup_fee_failure_action": "CONTINUE",
         "payment_failure_threshold": 3
       }
     }'
   ```

---

### Step 2: Update Environment Variables with Sandbox Plan IDs

After creating the plans, update `.env.local`:

```env
NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY=P-XXXXXXXXXXXXX  # Replace with your sandbox monthly plan ID
NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY=P-YYYYYYYYYYYYYYY   # Replace with your sandbox yearly plan ID
```

---

### Step 3: Set Up Sandbox Test Accounts

1. **Go to Sandbox Accounts**
   ```
   https://developer.paypal.com/dashboard/accounts
   ```

2. **You should have TWO accounts:**
   - **Business Account**: Receives payments (already created)
   - **Personal Account**: Makes test purchases

3. **If you don't have a Personal account:**
   - Click **"Create Account"**
   - Select **"Personal"**
   - Choose your country
   - Click **"Create Account"**

4. **Note the credentials:**
   - Click on each account to view email and password
   - Save these - you'll use them to test payments

---

### Step 4: Restart Your Development Server

```powershell
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

---

## 🧪 Testing Your Subscription Flow

### Test Scenario 1: Successful Subscription

1. **Start your app** (should already be running on http://localhost:3000)

2. **Go to Premium page**
   ```
   http://localhost:3000/premium
   ```

3. **Click on PayPal Subscribe button**
   - You should see the PayPal popup
   - Notice it says "Sandbox" at the top

4. **Choose payment method:**
   - **Option A**: Log in with sandbox personal account
   - **Option B**: Use sandbox test card (Pay with Debit or Credit Card)

5. **Test Cards (Sandbox)**
   - **Visa**: `4032033987187641`
   - **Mastercard**: `5425233430109903`
   - **Amex**: `378282246310005`
   - **Expiry**: Any future date (e.g., 12/2026)
   - **CVV**: Any 3 digits (e.g., 123)

6. **Complete the subscription**

7. **Verify success:**
   - You should be redirected to success page
   - Check your Supabase database for the subscription record
   - Check PayPal sandbox for the subscription

---

### Test Scenario 2: Failed Payment

1. **Use a declined card:**
   - Card: `4000000000000002` (Declined)
   - This should trigger an error

2. **Verify error handling:**
   - Should show friendly error message
   - Should not create subscription in database

---

### Test Scenario 3: Cancel Flow

1. Log into sandbox business account:
   ```
   https://www.sandbox.paypal.com
   ```

2. Navigate to subscriptions

3. Cancel a test subscription

4. Verify webhook handling (if you've set up webhooks)

---

## 🔍 Debugging Tips

### Check PayPal Sandbox Activity

1. **Log into Sandbox Business Account**
   ```
   https://www.sandbox.paypal.com
   ```

2. **View Recent Transactions**
   - Check if subscriptions are being created
   - Verify amounts are correct

### Check Browser Console

1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for any PayPal errors
4. Check **Network** tab for API calls

### Common Issues

| Issue | Solution |
|-------|----------|
| "Things don't appear to be working" | Plan IDs might be incorrect or plans not active |
| PayPal button doesn't load | Check Client ID is correct |
| Redirect fails | Verify `NEXT_PUBLIC_APP_URL` is set |
| Database not updating | Check Supabase service role key |

---

## 📊 Verify Everything Works

### Checklist Before Testing

- [ ] Sandbox Client ID is in `.env.local`
- [ ] Sandbox subscription plans are created and active
- [ ] Plan IDs are updated in `.env.local`
- [ ] Dev server is restarted
- [ ] Browser cache is cleared
- [ ] You have sandbox test account credentials

### What to Test

- [ ] Monthly subscription flow
- [ ] Yearly subscription flow  
- [ ] Payment with sandbox PayPal account
- [ ] Payment with test card
- [ ] Error handling (declined card)
- [ ] Success page redirect
- [ ] Database record creation
- [ ] Premium features unlock

---

## 🚀 Going Live (After Testing)

When you're ready to go live:

1. **Update `.env.local` with production credentials:**
   ```env
   # Switch back to production
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=Afo4JDNyPVqFHlF4ra_SJdDCXAfM4pBmx1VW19eLcWd73vNZSUTjSdp1Lo7ILyHLmyFReEBitVFwf7Ut
   NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY=P-46L67236992761240ND6OTJI
   NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY=P-5WV83425FL4882210ND6PAQY
   ```

2. **Ensure production plans are set up** in your live PayPal account

3. **Deploy to Vercel** with production environment variables

4. **Test with real payment** (use small amount first!)

---

## 📞 Need Help?

- **PayPal Sandbox Issues**: https://developer.paypal.com/support/
- **API Reference**: https://developer.paypal.com/docs/api/subscriptions/v1/
- **Test Cards**: https://developer.paypal.com/tools/sandbox/card-testing/

---

## 🎓 Next Steps

1. **Run the plan creation script** (I'll create this next)
2. **Get your sandbox plan IDs**
3. **Update `.env.local`** with those IDs
4. **Restart dev server**
5. **Test the subscription flow**
6. **Verify in sandbox dashboard**

Let me know once you have your sandbox plan IDs, or if you'd like me to create a script to generate them automatically!
