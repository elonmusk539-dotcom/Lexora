# Stripe Premium Tier Setup Guide

This guide will walk you through setting up Stripe for premium subscriptions in your Lexora application.

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Supabase project with admin access
- Node.js environment variables configuration

## Step 1: Stripe Account Setup

### 1.1 Create a Stripe Account
1. Go to https://stripe.com and create an account
2. Complete the verification process
3. Navigate to the Dashboard

### 1.2 Get API Keys
1. Go to **Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_`)
3. Copy your **Secret key** (starts with `sk_`)
   - For development: Use **Test mode** keys
   - For production: Use **Live mode** keys

### 1.3 Create Products and Prices
1. Go to **Products** → **Add product**
2. Create a product called "Lexora Premium"
3. Set pricing:
   - Monthly: $9.99/month (or your preferred amount)
   - Yearly: $99.99/year (or your preferred amount)
4. Save the **Price ID** for each (starts with `price_`)

## Step 2: Database Schema

Add the following tables to your Supabase database:

```sql
-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT NOT NULL, -- active, canceled, past_due, trialing
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Row Level Security (RLS)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Payment history table (optional, for tracking)
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL, -- succeeded, failed, pending
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);

ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment history"
  ON payment_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Helper function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
    AND current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Step 3: Environment Variables

Add the following to your `.env.local` file:

```env
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Product IDs
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Install Stripe SDK

```bash
npm install stripe @stripe/stripe-js
```

## Step 5: Create Stripe API Routes

### 5.1 Create Checkout Session

Create `app/api/stripe/create-checkout-session/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId } = await request.json();

    // Get or create Stripe customer
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium`,
      metadata: { user_id: userId },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

### 5.2 Create Webhook Handler

Create `app/api/stripe/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  if (!userId) return;

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0].price.id,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      stripe_price_id: subscription.items.data[0].price.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.customer) return;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', invoice.customer as string)
    .single();

  if (subscription) {
    await supabase.from('payment_history').insert({
      user_id: subscription.user_id,
      stripe_payment_id: invoice.payment_intent as string,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: 'succeeded',
      description: invoice.description || 'Subscription payment',
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.customer) return;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', invoice.customer as string)
    .single();

  if (subscription) {
    await supabase.from('payment_history').insert({
      user_id: subscription.user_id,
      stripe_payment_id: invoice.payment_intent as string || 'failed',
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: 'failed',
      description: 'Payment failed',
    });
  }
}
```

## Step 6: Configure Stripe Webhooks

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/stripe/webhook`
   - For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli) for forwarding
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

## Step 7: Create Premium Page

Create `app/premium/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PremiumPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (priceId: string) => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: session.user.id,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Go Premium</h1>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Monthly Plan */}
        <div className="border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Monthly</h2>
          <p className="text-4xl font-bold mb-6">$9.99<span className="text-lg">/mo</span></p>
          <button
            onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY!)}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Subscribe Monthly
          </button>
        </div>

        {/* Yearly Plan */}
        <div className="border rounded-lg p-8 border-blue-500">
          <div className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full inline-block mb-2">
            Save 17%
          </div>
          <h2 className="text-2xl font-bold mb-4">Yearly</h2>
          <p className="text-4xl font-bold mb-6">$99.99<span className="text-lg">/yr</span></p>
          <button
            onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY!)}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Subscribe Yearly
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Step 8: Testing

### Local Testing with Stripe CLI

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date and any 3-digit CVC

## Step 9: Protect Premium Features

Create a utility to check subscription status:

```typescript
// lib/subscription.ts
import { supabase } from '@/lib/supabase/client';

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const { data } = await supabase.rpc('has_active_subscription', {
    p_user_id: userId,
  });
  return data === true;
}

// Usage in components:
const isPremium = await hasActiveSubscription(userId);
if (!isPremium) {
  router.push('/premium');
  return;
}
```

## Step 10: Production Checklist

Before going live:

- [ ] Switch to Live mode API keys in production
- [ ] Update webhook endpoint to production URL
- [ ] Test all payment flows in production mode
- [ ] Set up email notifications for failed payments
- [ ] Configure customer portal for self-service cancellation
- [ ] Add tax collection if required (Stripe Tax)
- [ ] Review and accept Stripe's terms of service
- [ ] Enable 3D Secure for additional security
- [ ] Set up billing alerts in Stripe Dashboard

## Additional Features to Consider

1. **Customer Portal**: Let users manage subscriptions
2. **Trial Period**: Offer 7-day free trial
3. **Promo Codes**: Create discount codes
4. **Usage-based Billing**: Charge based on features used
5. **Invoicing**: Automatically email invoices
6. **Dunning**: Retry failed payments automatically

## Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Supabase + Stripe Guide](https://supabase.com/docs/guides/integrations/stripe)
- [Stripe Testing](https://stripe.com/docs/testing)

## Troubleshooting

### Webhook not receiving events
- Check webhook endpoint URL is publicly accessible
- Verify webhook signing secret is correct
- Check Stripe Dashboard → Developers → Webhooks → Logs

### Checkout session not creating
- Verify API keys are correct
- Check customer ID exists in Stripe
- Review Next.js API route logs

### Subscription status not updating
- Ensure webhook handler is processing events
- Check Supabase RLS policies
- Verify database connection
