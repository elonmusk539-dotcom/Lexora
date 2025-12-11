import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    const dodoApiKey = process.env.DODO_API_KEY;
    if (!dodoApiKey) {
      console.error('Missing Dodo API Key');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Correctly determine Dodo Environment
    // Priority: Explicit Mode Variable -> Node Env -> Default Live
    const mode = process.env.NEXT_PUBLIC_DODO_MODE || (process.env.NODE_ENV === 'production' ? 'live' : 'test');
    const dodoBaseUrl = mode === 'test'
      ? 'https://test.dodopayments.com'
      : 'https://live.dodopayments.com';

    console.log(`Verifying session ${sessionId} in ${mode} mode at ${dodoBaseUrl}`);

    const dodoResponse = await fetch(`${dodoBaseUrl}/checkouts/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${dodoApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    let sessionData;
    const rawBody = await dodoResponse.text();

    try {
      sessionData = JSON.parse(rawBody);
    } catch (e) {
      console.error('Failed to parse Dodo response:', rawBody);
      return NextResponse.json({
        error: 'Invalid response from Dodo',
        details: rawBody.substring(0, 100),
        statusCode: dodoResponse.status
      }, { status: 502 });
    }

    if (!dodoResponse.ok) {
      console.error('Dodo API Error:', dodoResponse.status, sessionData);
      return NextResponse.json({
        error: 'Dodo verification failed',
        details: sessionData,
        statusCode: dodoResponse.status
      }, { status: dodoResponse.status });
    }

    // 2. Check Status
    const status = sessionData.status || sessionData.data?.status;

    // Accept 'completed' (standard) or 'active' (subs)
    if (status !== 'completed' && status !== 'active') {
      console.log(`Session status is ${status}, not completed.`);
      return NextResponse.json({
        verified: false,
        status: status,
        message: `Payment status is ${status}`
      });
    }

    // 3. Update Supabase
    const userId = sessionData.metadata?.user_id || sessionData.customer_id;
    const interval = sessionData.metadata?.interval || 'month';
    const planId = sessionData.product_id || sessionData.plan_id;
    const subscriptionId = sessionData.subscription_id || sessionData.id;

    if (!userId) {
      console.error('No User ID in session data:', sessionData);
      return NextResponse.json({ error: 'No user ID found in session' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Calculate details
    const currentPeriodEnd = new Date();
    if (interval === 'year') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    const { error: dbError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        dodo_subscription_id: subscriptionId,
        dodo_plan_id: planId,
        status: 'active',
        interval: interval,
        current_period_start: new Date().toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('DB Update Error:', dbError);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    console.log(`Successfully verified and updated subscription for user ${userId}`);
    return NextResponse.json({
      verified: true,
      message: 'Subscription activated'
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
