// Subscription limits and configuration
export const SUBSCRIPTION_CONFIG = {
  FREE: {
    tier: 'free',
    allowedLists: ['family', 'numbers', 'body-parts', 'food-drinks', 'time'], // List IDs or names
    maxCustomLists: 2,
    maxCustomWords: 10,
  },
  PRO: {
    tier: 'pro',
    allowedLists: 'all', // All lists accessible
    maxCustomLists: Infinity,
    maxCustomWords: Infinity,
    pricing: {
      monthly: {
        amount: 299, // $2.99 in cents
        interval: 'month',
        planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY || '',
      },
      yearly: {
        amount: 2899, // $28.99 in cents
        interval: 'year',
        planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY || '',
      },
    },
  },
} as const;

// List names for free tier
export const FREE_TIER_LISTS = [
  'Family',
  'Numbers',
  'Body Parts',
  'Food & Drinks',
  'Time'
];

export type SubscriptionTier = 'free' | 'pro';

export interface UserSubscription {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'none';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

// Helper to check if user can access a list
export function canAccessList(userTier: SubscriptionTier, listName: string): boolean {
  if (userTier === 'pro') return true;
  // Case-insensitive comparison to handle variations
  const normalizedListName = listName.trim();
  const canAccess = FREE_TIER_LISTS.some(freeName => 
    freeName.toLowerCase() === normalizedListName.toLowerCase()
  );
  
  console.log('[canAccessList]', {
    userTier,
    listName,
    normalizedListName,
    canAccess,
    freeTierLists: FREE_TIER_LISTS,
  });
  
  return canAccess;
}

// Helper to check if user can create more custom lists
export function canCreateCustomList(userTier: SubscriptionTier, currentCount: number): boolean {
  if (userTier === 'pro') return true;
  return currentCount < SUBSCRIPTION_CONFIG.FREE.maxCustomLists;
}

// Helper to check if user can add more custom words
export function canAddCustomWord(userTier: SubscriptionTier, currentCount: number): boolean {
  if (userTier === 'pro') return true;
  return currentCount < SUBSCRIPTION_CONFIG.FREE.maxCustomWords;
}

// Get remaining slots
export function getRemainingSlots(userTier: SubscriptionTier, currentCount: number, type: 'lists' | 'words'): number | 'unlimited' {
  if (userTier === 'pro') return 'unlimited';
  const limit = type === 'lists' ? SUBSCRIPTION_CONFIG.FREE.maxCustomLists : SUBSCRIPTION_CONFIG.FREE.maxCustomWords;
  return Math.max(0, limit - currentCount);
}
