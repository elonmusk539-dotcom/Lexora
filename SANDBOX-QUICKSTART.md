# 🚀 PayPal Sandbox - Quick Start

You've successfully switched to PayPal Sandbox mode! Follow these steps to complete setup and start testing.

---

## ✅ What's Already Done

- ✅ Sandbox Client ID configured in `.env.local`
- ✅ Sandbox Secret Key saved
- ✅ Code updated with better error handling
- ✅ Production credentials saved as comments for later

---

## 🎯 Next Steps (Do This Now!)

### Step 1: Create Sandbox Subscription Plans

Run this PowerShell script to automatically create your subscription plans:

```powershell
.\scripts\create-sandbox-plans.ps1
```

**What this does:**
- Creates a Product in PayPal Sandbox
- Creates Monthly plan ($2.99/month)
- Creates Yearly plan ($28.99/year)  
- Gives you the Plan IDs to copy

**If you get an execution policy error:**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\create-sandbox-plans.ps1
```

---

### Step 2: Update .env.local with Plan IDs

After running the script, you'll get output like:

```
NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY=P-XXXXXXXXXXXXX
NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY=P-YYYYYYYYYYYYYYY
```

**Copy these and replace** the current plan IDs in your `.env.local` file.

---

### Step 3: Restart Your Dev Server

```bash
# Stop current server (Ctrl+C if running)
npm run dev
```

---

### Step 4: Test the Subscription Flow

1. **Open your app:**
   ```
   http://localhost:3000/premium
   ```

2. **Look for "Sandbox" indicator** - You should see PayPal shows "Sandbox" mode

3. **Click Subscribe** and use one of these test methods:

   **Option A: Test Card (No PayPal Account Needed)**
   - Click "Pay with Debit or Credit Card"
   - Use test card: `4032033987187641`
   - Expiry: Any future date (e.g., `12/2026`)
   - CVV: Any 3 digits (e.g., `123`)

   **Option B: Sandbox PayPal Account**
   - Log in with your sandbox personal account
   - (Create one at https://developer.paypal.com/dashboard/accounts if needed)

4. **Complete the purchase** and verify:
   - ✅ Redirects to success page
   - ✅ Subscription appears in Supabase database
   - ✅ Premium features unlock

---

## 🧪 Test Cards

| Card Type | Number | Notes |
|-----------|--------|-------|
| Visa | `4032033987187641` | Success |
| Mastercard | `5425233430109903` | Success |
| Amex | `378282246310005` | Success |
| Declined | `4000000000000002` | Tests error handling |

**Expiry:** Any future date  
**CVV:** Any 3 digits  
**ZIP:** Any 5 digits

---

## 🔍 Verify Everything Works

### Check Browser Console (F12)
- Should NOT see any PayPal errors
- Should see successful API calls

### Check PayPal Sandbox Dashboard
1. Go to: https://www.sandbox.paypal.com
2. Log in with your sandbox **business account**
3. Check transactions - you should see the subscription

### Check Supabase Database
1. Go to your Supabase dashboard
2. Open `subscriptions` table
3. Verify new subscription record exists with correct data

---

## ❌ Troubleshooting

### "Things don't appear to be working"
- Make sure you ran the script to create sandbox plans
- Verify Plan IDs in `.env.local` match the script output
- Check that plans are ACTIVE in sandbox

### PayPal button doesn't show
- Clear browser cache
- Check browser console for errors
- Verify Client ID is correct in `.env.local`

### Script fails with "401 Unauthorized"
- Double-check Client ID and Secret Key in `.env.local`
- Make sure you copied them correctly (no extra spaces)

---

## 🚀 When You're Ready to Go Live

1. **Update `.env.local`** - uncomment production credentials:
   ```env
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=Afo4JDNyPVqFHlF4ra_SJdDCXAfM4pBmx1VW19eLcWd73vNZSUTjSdp1Lo7ILyHLmyFReEBitVFwf7Ut
   NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY=P-46L67236992761240ND6OTJI
   NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY=P-5WV83425FL4882210ND6PAQY
   ```

2. **Enable card payments** in your live PayPal Business account (see `PAYPAL-CARD-PAYMENT-FIX.md`)

3. **Deploy to production** with updated environment variables

4. **Test with a real payment** (small amount first!)

---

## 📚 Additional Resources

- **Full Setup Guide:** `PAYPAL-SANDBOX-SETUP.md`
- **Card Payment Issues:** `PAYPAL-CARD-PAYMENT-FIX.md`
- **Scripts Help:** `scripts/README.md`

---

## 💡 Quick Commands Reference

```powershell
# Create sandbox plans
.\scripts\create-sandbox-plans.ps1

# Test configuration
node scripts/test-paypal-config.js

# Start dev server
npm run dev

# View logs
# Just watch the terminal where dev server is running
```

---

**Ready to start?** Run the plan creation script now! ⬆️
