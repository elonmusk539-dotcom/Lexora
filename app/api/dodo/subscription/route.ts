import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { planId, userId, interval } = await req.json();

    console.log('\n=== DODO CHECKOUT SESSION START ===');
    console.log('Received:', { planId, userId, interval });

    if (!planId || !userId || !interval) {
      console.error('Missing required fields:', { planId, userId, interval });
      return NextResponse.json(
        { error: 'Missing required fields: planId, userId, interval' },
        { status: 400 }
      );
    }

    // Validate interval
    if (!['month', 'year'].includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid interval. Must be "month" or "year"' },
        { status: 400 }
      );
    }

    // Get Dodo API key for server-side API calls (from environment)
    const dodoApiKey = process.env.DODO_API_KEY;

    if (!dodoApiKey) {
      console.error('Missing Dodo API key in environment');
      return NextResponse.json(
        { error: 'Server configuration error - Dodo API key missing. Generate one in Dodo Dashboard → Developer → API Keys' },
        { status: 500 }
      );
    }

    console.log('Using Dodo API key:', dodoApiKey.substring(0, 20) + '...');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log('App URL:', appUrl);

    // According to Dodo docs:
    // https://docs.dodopayments.com/api-reference/checkout-sessions/create
    // Must POST to /checkouts with:
    // - product_cart: array of { product_id, quantity }
    // - return_url: redirect URL after payment
    // - metadata: optional custom data

    const checkoutPayload = {
      product_cart: [
        {
          product_id: planId,
          quantity: 1,
        },
      ],
      return_url: `${appUrl}/premium/success`,
      metadata: {
        user_id: userId,
        interval: interval,
        created_at: new Date().toISOString(),
      },
    };

    console.log('Creating Dodo checkout session with payload:', JSON.stringify(checkoutPayload, null, 2));

    // Determine environment - use live mode for production, test for development
    const isProduction = process.env.NODE_ENV === 'production' && appUrl.startsWith('https');
    const dodoBaseUrl = isProduction ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
    console.log(`Using Dodo environment: ${isProduction ? 'LIVE' : 'TEST'} (${dodoBaseUrl})`);

    // Call Dodo API to create checkout session
    // Endpoint: POST /checkouts
    // For test mode, use: https://test.dodopayments.com
    // For live mode, use: https://live.dodopayments.com
    const dodoResponse = await fetch(`${dodoBaseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dodoApiKey}`,
      },
      body: JSON.stringify(checkoutPayload),
    });

    console.log('Dodo API response status:', dodoResponse.status);

    const responseBody = await dodoResponse.json();
    console.log('Dodo API response:', JSON.stringify(responseBody, null, 2));

    if (!dodoResponse.ok) {
      console.error('Dodo API error - NOT OK');
      return NextResponse.json(
        {
          error: 'Failed to create checkout session with Dodo',
          details: responseBody,
          status: dodoResponse.status,
        },
        { status: dodoResponse.status }
      );
    }

    // Dodo returns: { checkout_url, session_id }
    const checkoutUrl = responseBody.checkout_url;
    const sessionId = responseBody.session_id;

    if (!checkoutUrl) {
      console.error('No checkout URL in Dodo response:', responseBody);
      return NextResponse.json(
        {
          error: 'Invalid response from Dodo - missing checkout_url',
          details: responseBody,
        },
        { status: 500 }
      );
    }

    console.log('Checkout URL received:', checkoutUrl);
    console.log('Session ID:', sessionId);

    // Store session info in Supabase for webhook tracking
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const sessionRecord = {
      user_id: userId,
      dodo_plan_id: planId,
      interval: interval,
      dodo_session_id: sessionId,
      status: 'pending_payment',
      created_at: new Date().toISOString(),
    };

    const { error: dbError } = await supabase
      .from('subscriptions')
      .upsert(sessionRecord, { onConflict: 'user_id' });

    if (dbError) {
      console.warn('Could not update subscription status:', dbError);
    } else {
      console.log('Session stored in Supabase');
    }

    console.log('=== DODO CHECKOUT SESSION END - SUCCESS ===\n');

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutUrl,
      sessionId: sessionId,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : '');
    console.log('=== DODO CHECKOUT SESSION END - ERROR ===\n');
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
