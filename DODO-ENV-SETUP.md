# 🔧 Environment Variables Setup for Dodo Test Mode

**Complete guide to configuring environment variables for Dodo Payments testing**

---

## 📋 What You Need

After setting up your Dodo test account, you'll have these 4 values:

| Value | Example | Where to Get |
|-------|---------|--------------|
| **Test Public Key** | `pk_test_abc123...` | Dodo Dashboard → Settings → API Keys |
| **Test Secret Key** | `sk_test_xyz789...` | Dodo Dashboard → Settings → API Keys |
| **Test Monthly Plan ID** | `plan_test_month_...` | Dodo Dashboard → Plans (after creating) |
| **Test Yearly Plan ID** | `plan_test_year_...` | Dodo Dashboard → Plans (after creating) |

---

## 📂 Where to Add Variables

### Local Development (`.env.local`)

This file is **NOT** committed to Git. It's only on your machine.

**Location:** `c:\Users\anshu\Lexora\.env.local`

**If file doesn't exist, create it:**

```bash
# In your terminal/PowerShell
cd c:\Users\anshu\Lexora
New-Item -Name ".env.local" -ItemType File
```

Then open it with VS Code and add variables.

### Production (Environment Variables)

Set these in your hosting platform:
- **Vercel:** Settings → Environment Variables
- **Railway:** Variables tab
- **Other platforms:** Check their documentation

---

## ✅ Complete Test Mode Setup

Copy-paste this into your `.env.local` file:

```env
# ===================================
# DODO PAYMENTS - TEST MODE CONFIG
# ===================================

# Mode flag (test or live)
NEXT_PUBLIC_DODO_MODE=test

# Test Mode Public Key
# Get from: Dodo Dashboard → Settings → API Keys → Test Public Key
NEXT_PUBLIC_DODO_API_KEY=pk_test_YOUR_PUBLIC_KEY_HERE

# Test Mode Secret Key (KEEP PRIVATE!)
# Get from: Dodo Dashboard → Settings → API Keys → Test Secret Key
DODO_API_SECRET=sk_test_YOUR_SECRET_KEY_HERE

# Test Mode Plan IDs
# Get from: Dodo Dashboard → Plans (after you create them)
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=plan_test_YOUR_MONTHLY_PLAN_ID_HERE
NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=plan_test_YOUR_YEARLY_PLAN_ID_HERE

# ===================================
# EXISTING SUPABASE CONFIG
# ===================================
# Keep your existing Supabase variables:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxx...

# ===================================
# OPTIONAL: Other existing variables
# ===================================
# Add any other environment variables your app needs
```

---

## 🚀 Step-by-Step: Getting Your Values

### Step 1: Get Test Public Key

1. Go to **https://dashboard.dodopayments.com**
2. Make sure **Test Mode is ON** (toggle in top right)
3. Click **Settings** → **API Keys**
4. Find **"Public Test Key"** (starts with `pk_test_`)
5. **Copy it**
6. Paste into `.env.local`:
   ```env
   NEXT_PUBLIC_DODO_API_KEY=pk_test_paste_here
   ```

### Step 2: Get Test Secret Key

1. Same place: **Settings** → **API Keys**
2. Find **"Secret Test Key"** (starts with `sk_test_`)
3. ⚠️ **IMPORTANT:** Never share this or commit to Git
4. **Copy it**
5. Paste into `.env.local`:
   ```env
   DODO_API_SECRET=sk_test_paste_here
   ```

### Step 3: Create Monthly Plan (If Not Done)

1. In Dodo Dashboard (Test Mode ON)
2. Go to **Plans** → **Create New Plan**
3. Fill in:
   - **Name:** `Pro Monthly (Test)`
   - **Amount:** `299` cents (= $2.99)
   - **Currency:** `USD`
   - **Interval:** `Monthly` / Every `1` month
4. **Click "Create"**
5. **Copy the Plan ID** (looks like `plan_test_xxxxx`)
6. Paste into `.env.local`:
   ```env
   NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=plan_test_paste_here
   ```

### Step 4: Create Yearly Plan (If Not Done)

1. In Dodo Dashboard (Test Mode ON)
2. Go to **Plans** → **Create New Plan**
3. Fill in:
   - **Name:** `Pro Yearly (Test)`
   - **Amount:** `2899` cents (= $28.99)
   - **Currency:** `USD`
   - **Interval:** `Yearly` / Every `1` year
4. **Click "Create"**
5. **Copy the Plan ID**
6. Paste into `.env.local`:
   ```env
   NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=plan_test_paste_here
   ```

### Step 5: Verify Your `.env.local`

Your `.env.local` should now look like:

```env
NEXT_PUBLIC_DODO_MODE=test
NEXT_PUBLIC_DODO_API_KEY=pk_test_abc123xyz...
DODO_API_SECRET=sk_test_xyz789abc...
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=plan_test_monthly_...
NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=plan_test_yearly_...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxx...
```

✅ **If this looks right, continue!**

---

## 🔄 Restart Your Dev Server

