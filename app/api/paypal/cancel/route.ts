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
      paypal_subscription_id: subscription.paypal_subscription_id,
      status: subscription.status
    });

    if (!subscription.paypal_subscription_id) {
      console.log('ERROR: No PayPal subscription ID');
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const secretKey = process.env.PAYPAL_SECRET_KEY;

    if (!clientId || !secretKey) {
      console.error('ERROR: PayPal credentials not configured');
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    console.log('PayPal credentials found, requesting access token...');

    // Determine if we're in sandbox or production mode
    const isProduction = !clientId.includes('sandbox') && clientId.startsWith('A');
    const paypalApiBase = isProduction 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';
    
    console.log('PayPal mode:', isProduction ? 'PRODUCTION' : 'SANDBOX');
    console.log('PayPal API base:', paypalApiBase);

    const auth = Buffer.from(`${clientId}:${secretKey}`).toString('base64');
    const tokenResponse = await fetch(`${paypalApiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to get PayPal access token:', tokenResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to authenticate with payment provider' },
        { status: 500 }
      );
    }

    const { access_token } = await tokenResponse.json();
    console.log('Access token obtained successfully');

    // First, check if the subscription exists and get its current status
    console.log('Checking subscription status with PayPal...');
    const checkResponse = await fetch(
      `${paypalApiBase}/v1/billing/subscriptions/${subscription.paypal_subscription_id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
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
      
      // If subscription doesn't exist on PayPal, just update our database
      if (checkResponse.status === 404) {
        console.log('Subscription not found on PayPal (likely created in different mode), updating database only...');
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
          details: errorData.message || errorData.error_description || 'Subscription not found'
        },
        { status: 500 }
      );
    }

    const subscriptionDetails = await checkResponse.json();
    console.log('Subscription status on PayPal:', subscriptionDetails.status);

    // If already cancelled, just update database
    if (subscriptionDetails.status === 'CANCELLED' || subscriptionDetails.status === 'CANCELED') {
      console.log('Subscription already cancelled on PayPal, updating database...');
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

    // Cancel the subscription with PayPal
    console.log('Attempting to cancel PayPal subscription:', subscription.paypal_subscription_id);
    const cancelResponse = await fetch(
      `${paypalApiBase}/v1/billing/subscriptions/${subscription.paypal_subscription_id}/cancel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          reason: reason || 'Customer requested cancellation',
        }),
      }
    );

    // PayPal returns 204 No Content on successful cancellation
    if (!cancelResponse.ok && cancelResponse.status !== 204) {
      const errorText = await cancelResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      console.error('PayPal cancellation error:', cancelResponse.status, errorData);
      return NextResponse.json(
        { 
          error: 'Failed to cancel subscription with payment provider', 
          details: errorData.message || errorData.error_description || 'Unknown error'
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
        { error: 'Subscription cancelled with PayPal but failed to update database' },
        { status: 500 }
      );
    }

    console.log('✓ Subscription cancelled successfully:', subscription.paypal_subscription_id);

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
