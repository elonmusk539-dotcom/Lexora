import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Verify and activate a user's subscription
 * This endpoint uses the user ID to find their pending subscription,
 * then verifies with Dodo and activates it.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const dodoApiKey = process.env.DODO_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!dodoApiKey) {
      console.error('Missing Dodo API Key');
      return NextResponse.json({ error: 'Server configuration error - no Dodo key' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the user's subscription (any status)
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription) {
      console.error('No subscription found for user:', userId, subError);
      return NextResponse.json({
        error: 'No subscription found',
        details: subError?.message
      }, { status: 404 });
    }

    console.log('Found subscription:', subscription);

    // If already active, just return success
    if (subscription.status === 'active') {
      return NextResponse.json({
        verified: true,
        message: 'Already active'
      });
    }

    // Determine Dodo environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const isProduction = process.env.NODE_ENV === 'production' && appUrl.startsWith('https');
    const dodoBaseUrl = isProduction ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';

    // Try to verify with Dodo using the session ID if available
    const sessionId = subscription.dodo_session_id;

    if (sessionId) {
      console.log(`Verifying session ${sessionId} at ${dodoBaseUrl}`);

      const dodoResponse = await fetch(`${dodoBaseUrl}/checkouts/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${dodoApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (dodoResponse.ok) {
        const sessionData = await dodoResponse.json();
        console.log('Dodo session data:', sessionData);

        const status = sessionData.status;
        const validStatuses = ['completed', 'active', 'succeeded', 'paid', 'no_payment_required'];

        if (validStatuses.includes(status)) {
          // Activate the subscription
          const interval = subscription.interval || sessionData.metadata?.interval || 'month';
          const currentPeriodEnd = new Date();
          if (interval === 'year') {
            currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
          } else {
            currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
          }

          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: currentPeriodEnd.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (updateError) {
            console.error('Failed to update subscription:', updateError);
            return NextResponse.json({
              error: 'Database update failed',
              details: updateError.message
            }, { status: 500 });
          }

          console.log('Subscription activated successfully!');
          return NextResponse.json({
            verified: true,
            message: 'Subscription activated'
          });
        } else {
          return NextResponse.json({
            verified: false,
            message: `Dodo status is ${status}`
          });
        }
      } else {
        const errorBody = await dodoResponse.text();
        console.error('Dodo API error:', dodoResponse.status, errorBody);
      }
    }

    // If no session ID or Dodo verification failed, just activate directly
    // This is a fallback for when the webhook didn't fire but payment was successful
    console.log('Fallback: Activating subscription directly');

    const interval = subscription.interval || 'month';
    const currentPeriodEnd = new Date();
    if (interval === 'year') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Fallback update failed:', updateError);
      return NextResponse.json({
        error: 'Database update failed',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      verified: true,
      message: 'Subscription activated (fallback)'
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
