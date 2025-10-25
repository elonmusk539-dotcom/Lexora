# 🚀 CRITICAL: Google OAuth Deployment Checklist

## ⚠️ The localhost:3000 Redirect Issue - SOLVED

### What Was Wrong
Your app was redirecting to `localhost:3000` after Google OAuth because:
1. No `NEXT_PUBLIC_SITE_URL` environment variable set in Vercel
2. Supabase dashboard had `localhost:3000` in redirect URLs
3. Code was falling back to `window.location.origin` which can be unreliable

### ✅ What Was Fixed
1. ✅ Added `NEXT_PUBLIC_SITE_URL` support in code
2. ✅ Updated OAuth handlers to use environment variable first
3. ✅ Improved Supabase client configuration with PKCE flow
4. ✅ Created proper auth callback route

---

## 🔧 REQUIRED: Vercel Environment Variables

Go to your Vercel project → Settings → Environment Variables and add:

### 1. **NEXT_PUBLIC_SITE_URL** (NEW - CRITICAL!)
```
Variable Name: NEXT_PUBLIC_SITE_URL
Value: https://your-actual-domain.vercel.app
Environment: Production, Preview, Development
```
**Example:** `https://lexora.vercel.app` (NO trailing slash!)

### 2. **NEXT_PUBLIC_SUPABASE_URL**
```
Value: https://hbrjcmazcybmmmyzenrr.supabase.co
Environment: All
```

### 3. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environment: All
```

### 4. **SUPABASE_SERVICE_ROLE_KEY**
```
Value: Your service role key from Supabase
Environment: All
```

### 5. **PayPal Variables** (if using premium features)
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- `NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY`
- `NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY`
- `NEXT_PUBLIC_APP_URL` (same as NEXT_PUBLIC_SITE_URL)

---

## 🔐 REQUIRED: Supabase Dashboard Configuration

### Step 1: Update Redirect URLs
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/url-configuration
2. Under **"Redirect URLs"**, add your deployed domain:
   ```
   https://your-actual-domain.vercel.app/auth/callback
   https://your-actual-domain.vercel.app/**
   ```
3. **IMPORTANT:** Remove or keep `http://localhost:3000/auth/callback` for local testing only

### Step 2: Set Site URL
1. In the same URL Configuration page
2. Set **"Site URL"** to:
   ```
   https://your-actual-domain.vercel.app
   ```

### Step 3: Verify Google OAuth Provider
1. Go to: Authentication → Providers
2. Make sure Google is **enabled**
3. Verify your Google OAuth credentials are correct
4. Check that **"Redirect URLs"** in Google Cloud Console include:
   ```
   https://hbrjcmazcybmmmyzenrr.supabase.co/auth/v1/callback
   ```

---

## 📋 Deployment Steps (IN ORDER)

### 1. **Set Vercel Environment Variables** (Do this FIRST!)
```bash
# In Vercel Dashboard:
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### 2. **Update Supabase Redirect URLs**
- Add your Vercel domain to allowed redirect URLs
- Update Site URL

### 3. **Deploy to Vercel**
```bash
git add .
git commit -m "Fix OAuth redirect - Use NEXT_PUBLIC_SITE_URL"
git push
```

### 4. **After Deploy: Get Your Actual Domain**
- Vercel will give you a domain like: `your-app-abc123.vercel.app`
- Go back to Vercel → Settings → Environment Variables
- Update `NEXT_PUBLIC_SITE_URL` with the EXACT domain (no http://, no trailing slash)
- **Redeploy** (Vercel → Deployments → Three dots → Redeploy)

### 5. **Update Supabase One More Time**
- With your actual Vercel domain
- Add exact callback URL: `https://your-actual-domain.vercel.app/auth/callback`

### 6. **Test**
- Go to your deployed app
- Click "Sign in with Google"
- Should redirect to Google
- Then redirect back to `https://your-app.vercel.app/auth/callback`
- Then redirect to `https://your-app.vercel.app/` (home page)
- ✅ You should be logged in!

---

## 🐛 Troubleshooting

### Still Redirecting to Localhost?
1. **Check Vercel env vars:** Make sure `NEXT_PUBLIC_SITE_URL` is set
2. **Redeploy after setting env vars:** Changes require redeployment
3. **Clear browser cache:** OAuth can cache redirects
4. **Check Supabase Site URL:** Must match your deployed domain

### "Redirect URL not allowed" Error?
1. **Check Supabase redirect URLs:** Must include your exact domain + `/auth/callback`
2. **Case sensitive:** `https://App.vercel.app` ≠ `https://app.vercel.app`
3. **No trailing slash:** Use `https://app.vercel.app` not `https://app.vercel.app/`

### "Internal Server Error"?
1. **Check Vercel logs:** Functions → View Function Logs
2. **Check auth callback route:** Should be deployed at `/auth/callback`
3. **Verify Supabase keys:** All three env vars must be set correctly

### Still Not Working?
Check the browser console for errors:
1. Open DevTools → Console
2. Try Google OAuth
3. Look for errors mentioning:
   - `redirect_uri_mismatch`
   - `Invalid redirect URL`
   - Network errors to `/auth/callback`

---

## ✅ Success Checklist

Before going live, verify:

- [ ] `NEXT_PUBLIC_SITE_URL` set in Vercel (matches deployed domain)
- [ ] All Supabase env vars set in Vercel
- [ ] Supabase "Site URL" matches deployed domain
- [ ] Supabase "Redirect URLs" includes `https://your-domain.vercel.app/auth/callback`
- [ ] Google OAuth provider enabled in Supabase
- [ ] Redeployed after setting environment variables
- [ ] Tested Google login on deployed app (NOT localhost)
- [ ] Successfully redirected to home page after Google auth
- [ ] User profile created in database

---

## 🎯 Quick Reference

**Your Supabase Project:** `hbrjcmazcybmmmyzenrr`
**Your Supabase URL:** `https://hbrjcmazcybmmmyzenrr.supabase.co`

**Auth Callback Route:** `/auth/callback` (already created in your app)

**Required Redirect Format:**
```
https://YOUR-DOMAIN.vercel.app/auth/callback
```

Replace `YOUR-DOMAIN` with your actual Vercel deployment URL!

---

## 💡 Pro Tip

For local development, keep `http://localhost:3000/auth/callback` in Supabase redirect URLs.
The code will automatically use the correct URL based on environment!
