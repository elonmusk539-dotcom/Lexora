import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  console.log('=== CANCEL SUBSCRIPTION API CALLED ===');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { userId, reason } = await req.json();
    console.log('Request data:', { userId, reason });

    if (!userId) {
      console.log('ERROR: No user ID provided');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the user's subscription
    console.log('Fetching subscription for user:', userId);
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscription) {
      console.log('ERROR: Subscription fetch error:', fetchError);
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    console.log('Subscription found:', {
      id: subscription.id,
      dodo_subscription_id: subscription.dodo_subscription_id,
      status: subscription.status
    });

    if (!subscription.dodo_subscription_id) {
      console.log('ERROR: No Dodo subscription ID');
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Get Dodo API credentials
    const dodoApiKey = process.env.DODO_API_KEY;
    const dodoApiSecret = process.env.DODO_API_SECRET;

    if (!dodoApiKey || !dodoApiSecret) {
      console.error('ERROR: Dodo credentials not configured');
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    console.log('Dodo credentials found, preparing cancellation request...');

    // Dodo Payments API base URL
    const dodoApiBase = 'https://api.dodopayments.com';

    // Create authorization header (Basic Auth with API Key)
    const auth = Buffer.from(`${dodoApiKey}:${dodoApiSecret}`).toString('base64');

    // Check if the subscription exists and get its current status
    console.log('Checking subscription status with Dodo...');
    const checkResponse = await fetch(
      `${dodoApiBase}/v1/subscriptions/${subscription.dodo_subscription_id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
      }
    );

    if (!checkResponse.ok) {
      const errorText = await checkResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      console.error('Failed to check subscription status:', checkResponse.status, errorData);

      // If subscription doesn't exist on Dodo, just update our database
      if (checkResponse.status === 404) {
        console.log('Subscription not found on Dodo, updating database only...');
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: true,
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('ERROR: Database update failed:', updateError);
          return NextResponse.json(
            { error: 'Failed to update subscription status' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Subscription cancelled successfully.',
        });
      }

      return NextResponse.json(
        {
          error: 'Failed to verify subscription with payment provider',
          details: errorData.message || 'Subscription not found'
        },
        { status: 500 }
      );
    }

    const subscriptionDetails = await checkResponse.json();
    console.log('Subscription status on Dodo:', subscriptionDetails.status);

    // If already cancelled, just update database
    if (subscriptionDetails.status === 'cancelled' || subscriptionDetails.status === 'canceled') {
      console.log('Subscription already cancelled on Dodo, updating database...');
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          cancel_at_period_end: true,
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('ERROR: Database update failed:', updateError);
        return NextResponse.json(
          { error: 'Failed to update subscription status' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully.',
      });
    }

    // Cancel the subscription with Dodo
    console.log('Attempting to cancel Dodo subscription:', subscription.dodo_subscription_id);
    const cancelResponse = await fetch(
      `${dodoApiBase}/v1/subscriptions/${subscription.dodo_subscription_id}/cancel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({
          reason: reason || 'Customer requested cancellation',
        }),
      }
    );

    // Dodo returns 200 OK on successful cancellation
    if (!cancelResponse.ok) {
      const errorText = await cancelResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      console.error('Dodo cancellation error:', cancelResponse.status, errorData);
      return NextResponse.json(
        {
          error: 'Failed to cancel subscription with payment provider',
          details: errorData.message || 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Update subscription in database
    console.log('Updating subscription in database...');
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: true,
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('ERROR: Database update failed:', updateError);
      return NextResponse.json(
        { error: 'Subscription cancelled with Dodo but failed to update database' },
        { status: 500 }
      );
    }

    console.log('✓ Subscription cancelled successfully:', subscription.dodo_subscription_id);

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully. You will retain access until the end of your billing period.',
    });
  } catch (error) {
    console.error('ERROR: Exception in cancel subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
