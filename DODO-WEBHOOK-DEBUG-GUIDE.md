# Dodo Payments Webhook Debugging Guide

## Quick Diagnosis

Your webhook isn't saving subscriptions after successful payment. Let's debug systematically.

---

## Step 1: Verify Webhook Endpoint Configuration in Dodo Dashboard

**❌ CRITICAL: If not done, DO THIS FIRST**

1. Log in to [Dodo Dashboard](https://dashboard.dodo.co)
2. Go to **Settings → Webhooks** (or Developer → Webhooks)
3. Create/verify webhook endpoint with:
   - **URL**: `http://localhost:3000/api/dodo/webhook` (local dev) OR your production URL
   - **Events**: Select at least:
     - `checkout.session.completed`
     - `checkout.completed`
     - `subscription.canceled`
4. **Save and enable** the webhook

**For Local Testing (localhost):**
- Dodo's servers CAN'T reach your localhost
- **Solution**: Use ngrok to expose your local server
  ```powershell
  # Download ngrok from ngrok.com, then:
  ngrok http 3000
  # You'll get: https://abc123.ngrok.io
  # Register this URL in Dodo: https://abc123.ngrok.io/api/dodo/webhook
  ```

---

## Step 2: Test Webhook Handling (Without Real Payment)

Use the test endpoint to verify your webhook handler works:

```bash
# Make sure your dev server is running (npm run dev)

# Get your Supabase user ID from Supabase Auth dashboard
# Then edit this command with your real user ID:

curl -X POST http://localhost:3000/api/dodo/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "checkout.session.completed",
    "data": {
      "id": "test_session_123",
      "subscription_id": "sub_test_123",
      "customer_id": "YOUR_ACTUAL_USER_ID_HERE",
      "status": "completed",
      "product_id": "pdt_agiTpgqJJP8KIwhblX6vv",
      "metadata": {
        "user_id": "YOUR_ACTUAL_USER_ID_HERE",
        "interval": "month"
      }
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test webhook sent",
  "webhookResponse": {
    "status": 200,
    "body": { "received": true, "status": "success" }
  }
}
```

**Then check:**
- Terminal logs should show: "Session data from Dodo:", "Extracted data:", "Saving subscription..."
- Supabase: New row in `subscriptions` table with your user_id

---

## Step 3: Test Real Payment Flow

### Success Path (4111 1111 1111 1111):
1. Go to `/premium` page
2. Click "Subscribe Now" 
3. Complete payment with test card
4. Get redirected back to your app
5. **Check terminal logs** for webhook output
6. **Check Supabase** `subscriptions` table for new record

### What to Look For:

**In Terminal:**
```
✅ GOOD - You should see:
Received Dodo webhook: { event: 'checkout.session.completed', ... }
Session data from Dodo: { ... full JSON ... }
Extracted data: { userId: '...', subscriptionId: '...', planId: '...' }
Saving subscription: { user_id: '...', status: 'active', ... }
Subscription saved successfully from webhook: [...]

❌ BAD - You might see:
Error processing webhook: ...
(means webhook wasn't reached)

OR

Missing required webhook data: { subscriptionId: undefined, userId: undefined }
(means field names from Dodo don't match what we're extracting)
```

**In Supabase:**
```sql
-- Run this query to check:
SELECT * FROM subscriptions WHERE user_id = 'your-user-id' ORDER BY updated_at DESC LIMIT 1;

-- Should show:
✅ GOOD: Status = 'active', user_id populated, dodo_subscription_id populated
❌ BAD: No record found, OR status != 'active'
```

---

## Step 4: Diagnose Issues

### Issue: "No active subscription found for user" (Success page shows error)

**Cause 1: Webhook not configured in Dodo Dashboard**
- Solution: Register webhook URL in Dodo settings (Step 1)

**Cause 2: Webhook URL unreachable (localhost without ngrok)**
- Solution: Use ngrok for local testing OR deploy to production

**Cause 3: Webhook reached but data format mismatch**
- **Fix**: Check terminal logs for "Extracted data:" 
- If any field is `undefined`, Dodo sends different field names
- Report exact JSON from "Session data from Dodo:" line
- We'll adjust field extraction in webhook handler

**Cause 4: Supabase permission issue**
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local` (not anon key)
- Check Supabase dashboard → Subscriptions table exists with columns:
  - user_id (primary key)
  - dodo_subscription_id, dodo_plan_id, status, interval, current_period_start, current_period_end, updated_at

---

## Step 5: Debug Checklist

Run through this systematically:

- [ ] Webhook URL registered in Dodo Dashboard
- [ ] For local testing: Using ngrok (or deployed to production)
- [ ] Dev server running (`npm run dev`)
- [ ] Test webhook shows success response
- [ ] Test webhook causes new row in Supabase subscriptions table
- [ ] Real payment with success card redirects to success page
- [ ] Success page shows "Welcome to Lexora Pro" (not error)
- [ ] Supabase subscriptions table has your subscription record

---

## Step 6: If Still Failing - Collect Logs

**Make a test payment and share:**

1. **Terminal output** from server (lines with "Dodo webhook")
2. **Success/Error page** screenshot
3. **Supabase subscriptions table** screenshot or query result
4. **Dodo Dashboard webhook status** - show if webhook was triggered

This info will pinpoint exactly where the flow breaks.

---

## API Endpoints Reference

| Endpoint | Purpose | Example Call |
|----------|---------|--------------|
| POST `/api/dodo/subscription` | Create checkout session | Called when user clicks "Subscribe Now" |
| POST `/api/dodo/webhook` | Receive payment confirmation | Called by Dodo after successful payment |
| POST `/api/dodo/test-webhook` | Test webhook handling | Use for debugging without real payment |
| GET `/premium/success` | Show payment result | Redirected after Dodo checkout |

---

## Key URLs

- **Dodo Test API**: https://test.dodopayments.com
- **Dodo Dashboard**: https://dashboard.dodo.co
- **Your Webhook URL** (local): http://localhost:3000/api/dodo/webhook
- **Your Webhook URL** (with ngrok): https://[ngrok-id].ngrok.io/api/dodo/webhook

---

## Common Dodo Test Cards

| Type | Card Number | CVC |
|------|-------------|-----|
| Success | 4111 1111 1111 1111 | Any 3 digits |
| Failure | 4000 0000 0000 0002 | Any 3 digits |

Use expiry date: Any future date (e.g., 12/25)
