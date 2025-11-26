# 🔧 Dodo Payments - Integration Debug

## Current Issue
When clicking "Subscribe Now":
- ✅ Redirects to https://checkout.dodopayments.com/?public_key=...&plan_id=...
- ❌ Gets error: "Something went wrong - link might be expired, or the link/product might be invalid"

## Root Cause Analysis

The checkout URL parameters we're sending might not be in the format Dodo expects.

## What We Need to Find Out

### 1. Dodo Dashboard - Checkout Documentation
In your Dodo Payments Dashboard, look for:
- **Settings → Webhooks/Integration**
- **Docs → Checkout**
- **Test Mode → Hosted Checkout**

### 2. Correct Parameters Format
Dodo might expect:
```
Option A: https://checkout.dodopayments.com/?public_key=XXX&plan_id=XXX
Option B: https://checkout.dodopayments.com/plan/XXX?key=XXX
Option C: https://checkout.dodopayments.com/session/XXX
Option D: Something completely different
```

### 3. Session Creation Requirement
Some payment processors require:
- Create session via API first
- Get session ID from API response
- Then redirect to: `https://checkout.dodopayments.com/session/{SESSION_ID}`

## Current Implementation

**File:** `app/api/dodo/subscription/route.ts`

**Current URL format:**
```
https://checkout.dodopayments.com/?public_key=pk_snd_00d98d270105488582b957a0c911dc79&plan_id=pdt_agiTpgqJJP8KIwhblX6vv&customer_id=user_123&success_url=...&cancel_url=...
```

**Problem:** This might not match what Dodo expects

## Next Steps to Debug

### Step 1: Check Dodo Dashboard Documentation
1. Log in to https://dashboard.dodopayments.com
2. Look for API/Integration docs
3. Find the exact checkout URL format for test mode
4. Look for parameters: public_key, plan_id, customer_id, etc.

### Step 2: Check Dodo Help/Support
- Is there a hosted checkout setup guide?
- What's the correct URL format?
- Do we need to create a session first?

### Step 3: Look for Dodo SDK/Library
- Does Dodo provide a JavaScript SDK?
- Is there a redirect-based checkout?
- Or embedded/iframe checkout?

## Possible Solutions

### Solution 1: Correct URL Parameters
If Dodo docs show a different parameter format, update the route.ts file

### Solution 2: API-based Session Creation
If Dodo requires creating a session via API first, update to:
1. POST to Dodo API: Create checkout session
2. Get session ID from response
3. Redirect to: `https://checkout.dodopayments.com/session/{SESSION_ID}`

### Solution 3: Different Checkout Domain
If Dodo uses a different checkout domain:
- Change `https://checkout.dodopayments.com/` to the correct domain

### Solution 4: SDK-based Integration
If Dodo provides an SDK, use that instead of custom redirect

---

## Information Needed from You

Please check your Dodo Dashboard and tell me:

1. **Checkout URL Format**
   - What does Dodo docs say about the hosted checkout URL?
   - What parameters does it accept?

2. **Session Creation**
   - Does Dodo require creating a session first via API?
   - Or can you redirect directly with parameters?

3. **Test Mode Specifics**
   - Is there a different URL for test vs live?
   - Any special parameters for test mode?

4. **Example Checkout Link**
   - Can you find an example checkout link in Dodo docs?
   - What does the format look like?

---

## Server Logs to Check

When you click "Subscribe Now", check the terminal running `npm run dev`:

You should see:
```
=== DODO CHECKOUT SESSION START ===
Received: { planId: 'pdt_...', userId: 'xxx', interval: 'month' }
Using Dodo key: pk_snd_00d98d...
Generated checkout URL: https://checkout.dodopayments.com/?public_key=...
=== DODO CHECKOUT SESSION END - SUCCESS ===
```

If you see any errors there, that will help us debug.

---

## Quick Testing

### What to check:
1. ✅ Does the checkout URL look correct to you?
2. ❌ Does Dodo show an error message?
3. ❌ What's the exact error message Dodo shows?

### How to debug browser:
1. Open DevTools (F12)
2. Go to Network tab
3. Click "Subscribe Now"
4. Look for the redirect request
5. Check the full URL being redirected to
6. See if Dodo's API returns any error

---

Please share:
1. What your Dodo docs say about checkout URL format
2. Any example checkout links from Dodo documentation
3. The exact error message from Dodo (if different from "link might be expired")
4. Screenshot of your Dodo Dashboard → Checkout/Integration settings

This will help us fix the integration! 🔧
