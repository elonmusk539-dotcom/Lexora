/**
 * PayPal Configuration Test Script
 * 
 * Run this to verify your PayPal environment variables and configuration
 * Usage: node scripts/test-paypal-config.js
 */

require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 PayPal Configuration Check\n');
console.log('='.repeat(50));

// Check Client ID
const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
if (clientId) {
  console.log('✅ PayPal Client ID: Found');
  console.log(`   ${clientId.substring(0, 20)}...${clientId.substring(clientId.length - 10)}`);
  
  // Check if it's sandbox or production
  if (clientId.includes('sandbox') || clientId.startsWith('AQ')) {
    console.log('   Mode: Sandbox (Testing)');
  } else {
    console.log('   Mode: Production (Live)');
  }
} else {
  console.log('❌ PayPal Client ID: Missing');
  console.log('   Add NEXT_PUBLIC_PAYPAL_CLIENT_ID to .env.local');
}

console.log('');

// Check Monthly Plan ID
const monthlyPlan = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY;
if (monthlyPlan) {
  console.log('✅ Monthly Plan ID: Found');
  console.log(`   ${monthlyPlan}`);
} else {
  console.log('❌ Monthly Plan ID: Missing');
  console.log('   Add NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY to .env.local');
}

console.log('');

// Check Yearly Plan ID
const yearlyPlan = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY;
if (yearlyPlan) {
  console.log('✅ Yearly Plan ID: Found');
  console.log(`   ${yearlyPlan}`);
} else {
  console.log('❌ Yearly Plan ID: Missing');
  console.log('   Add NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY to .env.local');
}

console.log('');
console.log('='.repeat(50));

// Check for common issues
console.log('\n📋 Common Issues Checklist:\n');
console.log('□ PayPal Business account is verified');
console.log('□ Card payments are enabled in PayPal settings');
console.log('□ Subscription plans are active in PayPal');
console.log('□ "PayPal Account Optional" is enabled (allows guest checkout)');
console.log('□ Bank account is linked and verified');
console.log('□ Business information is complete');

console.log('\n💡 If you see "Things don\'t appear to be working":');
console.log('   1. Log into PayPal Business account');
console.log('   2. Go to Settings > Payment Preferences');
console.log('   3. Enable "PayPal Account Optional"');
console.log('   4. Enable card payment processing');
console.log('   5. Verify your business account');

console.log('\n📚 Full guide: See PAYPAL-CARD-PAYMENT-FIX.md\n');
