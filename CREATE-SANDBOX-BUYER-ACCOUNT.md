# Create PayPal Sandbox Buyer Account

## The Problem
You're trying to login with your **business (seller)** account, but PayPal won't let you buy from yourself. You need a separate **personal (buyer)** account for testing.

---

## Solution 1: Use Test Card (RECOMMENDED - No Account Needed)

This is the easiest way to test:

### Steps:
1. Go to http://localhost:3000/premium
2. Click the PayPal Subscribe button
3. In the PayPal popup, click **"Pay with Debit or Credit Card"** (or "Pay by Card")
4. **DO NOT login** - just fill in the card form:
   - **Card Number:** `4032033987187641`
   - **Expiry:** `12/2026` (any future date)
   - **CVV:** `123` (any 3 digits)
   - **Name:** John Doe (any name)
   - **ZIP/Postal:** `12345` (any 5 digits)
5. Complete the purchase

This should work perfectly in sandbox mode!

---

## Solution 2: Create Sandbox Personal Account (If You Want to Test PayPal Login)

### Steps:

1. **Go to PayPal Developer Dashboard**
   ```
   https://developer.paypal.com/dashboard/accounts
   ```

2. **Click "Create Account"**

3. **Select Account Type:**
   - Choose **"Personal"** (not Business!)
   - This will be your buyer/customer account

4. **Fill in details:**
   - **Country:** United States (or your country)
   - **Email:** Will be auto-generated (like `sb-xxxxx@personal.example.com`)
   - **Password:** Will be auto-generated

5. **Click "Create Account"**

6. **Save the credentials:**
   - Click on the newly created account
   - Note the **Email** and **Password**
   - You'll use these to login during testing

### Using the Personal Account:

1. Go to http://localhost:3000/premium
2. Click PayPal Subscribe button
3. In the popup, **login with the PERSONAL account** (not your business account)
4. Complete the subscription

---

## Quick Reference

### Your Accounts:

| Type | Purpose | Where to Use |
|------|---------|--------------|
| **Business Account** | Receives payments (seller) | Login at https://www.sandbox.paypal.com to view transactions |
| **Personal Account** | Makes purchases (buyer) | Login in the PayPal popup when testing subscriptions |

### Test Cards (No Account Needed):

| Card Type | Number | Expiry | CVV |
|-----------|--------|--------|-----|
| Visa | `4032033987187641` | Any future date | Any 3 digits |
| Mastercard | `5425233430109903` | Any future date | Any 3 digits |
| Amex | `378282246310005` | Any future date | Any 4 digits |

---

## Recommended Testing Flow

1. **First Test:** Use test card (no login) - fastest way
2. **Second Test:** Create personal account and test with PayPal login
3. **Third Test:** Check business account at https://www.sandbox.paypal.com to see the transaction

---

## Common Mistakes to Avoid

❌ **DON'T:** Try to login with your business/seller account in the PayPal popup
✅ **DO:** Use test card directly OR login with a personal/buyer account

❌ **DON'T:** Use your real PayPal credentials in sandbox
✅ **DO:** Use sandbox-generated accounts or test cards

---

## Next Steps

1. Try the test card method first (easiest!)
2. If that works, your PayPal integration is good to go
3. Create a personal account only if you need to test the PayPal login flow specifically

**Go ahead and test now at:** http://localhost:3000/premium 🚀
