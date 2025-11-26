// Detect current mode (test or live)
const MODE = process.env.NEXT_PUBLIC_DODO_MODE || 'live';
const IS_TEST_MODE = MODE === 'test';

// Dodo Payments Configuration
export const DODO_CONFIG = {
  mode: MODE,
  isTestMode: IS_TEST_MODE,
  apiBase: 'https://api.dodopayments.com',
  apiVersion: 'v1',
  
  // Plan IDs - these will be set via environment variables
  plans: {
    monthly: process.env.NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY || '',
    yearly: process.env.NEXT_PUBLIC_DODO_PLAN_ID_YEARLY || '',
  },

  // Public API Key for frontend
  publicKey: process.env.NEXT_PUBLIC_DODO_API_KEY || '',

  // Pricing (in cents)
  pricing: {
    monthly: 299, // $2.99
    yearly: 2899, // $28.99
  },
};

// Helper to get Dodo API headers
export function getDodoHeaders() {
  const apiKey = process.env.DODO_API_KEY;
  const apiSecret = process.env.DODO_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('Dodo API credentials not configured');
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth}`,
  };
}

// Helper to get current Dodo mode
export function getDodoMode() {
  return DODO_CONFIG.mode;
}

// Helper to check if in test mode
export function isTestMode() {
  return DODO_CONFIG.isTestMode;
}

// Helper to get mode badge text
export function getModeBadge() {
  if (isTestMode()) {
    return '🧪 TEST MODE - No real charges';
  }
  return '🔒 LIVE MODE - Real charges apply';
}

// Helper to validate Dodo credentials
export function validateDodoCredentials() {
  const apiKey = process.env.DODO_API_KEY;
  const apiSecret = process.env.DODO_API_SECRET;
  const publicKey = process.env.NEXT_PUBLIC_DODO_API_KEY;
  const monthlyPlan = process.env.NEXT_PUBLIC_DODO_PLAN_ID_MONTHLY;
  const yearlyPlan = process.env.NEXT_PUBLIC_DODO_PLAN_ID_YEARLY;
  const mode = process.env.NEXT_PUBLIC_DODO_MODE;

  const validation = {
    hasApiKey: !!apiKey,
    hasApiSecret: !!apiSecret,
    hasPublicKey: !!publicKey,
    hasMonthlyPlan: !!monthlyPlan,
    hasYearlyPlan: !!yearlyPlan,
    hasMode: !!mode,
    isConfigured: !!(apiKey && apiSecret && publicKey && monthlyPlan && yearlyPlan),
    currentMode: mode || 'not-set',
    isTestMode: mode === 'test',
  };

  return validation;
}
