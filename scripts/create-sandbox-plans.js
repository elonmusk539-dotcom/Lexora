/**
 * Create PayPal Sandbox Subscription Plans
 * 
 * This script creates Monthly and Yearly subscription plans in PayPal Sandbox
 * Usage: node scripts/create-sandbox-plans.js
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const SECRET_KEY = process.env.PAYPAL_SECRET_KEY;
const SANDBOX_API = 'api-m.sandbox.paypal.com';

console.log('\n🔧 PayPal Sandbox Plan Creator\n');
console.log('='.repeat(60));

if (!CLIENT_ID || !SECRET_KEY) {
  console.error('❌ Error: PayPal credentials not found in .env.local');
  console.error('   Make sure NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_SECRET_KEY are set');
  process.exit(1);
}

// Function to make PayPal API requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject({ statusCode: res.statusCode, body: response });
          }
        } catch (e) {
          reject({ statusCode: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Step 1: Get Access Token
async function getAccessToken() {
  console.log('\n📝 Step 1: Getting Access Token...');
  
  const auth = Buffer.from(`${CLIENT_ID}:${SECRET_KEY}`).toString('base64');
  const options = {
    hostname: SANDBOX_API,
    path: '/v1/oauth2/token',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  try {
    const data = 'grant_type=client_credentials';
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });

    console.log('   ✅ Access token obtained');
    return response.access_token;
  } catch (error) {
    console.error('   ❌ Failed to get access token:', error);
    throw error;
  }
}

// Step 2: Create Product
async function createProduct(accessToken) {
  console.log('\n📦 Step 2: Creating Product...');
  
  const options = {
    hostname: SANDBOX_API,
    path: '/v1/catalogs/products',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  };

  const productData = {
    name: 'Lexora Pro Subscription',
    description: 'Premium subscription for Lexora - unlock all vocabulary lists and unlimited custom content',
    type: 'SERVICE',
    category: 'SOFTWARE',
  };

  try {
    const response = await makeRequest(options, productData);
    console.log('   ✅ Product created:', response.id);
    return response.id;
  } catch (error) {
    console.error('   ❌ Failed to create product:', error.body || error);
    throw error;
  }
}

// Step 3: Create Monthly Plan
async function createMonthlyPlan(accessToken, productId) {
  console.log('\n💳 Step 3: Creating Monthly Plan ($2.99/month)...');
  
  const options = {
    hostname: SANDBOX_API,
    path: '/v1/billing/plans',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Prefer': 'return=representation',
    },
  };

  const planData = {
    product_id: productId,
    name: 'Lexora Pro - Monthly',
    description: 'Monthly subscription to Lexora Pro with unlimited access',
    status: 'ACTIVE',
    billing_cycles: [
      {
        frequency: {
          interval_unit: 'MONTH',
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: {
            value: '2.99',
            currency_code: 'USD',
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: {
        value: '0',
        currency_code: 'USD',
      },
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
  };

  try {
    const response = await makeRequest(options, planData);
    console.log('   ✅ Monthly plan created!');
    console.log('   📋 Plan ID:', response.id);
    return response.id;
  } catch (error) {
    console.error('   ❌ Failed to create monthly plan:', error.body || error);
    throw error;
  }
}

// Step 4: Create Yearly Plan
async function createYearlyPlan(accessToken, productId) {
  console.log('\n💎 Step 4: Creating Yearly Plan ($28.99/year)...');
  
  const options = {
    hostname: SANDBOX_API,
    path: '/v1/billing/plans',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Prefer': 'return=representation',
    },
  };

  const planData = {
    product_id: productId,
    name: 'Lexora Pro - Yearly',
    description: 'Yearly subscription to Lexora Pro with unlimited access (Save 17%)',
    status: 'ACTIVE',
    billing_cycles: [
      {
        frequency: {
          interval_unit: 'YEAR',
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: {
            value: '28.99',
            currency_code: 'USD',
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: {
        value: '0',
        currency_code: 'USD',
      },
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
  };

  try {
    const response = await makeRequest(options, planData);
    console.log('   ✅ Yearly plan created!');
    console.log('   📋 Plan ID:', response.id);
    return response.id;
  } catch (error) {
    console.error('   ❌ Failed to create yearly plan:', error.body || error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    const accessToken = await getAccessToken();
    const productId = await createProduct(accessToken);
    const monthlyPlanId = await createMonthlyPlan(accessToken, productId);
    const yearlyPlanId = await createYearlyPlan(accessToken, productId);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! Subscription plans created\n');
    console.log('📋 Copy these to your .env.local file:\n');
    console.log('NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY=' + monthlyPlanId);
    console.log('NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY=' + yearlyPlanId);
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Next steps:');
    console.log('   1. Update .env.local with the plan IDs above');
    console.log('   2. Restart your dev server (npm run dev)');
    console.log('   3. Test the subscription flow at /premium');
    console.log('   4. Use test cards or sandbox PayPal account\n');
    
  } catch (error) {
    console.error('\n❌ Error creating plans:', error);
    console.error('\nTroubleshooting:');
    console.error('   - Verify your sandbox credentials are correct');
    console.error('   - Check if you have API access enabled');
    console.error('   - Visit: https://developer.paypal.com/dashboard/\n');
    process.exit(1);
  }
}

main();
