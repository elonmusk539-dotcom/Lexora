import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // Log environment variables (without exposing full keys)
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20),
      serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)
    });

    // Create Supabase client inside the function to avoid build-time errors
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

    const { subscriptionId, userId, planId } = await req.json();

    console.log('Received subscription data:', { subscriptionId, userId, planId });

    if (!subscriptionId || !userId || !planId) {
      console.error('Missing required fields:', { subscriptionId, userId, planId });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Determine billing interval from plan ID
    // Check for both sandbox and production plan IDs
    const yearlyPlanIds = [
      'P-5WV83425FL4882210ND6PAQY', // Production yearly
      'P-3KS569328K403315NNEHDLXY', // Sandbox yearly
      process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY // Current env yearly
    ];
    const isYearly = yearlyPlanIds.includes(planId);
    const interval = isYearly ? 'year' : 'month';

    // Calculate current period end (1 month or 1 year from now)
    const currentPeriodEnd = new Date();
    if (isYearly) {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    // Upsert subscription in database
    const subscriptionData = {
      user_id: userId,
      paypal_subscription_id: subscriptionId,
      paypal_plan_id: planId,
      status: 'active',
      interval: interval,
      current_period_end: currentPeriodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Attempting to save subscription:', subscriptionData);

    const { error } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving subscription:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Failed to save subscription', details: error.message },
        { status: 500 }
      );
    }

    console.log('Subscription saved successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
