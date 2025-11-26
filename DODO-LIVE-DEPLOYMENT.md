# Dodo Live Deployment Checklist

## Issues Fixed ✅

1. **Subscribe Button Not Working** - FIXED
   - Issue: Subscription endpoint was hardcoded to use test endpoint
   - Fix: Now dynamically detects environment and uses:
     - `https://test.dodopayments.com` for development
     - `https://live.dodopayments.com` for production
   - Code: `app/api/dodo/subscription/route.ts` now checks `NODE_ENV` and `NEXT_PUBLIC_APP_URL`

2. **Webhook Secret Updated** ✅
   - Old: `whsec_zwvKqN2LNXgrUT+u7ibI1YN+kgUEDa6o` (test)
   - New: `whsec_NS0qM8ANim9rtvnch2dHorF2yJHrY3nf` (live)
   - Updated in `.env.local`

---

## Critical Steps Before Deploy

### 1. Set Production Environment Variables

**If deploying to Vercel:**
```
Go to: Project Settings → Environment Variables
Add/Update:
- NEXT_PUBLIC_APP_URL = https://your-domain.com (your actual live domain)
- NEXT_PUBLIC_SITE_URL = https://your-domain.com
- NEXT_PUBLIC_VERCEL_URL = https://your-domain.com
- NODE_ENV = production
```

**If deploying to other platform:**
- Set the same variables in your deployment platform's environment settings
- Make sure `NODE_ENV=production`

### 2. Verify Dodo Plan IDs

```
IMPORTANT: These plan IDs must be from your LIVE Dodo account:
- NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY=pdt_agiTpgqJJP8KIwhblX6vv
- NEXT_PUBLIC_DODO_PLAN_ID_YEARLY=pdt_Ifnih36RsYH0eoYfYGViK

Run this in Dodo Dashboard:
1. Go to Products/Plans section
2. Verify the plan IDs match above
3. If different, update environment variables
```

### 3. Configure Webhook in Dodo Dashboard

```
Go to: Settings → Webhooks (or Developer → Webhooks)

Add endpoint:
- URL: https://your-domain.com/api/dodo/webhook
- Events to subscribe:
  ✓ checkout.session.completed
  ✓ checkout.completed
  ✓ subscription.canceled
  ✓ subscription.updated
- Webhook Secret: whsec_NS0qM8ANim9rtvnch2dHorF2yJHrY3nf
- Status: Active/Enabled
```

### 4. Test Live Payment Flow

After deployment:
```
1. Go to your live domain /premium page
2. Click "Subscribe Now"
3. You should be redirected to Dodo's LIVE checkout (not test)
4. Complete payment with REAL card or Dodo test card
5. Should be redirected to /premium/success
6. Check Supabase subscriptions table - should have new active subscription
```

---

## Environment Detection Logic

The subscription endpoint now auto-detects environment:

```typescript
const isProduction = process.env.NODE_ENV === 'production' 
  && process.env.NEXT_PUBLIC_APP_URL?.includes('https');
const dodoBaseUrl = isProduction 
  ? 'https://live.dodopayments.com' 
  : 'https://test.dodopayments.com';
```

**This means:**
- Local development (http://localhost:3000) → Uses TEST endpoint ✅
- Production with https domain → Uses LIVE endpoint ✅

---

## Quick Troubleshooting

### "Subscribe button not working" on live site
1. Check if `NODE_ENV=production` in deployment
2. Check if `NEXT_PUBLIC_APP_URL` is set to HTTPS domain
3. Check browser console for error messages
4. Check deployment logs for API errors

### "Stuck on Dodo checkout page" or "Checkout not loading"
1. Verify plan IDs are correct in Dodo dashboard
2. Verify plan IDs in environment variables match
3. Check if plan is active/published in Dodo

### "Payment completes but no success page"
1. Check if webhook is configured in Dodo dashboard
2. Verify webhook URL is correct (should be `https://your-domain.com/api/dodo/webhook`)
3. Check Supabase for subscription record
4. Check deployment logs for webhook errors

### "Webhook secret mismatch"
1. Verify `DODO_PAYMENTS_WEBHOOK_SECRET` matches Dodo dashboard
2. Webhook validation not implemented yet (see TODO in webhook handler)

---

## Files Modified

```
✅ app/api/dodo/subscription/route.ts
   - Added environment detection
   - Dynamic Dodo endpoint selection (test vs live)

✅ .env.local
   - Updated webhook secret to live secret

📄 .env.production (NEW)
   - Template for production environment variables
   - Contains instructions for live setup
```

---

## Deployment Command

```bash
# Build and test locally
npm run build
npm run dev

# Deploy to Vercel
git add .
git commit -m "Fix Dodo live mode integration - use live endpoint in production"
git push

# Or manual deployment with your platform
```

---

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Look at deployment logs for error details
3. Verify all environment variables are set correctly
4. Test with Dodo test cards first if available
