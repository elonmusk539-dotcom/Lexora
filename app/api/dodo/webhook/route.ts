import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.type || body.event;

    console.log('Received Dodo webhook:', { event, data: body });

    // Verify webhook signature (if Dodo provides one)
    // TODO: Implement webhook signature verification for production

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle checkout.session.completed event
    if (event === 'checkout.session.completed' || event === 'checkout.completed') {
      const { data: sessionData } = body;

      if (!sessionData) {
        console.error('No session data in webhook');
        return NextResponse.json(
          { error: 'Invalid webhook data' },
          { status: 400 }
        );
      }

      console.log('Session data from Dodo:', JSON.stringify(sessionData, null, 2));

      // Extract user_id from metadata (where we stored it)
      const userId = sessionData.metadata?.user_id || sessionData.customer_id;
      const interval = sessionData.metadata?.interval || 'month';
      const subscriptionId = sessionData.id || sessionData.subscription_id;
      const planId = sessionData.product_id || sessionData.plan_id;

      console.log('Extracted data:', { userId, interval, subscriptionId, planId });

      if (!subscriptionId || !userId) {
        console.error('Missing required webhook data:', { subscriptionId, userId, planId });
        return NextResponse.json(
          { error: 'Missing required data - userId or subscriptionId' },
          { status: 400 }
        );
      }

      // Calculate current period end (1 month or 1 year from now)
      const currentPeriodEnd = new Date();
      if (interval === 'year') {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      } else {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      }

      const subscriptionData = {
        user_id: userId,
        dodo_subscription_id: subscriptionId,
        dodo_plan_id: planId,
        status: 'active',
        interval: interval,
        current_period_start: new Date().toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Saving subscription from webhook:', JSON.stringify(subscriptionData, null, 2));

      const { error, data } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving subscription:', error);
        return NextResponse.json(
          { error: 'Failed to save subscription', details: error.message },
          { status: 500 }
        );
      }

      console.log('Subscription saved successfully from webhook:', data);
      return NextResponse.json({ received: true, status: 'success' });
    }

    // Handle subscription.canceled event
    if (event === 'subscription.canceled' || event === 'customer.subscription.deleted') {
      const { data: subscriptionData } = body;

      if (!subscriptionData) {
        console.error('No subscription data in cancel webhook');
        return NextResponse.json(
          { error: 'Invalid webhook data' },
          { status: 400 }
        );
      }

      const {
        customer_id: userId,
        id: subscriptionId,
      } = subscriptionData;

      if (!userId || !subscriptionId) {
        console.error('Missing required data for cancellation:', { userId, subscriptionId });
        return NextResponse.json(
          { error: 'Missing required data' },
          { status: 400 }
        );
      }

      console.log('Cancelling subscription from webhook:', { userId, subscriptionId });

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating subscription:', error);
        return NextResponse.json(
          { error: 'Failed to update subscription', details: error.message },
          { status: 500 }
        );
      }

      console.log('Subscription cancelled successfully from webhook');
      return NextResponse.json({ received: true, status: 'cancelled' });
    }

    // Handle checkout.session.failed event
    if (event === 'checkout.session.failed' || event === 'checkout.failed') {
      const { data: sessionData } = body;

      if (!sessionData) {
        console.error('No session data in failed webhook');
        return NextResponse.json(
          { error: 'Invalid webhook data' },
          { status: 400 }
        );
      }

      const userId = sessionData.metadata?.user_id || sessionData.customer_id;
      console.log('Checkout failed for user:', userId);
      console.log('Failure reason:', sessionData.error);

      // Don't save subscription for failed payments, just log
      // The pending_payment status will remain until success
      return NextResponse.json({ received: true, status: 'failed' });
    }

    // For other events, just acknowledge receipt
    console.log('Ignoring webhook event:', event);
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
