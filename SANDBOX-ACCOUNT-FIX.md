# Quick Fix: Create PayPal Sandbox Buyer Account

The card address verification is failing. Here's the easiest solution:

## Step-by-Step Instructions

### 1. Go to PayPal Developer Dashboard
Open this URL: https://developer.paypal.com/dashboard/accounts

### 2. Create a Personal Account
- Click **"Create Account"** button
- Select **Account Type: Personal**
- Select **Country: United States** (or your preferred country)
- Click **"Create"**

### 3. Get the Credentials
After creation, you'll see the account in the list:
- Click on the account to expand it
- You'll see:
  - **Email:** Something like `sb-xxxxx@personal.example.com`
  - **Password:** Auto-generated password
- **Copy both** - you'll need them

### 4. Test Your Subscription
1. Go to: http://localhost:3000/premium
2. Click the PayPal Subscribe button
3. In the PayPal popup:
   - **Use the PERSONAL account credentials** (email and password you just copied)
   - Do NOT use your business account
   - Do NOT try to use cards
4. Login and approve the subscription
5. You should be redirected to the success page!

---

## Why This Works Better

✅ **No address verification needed** - PayPal generates valid test addresses automatically
✅ **Pre-configured** - Everything is set up correctly
✅ **Realistic testing** - Tests the full PayPal login flow
✅ **Works every time** - No random verification issues

---

## Alternative: Disable Address Verification (Advanced)

If you really want to use cards, you can modify the PayPal SDK to skip address verification, but this requires code changes. The personal account method above is much simpler.

---

## After Testing

Once you confirm the subscription works:
1. Check http://localhost:3000/premium/success for the success page
2. Check your Supabase database - you should see a new subscription record
3. Log into https://www.sandbox.paypal.com with your BUSINESS account to see the incoming subscription

---

**Go create the personal account now and test!** 🚀
