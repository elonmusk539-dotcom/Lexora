# Google Auth Debug Guide

## Current Setup Status ✓
- Supabase URL: `https://hbrjcmazcybmmmyzenrr.supabase.co`
- App URL: `https://lexora-nu.vercel.app/`
- OAuth Callback: `https://hbrjcmazcybmmmyzenrr.supabase.co/auth/v1/callback`

## Error: `auth_exchange_failed`

This means:
1. ✓ Google OAuth is working (you're getting redirected to Google)
2. ✓ Google is sending you back with a code
3. ✗ Supabase can't exchange the code for a session

## Most Common Causes:

### 1. PKCE Code Verifier Missing
**Problem:** The code verifier stored in localStorage during OAuth initiation isn't available during exchange.

**Solution:** Already implemented - we're using server-side exchange which doesn't need the verifier.

### 2. Invalid OAuth Configuration
**Check in Supabase Dashboard:**
- Go to: Authentication → Providers → Google
- Verify:
  - [ ] Google provider is ENABLED
  - [ ] Client ID is correct
  - [ ] Client Secret is correct
  - [ ] No extra spaces in credentials

### 3. Google OAuth Credentials Issue
**Check in Google Cloud Console:**
- Project: Your Google Cloud project
- Credentials: OAuth 2.0 Client ID
- Verify:
  - [ ] Type: Web application
  - [ ] Authorized redirect URI: `https://hbrjcmazcybmmmyzenrr.supabase.co/auth/v1/callback`
  - [ ] No trailing slashes
  - [ ] Exact match (case-sensitive)

### 4. Supabase Redirect URL Not Configured
**Check in Supabase Dashboard:**
- Go to: Authentication → URL Configuration
- Under "Redirect URLs", verify you have:
  - [ ] `https://lexora-nu.vercel.app/auth/callback`
  - [ ] `http://localhost:3000/auth/callback`

## Debug Steps:

1. **Check Browser Console** (when clicking Google button):
   ```
   [Login] OAuth redirect URL will be: http://localhost:3000/auth/callback?next=%2F
   [Login] Starting Google OAuth with redirect: ...
   ```

2. **Check Server Logs** (after Google redirects back):
   ```
   [Auth Callback] Request URL: ...
   [Auth Callback] Code present: true
   [Auth Callback] Processing code...
   [Auth Callback] Reading cookies, count: X
   [Auth Callback] Exchanging code for session...
   [Auth Callback] Token exchange error: { message: "...", ... }
   ```

3. **Look for the specific error message** in server logs - it will tell you exactly what's wrong.

## Quick Test:

1. Open browser DevTools (F12) → Console
2. Go to `/login`
3. Click "Continue with Google"
4. After redirect, check URL bar - does it show the error message?
   - Example: `login?error=Invalid+OAuth+credentials`
5. Check server console for detailed logs

## Next Steps:

**If you see "Invalid OAuth credentials":**
- Double-check Google Client ID and Secret in Supabase

**If you see "PKCE code verifier not found":**
- Already fixed in latest code

**If you see "Invalid redirect URI":**
- Verify redirect URLs in both Google Console and Supabase Dashboard

**If logs show cookies: 0:**
- This is the problem - PKCE verifier cookie not being sent
- Solution: Use implicit flow instead (less secure but works)
