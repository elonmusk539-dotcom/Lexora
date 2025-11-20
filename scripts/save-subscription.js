/**
 * Manual Subscription Fix Script
 * This script manually saves the PayPal subscription that was created
 * Usage: node scripts/save-subscription.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUBSCRIPTION_ID = 'I-027GGD654S32'; // Your PayPal subscription ID
const PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY || 'P-8VX60180U0802633NNEHDLXQ';

async function saveSubscription() {
  console.log('\n🔧 Manual Subscription Saver\n');
  console.log('='.repeat(60));

  // Get user ID from prompt
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Enter your User ID (from Supabase auth.users): ', async (userId) => {
    readline.close();

    if (!userId || userId.length < 10) {
      console.error('❌ Invalid user ID');
      process.exit(1);
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Determine if yearly
    const yearlyPlanIds = [
      'P-5WV83425FL4882210ND6PAQY',
      'P-3KS569328K403315NNEHDLXY',
      process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY
    ];
    const isYearly = yearlyPlanIds.includes(PLAN_ID);
    const interval = isYearly ? 'year' : 'month';

    // Calculate period end
    const currentPeriodEnd = new Date();
    if (isYearly) {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    const subscriptionData = {
      user_id: userId,
      paypal_subscription_id: SUBSCRIPTION_ID,
      paypal_plan_id: PLAN_ID,
      status: 'active',
      interval: interval,
      current_period_end: currentPeriodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('\nSaving subscription:', subscriptionData);

    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id'
      })
      .select();

    if (error) {
      console.error('\n❌ Error saving subscription:', error);
      process.exit(1);
    }

    console.log('\n✅ Subscription saved successfully!');
    console.log('Data:', data);
    console.log('\n' + '='.repeat(60));
    console.log('You can now check your premium features!\n');
    process.exit(0);
  });
}

saveSubscription();