After updating `.env.local`, you **MUST** restart the dev server:

### In VS Code Terminal:

```powershell
# Stop current server (Ctrl+C)
Ctrl+C

# Restart
npm run dev
```

### What You'll See:

```
> lexora@1.0.0 dev
> next dev

  ▲ Next.js 15.5.5
  - Local:        http://localhost:3000
  ...
```

**Now your app will use the test mode credentials!**

---

## ✅ Verify Configuration

### Check 1: Console Logs

1. Open your app: `http://localhost:3000`
2. Open Browser Console: `F12` or `Ctrl+Shift+J`
3. Look for no errors about missing Dodo keys ✓

### Check 2: Premium Page

1. Go to `/premium` page
2. Look for **yellow banner** at the top:
   ```
   🧪 Test Mode Active: Subscriptions will not charge real credit cards. Use test cards only.
   ```
3. If you see this banner ✅ Test mode is active!

### Check 3: Verify in Code

```typescript
// In lib/dodo/config.ts
export const DODO_CONFIG = {
  mode: 'test',  // ✅ Should be 'test'
  isTestMode: true,  // ✅ Should be true
  // ...
};
```

---

## 🔐 Security Best Practices

### ✅ DO

- [x] Keep `.env.local` in `.gitignore` (it already is)
- [x] Use strong, unique credentials
- [x] Rotate credentials periodically
- [x] Use test credentials for development only
- [x] Use live credentials for production only
- [x] Never commit credentials to Git

### ❌ DON'T

- [ ] Don't share your secret keys
- [ ] Don't commit `.env.local` to Git
- [ ] Don't paste credentials in chat/email
- [ ] Don't mix test and live credentials
- [ ] Don't use real credit cards for testing

---

## 🐛 Troubleshooting

### Problem: "API Authentication Failed"

**Cause:** Wrong credentials or not restarted dev server

**Solution:**
```powershell
# 1. Stop dev server
Ctrl+C

# 2. Verify .env.local has correct values
# (Check file exists and contains your credentials)

# 3. Restart dev server
npm run dev

# 4. Check browser console for errors
```

### Problem: "Invalid Plan ID"

**Cause:** Plan ID doesn't match the test mode you're using

**Solution:**
```env
# Must start with plan_test_ for test mode
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=plan_test_xxxxx  ✓
NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=plan_live_xxxxx  ✗ (wrong mode)
```

### Problem: Test Mode Banner Not Showing

**Cause:** Environment variable not set or incorrect value

**Solution:**
```env
# Must be exactly:
NEXT_PUBLIC_DODO_MODE=test  ✓
NEXT_PUBLIC_DODO_MODE=TEST  ✗ (wrong case)
NEXT_PUBLIC_DODO_MODE=   # (empty)
```

### Problem: `.env.local` File Not Found

**Create it:**

```powershell
# Navigate to project
cd c:\Users\anshu\Lexora

# Create .env.local file
New-Item -Name ".env.local" -ItemType File

# Open in VS Code
code .env.local
```

---

## 📝 Complete Variable Reference

### Required Variables

| Variable | Value | Required | Sensitive |
|----------|-------|----------|-----------|
| `NEXT_PUBLIC_DODO_MODE` | `test` | ✅ Yes | ❌ No |
| `NEXT_PUBLIC_DODO_API_KEY` | `pk_test_...` | ✅ Yes | ❌ No* |
| `DODO_API_SECRET` | `sk_test_...` | ✅ Yes | ✅ Yes |
| `NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY` | `plan_test_...` | ✅ Yes | ❌ No |
| `NEXT_PUBLIC_DODO_PLAN_ID_YEARLY` | `plan_test_...` | ✅ Yes | ❌ No |

*Public key is safe to expose (starts with `pk_`), but don't share the actual value

### Existing Required Variables

Keep your existing Supabase configuration:

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project Settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project Settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings |

---

## 🚀 Next Steps

Once variables are set up:

1. ✅ Dev server restarted
2. ✅ Test mode banner visible
3. ✅ Read `DODO-TEST-MODE-GUIDE.md` for testing procedures
4. ✅ Use test credit cards for transactions
5. ✅ Verify everything works before going live

---

## 📞 Quick Reference

**Test Mode Public Key:** Starts with `pk_test_`  
**Test Mode Secret Key:** Starts with `sk_test_`  
**Test Plan ID:** Starts with `plan_test_`  
**Dodo Dashboard:** https://dashboard.dodopayments.com  
**Verify .env.local exists:** `c:\Users\anshu\Lexora\.env.local`  

---

## ✨ You're Ready!

Your environment variables are configured. Next:

1. Read `DODO-TEST-MODE-GUIDE.md` for testing
2. Use test credit cards from the guide
3. Test subscription creation and cancellation
4. Verify Supabase records are updated
5. When satisfied, prepare for live credentials

**Questions?** Check `DODO-PAYMENTS-SETUP.md` or `DODO-TEST-MODE-GUIDE.md`

---

**Happy Testing! 🎉**
