# Subscriptions Table - Quick Reference

## Table: `subscriptions`

### Purpose
Manages user subscription data for Lexora Pro with PayPal payment processing.

---

## Column Definitions

| Column Name | Type | Nullable | Default | Description |
|------------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | No | - | Foreign key to `auth.users(id)`, UNIQUE |
| `paypal_subscription_id` | TEXT | Yes | NULL | PayPal subscription ID (e.g., "I-BW452GLLEP1G") |
| `paypal_plan_id` | TEXT | Yes | NULL | PayPal plan ID (monthly or yearly) |
| `status` | TEXT | No | `'none'` | Subscription status: 'active', 'canceled', 'past_due', 'trialing', 'none' |
| `interval` | TEXT | Yes | NULL | Billing interval: 'month' or 'year' |
| `current_period_start` | TIMESTAMPTZ | Yes | NULL | Start of current billing period |
| `current_period_end` | TIMESTAMPTZ | Yes | NULL | End of current billing period |
| `cancel_at_period_end` | BOOLEAN | Yes | `false` | Whether subscription cancels at period end |
| `canceled_at` | TIMESTAMPTZ | Yes | NULL | When subscription was canceled |
| `created_at` | TIMESTAMPTZ | Yes | `NOW()` | When record was created |
| `updated_at` | TIMESTAMPTZ | Yes | `NOW()` | When record was last updated |

---

## Indexes

1. **idx_subscriptions_user_id** - Fast lookups by user
2. **idx_subscriptions_paypal_subscription_id** - Webhook processing
3. **idx_subscriptions_status** - Filtering by status
4. **idx_subscriptions_user_status** - Combined user + status queries

---

## PayPal Plan IDs

- **Monthly**: `P-46L67236992761240ND6OTJI` → $2.99/month
- **Yearly**: `P-5WV83425FL4882210ND6PAQY` → $28.99/year ($2.41/month)

---

## Typical Record Examples

### Active Monthly Subscription
```sql
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  user_id: "123e4567-e89b-12d3-a456-426614174000",
  paypal_subscription_id: "I-BW452GLLEP1G",
  paypal_plan_id: "P-46L67236992761240ND6OTJI",
  status: "active",
  interval: "month",
  current_period_start: "2025-10-01T00:00:00Z",
  current_period_end: "2025-11-01T00:00:00Z",
  cancel_at_period_end: false,
  canceled_at: null,
  created_at: "2025-10-01T00:00:00Z",
  updated_at: "2025-10-01T00:00:00Z"
}
```

### Canceled (Will End Soon)
```sql
{
  ...
  status: "active",
  cancel_at_period_end: true,
  canceled_at: "2025-10-15T10:30:00Z",
  current_period_end: "2025-11-01T00:00:00Z"
}
```

### Free User (No Subscription)
```sql
{
  id: "...",
  user_id: "...",
  paypal_subscription_id: null,
  paypal_plan_id: null,
  status: "none",
  interval: null,
  ...
}
```

---

## Subscription Lifecycle

### 1. New Subscription
```
User clicks PayPal button → PayPal approval → onApprove callback → 
API saves to DB with status='active' → User gains Pro access
```

### 2. Active Subscription
```
status = 'active'
current_period_end > NOW()
cancel_at_period_end = false
```

### 3. Canceled (But Still Active)
```
status = 'active'
cancel_at_period_end = true
current_period_end > NOW()  // Still has access until period ends
```

### 4. Expired
```
status = 'canceled' OR 'none'
current_period_end < NOW()
// User loses Pro access
```

---

## Common Queries

### Check if User is Pro
```sql
SELECT 
  CASE 
    WHEN status IN ('active', 'trialing') 
    AND (current_period_end IS NULL OR current_period_end > NOW())
    THEN true 
    ELSE false 
  END as is_pro
FROM subscriptions
WHERE user_id = 'USER_UUID';
```

### Get All Active Subscriptions
```sql
SELECT * FROM subscriptions 
WHERE status = 'active' 
ORDER BY created_at DESC;
```

### Find Expiring Soon (7 days)
```sql
SELECT * FROM subscriptions 
WHERE status = 'active' 
AND current_period_end BETWEEN NOW() AND NOW() + INTERVAL '7 days';
```

### Count by Status
```sql
SELECT status, COUNT(*) 
FROM subscriptions 
GROUP BY status;
```

---

## Security (RLS Policies)

- ✅ Users can **view** their own subscription
- ✅ Only **service role** can insert/update/delete
- ✅ API routes use `SUPABASE_SERVICE_ROLE_KEY`

---

## Integration with Code

### Frontend (React Hook)
```typescript
// lib/subscription/useSubscription.ts
const { subscription, isPro, loading } = useSubscription();

// subscription.tier: 'free' | 'pro'
// subscription.status: 'active' | 'canceled' | 'past_due' | 'none'
```

### API Route (PayPal Webhook)
```typescript
// app/api/paypal/subscription/route.ts
await supabase.from('subscriptions').upsert({
  user_id: userId,
  paypal_subscription_id: subscriptionId,
  paypal_plan_id: planId,
  status: 'active',
  interval: 'month' | 'year',
  current_period_end: calculatedDate
});
```

---

## Migration from Stripe

If you previously had Stripe columns:
- `stripe_customer_id` → Can be kept or removed
- `stripe_subscription_id` → Can be kept or removed  
- `stripe_price_id` → Can be kept or removed

New records use only `paypal_*` columns.

---

## Deployment Checklist

### Supabase Setup
- [ ] Run `database/subscriptions_schema.sql` in Supabase SQL Editor
- [ ] Verify table created with correct columns
- [ ] Check RLS policies are enabled
- [ ] Verify indexes created

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Server-side only!
- [ ] `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- [ ] `NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY`
- [ ] `NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY`

### Testing
- [ ] Create test subscription via PayPal sandbox
- [ ] Verify record appears in subscriptions table
- [ ] Check user gains Pro access
- [ ] Test subscription cancellation
- [ ] Verify access removed after period ends

---

## Support & Troubleshooting

### User Shows as Free Despite Payment
1. Check subscriptions table for user_id
2. Verify status = 'active'
3. Check current_period_end > NOW()
4. Review API logs for webhook errors

### PayPal Subscription Not Saving
1. Check API route logs
2. Verify SUPABASE_SERVICE_ROLE_KEY is set
3. Check RLS policies allow service role inserts
4. Verify PayPal subscription ID format

### Need to Manually Grant Pro Access
```sql
INSERT INTO subscriptions (user_id, status, current_period_end)
VALUES ('USER_UUID', 'active', NOW() + INTERVAL '1 year')
ON CONFLICT (user_id) 
DO UPDATE SET status = 'active', current_period_end = NOW() + INTERVAL '1 year';
```
