import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Initialize Supabase Admin client using the service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const REVENUECAT_SECRET_KEY = process.env.REVENUECAT_SECRET_KEY || '';

export async function POST(request: Request) {
  try {
    const { userId, platform, productId, planId } = await request.json();
    try {
      fs.appendFileSync('c:/Users/anshu/Lexora/sync-debug.log', `[${new Date().toISOString()}] Incoming Sync Request - userId: ${userId}, platform: ${platform}, productId: ${productId}, planId: ${planId}\n`);
    } catch (e) {
      console.error('Failed to write debug log:', e);
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!REVENUECAT_SECRET_KEY) {
      console.error('[Sync] REVENUECAT_SECRET_KEY is not configured');
      return NextResponse.json({ error: 'Billing service misconfigured' }, { status: 500 });
    }

    console.log(`[Sync] Verifying subscription for user ${userId} on platform ${platform} (client product ID: ${productId})`);

    // 1. Fetch the user's subscriber info directly from RevenueCat REST API
    const rcResponse = await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${REVENUECAT_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!rcResponse.ok) {
      const errorText = await rcResponse.text();
      console.error('[Sync] RevenueCat API error:', errorText);
      return NextResponse.json({ error: 'Failed to verify subscription with RevenueCat' }, { status: 500 });
    }

    const rcData = await rcResponse.json();
    const entitlements = rcData.subscriber?.entitlements || {};
    const proEntitlement = entitlements.pro;

    // 2. Check if the 'pro' entitlement is currently active
    let isPro = proEntitlement && new Date(proEntitlement.expires_date).getTime() > Date.now();
    let activeProductId = proEntitlement?.product_identifier;

    // Fallback to client-provided productId if the user is not currently active as Pro,
    // or if they are upgrading from Monthly to Yearly and the REST API hasn't synced the upgrade yet.
    // (This avoids overriding active subscriptions during deferred plan changes/downgrades)
    const isUpgrade = activeProductId === 'lexora_pro_monthly' && productId === 'lexora_pro_yearly';
    if (productId && (!isPro || isUpgrade)) {
      console.log(`[Sync] Overriding with client-purchased product: ${productId}`);
      isPro = true;
      activeProductId = productId;
    }

    let subscriptionData;

    if (isPro && activeProductId) {
      // Map product identifier or plan identifier to billing interval (supports both separate products and multi-plan single product setups)
      const planIdentifier = proEntitlement?.product_plan_identifier || planId;
      const isYearly = 
        activeProductId.includes('yearly') || 
        activeProductId.includes('year') ||
        (planIdentifier && (planIdentifier.includes('yearly') || planIdentifier.includes('year')));
      const isOverridden = productId && (!proEntitlement || proEntitlement.product_identifier !== productId);

      subscriptionData = {
        user_id: userId,
        status: 'active',
        provider: 'google_play',
        interval: isYearly ? 'year' : 'month',
        current_period_start: isOverridden ? new Date().toISOString() : proEntitlement.purchase_date,
        current_period_end: isOverridden
          ? new Date(Date.now() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
          : proEntitlement.expires_date,
        cancel_at_period_end: proEntitlement?.unsubscribe_detected_at ? true : false,
        canceled_at: proEntitlement?.unsubscribe_detected_at || null,
        updated_at: new Date().toISOString(),
      };
    } else {
      // Revert to free tier
      subscriptionData = {
        user_id: userId,
        status: 'none',
        provider: 'google_play',
        interval: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        canceled_at: null,
        updated_at: new Date().toISOString(),
      };
    }

    try {
      fs.appendFileSync('c:/Users/anshu/Lexora/sync-debug.log', `[${new Date().toISOString()}] Resolved subscriptionData: ${JSON.stringify(subscriptionData)}\n`);
    } catch (e) {
      console.error('Failed to write debug log:', e);
    }

    // 3. Upsert into Supabase subscriptions table
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id',
      })
      .select();

    if (error) {
      console.error('[Sync] Supabase upsert error:', error.message);
      return NextResponse.json({ error: 'Failed to sync subscription locally' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      isPro,
      subscription: data[0],
    });
  } catch (err) {
    console.error('[Sync] Server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
