# 🔑 Get Your Dodo Secret Key

## Problem
Error: "Server configuration error - Dodo credentials missing"

**Root Cause:** Your `.env.local` is missing the `DODO_API_SECRET` (secret key)

---

## ✅ How to Get Your Secret Key

### Step 1: Open Dodo Dashboard
1. Go to [Dodo Payments Dashboard](https://dashboard.dodopayments.com)
2. Log in with your account

### Step 2: Navigate to API Keys
1. Click on **Settings** (gear icon)
2. Click on **API Keys** or **Developers**
3. You should see:
   - **Publishable Key** (starts with `pk_`) - Currently you have: `pk_snd_00d98d270105488582b957a0c911dc79`
   - **Secret Key** (starts with `sk_`) - **This is what we need**

### Step 3: Copy Secret Key
1. Find the **Secret Key** section
2. Click **Copy** or **Reveal**
3. Copy the full key (it looks like: `sk_snd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### Step 4: Update `.env.local`
1. Open `.env.local` in your editor
2. Find this line:
   ```
   DODO_API_SECRET=sk_snd_PLACEHOLDER_REPLACE_WITH_YOUR_SECRET_KEY
   ```
3. Replace `sk_snd_PLACEHOLDER_REPLACE_WITH_YOUR_SECRET_KEY` with your actual secret key
4. **Save the file**

### Step 5: Restart Dev Server
1. Stop your dev server (Ctrl+C)
2. Restart it:
   ```bash
   npm run dev
   ```

---

## 🔒 Security Important

**NEVER** commit your secret key to Git!

✅ Good:
- `.env.local` (not tracked by Git)
- Environment variables on server
- Secret management services (e.g., Vercel Secrets)

❌ Bad:
- Committing `.env.local` to Git
- Hardcoding in code
- Sharing in messages/chat

---

## Example

**Before:**
```env
DODO_API_SECRET=sk_snd_PLACEHOLDER_REPLACE_WITH_YOUR_SECRET_KEY
```

**After:**
```env
DODO_API_SECRET=sk_snd_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

## 🧪 Test Mode vs Live Mode

- **Test Mode Keys** start with: `pk_test_` / `sk_test_`
- **Live Mode Keys** start with: `pk_live_` / `sk_live_`
- Your current key: `pk_snd_` (sandbox/test)

Make sure both keys are the **same mode** (both test or both live):

```env
# Test Mode
NEXT_PUBLIC_DODO_API_KEY=pk_test_xxxxxxxxxxxx
DODO_API_KEY=pk_test_xxxxxxxxxxxx
DODO_API_SECRET=sk_test_xxxxxxxxxxxx

# Or Live Mode
NEXT_PUBLIC_DODO_API_KEY=pk_live_xxxxxxxxxxxx
DODO_API_KEY=pk_live_xxxxxxxxxxxx
DODO_API_SECRET=sk_live_xxxxxxxxxxxx
```

---

## ✅ After Update

Your `.env.local` should have:

```env
# Dodo Payments - Public Key (frontend-safe)
NEXT_PUBLIC_DODO_API_KEY=pk_snd_00d98d270105488582b957a0c911dc79

# Dodo Payments - Secret Key (server-side only)
DODO_API_KEY=pk_snd_00d98d270105488582b957a0c911dc79
DODO_API_SECRET=sk_snd_YOUR_ACTUAL_SECRET_KEY_HERE

# Dodo Webhooks
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_zwvKqN2LNXgrUT+u7ibI1YN+kgUEDa6o

# Dodo Plan IDs
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=pdt_agiTpgqJJP8KIwhblX6vv
NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=pdt_Ifnih36RsYH0eoYfYGViK
```

---

## 🚀 Next Steps

1. Get your secret key from Dodo dashboard
2. Update `.env.local` with the actual secret key
3. Restart dev server
4. Try clicking "Subscribe Now" again

---

## 🆘 Still Getting Error?

**If you still get "Dodo credentials missing" error:**

1. Check `.env.local` is saved
2. Verify secret key starts with `sk_`
3. Verify no extra spaces in the key
4. Dev server restarted? (Ctrl+C, then `npm run dev`)
5. Check browser console for exact error message

**If you get different error** (e.g., "Invalid API Key"):

- Secret key may be wrong
- Keys may be from different accounts
- Copy key directly from Dodo without extra spaces

---

**Once done, click "Subscribe Now" and you should be redirected to Dodo checkout! ✅**
