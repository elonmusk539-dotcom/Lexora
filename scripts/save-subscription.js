/**
 * Manual Subscription Fix Script
 * Usage: node scripts/save-subscription.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

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

    // TODO: Update this for Dodo Payments or other providers if needed
    const subscriptionData = {
      user_id: userId,
      status: 'active',
      interval: 'month',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
