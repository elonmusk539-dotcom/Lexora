import { Purchases, LOG_LEVEL, PRORATION_MODE } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// RevenueCat API Keys (get these from RevenueCat dashboard)
const REVENUECAT_API_KEY_ANDROID = process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY || '';
const REVENUECAT_API_KEY_IOS = process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY || '';

let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Call this once when app starts (in a useEffect or app initialization)
 */
export async function initializeRevenueCat() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[RevenueCat] Not on native platform, skipping initialization');
    return;
  }

  if (isInitialized) {
    console.log('[RevenueCat] Already initialized');
    return;
  }

  try {
    const apiKey = Capacitor.getPlatform() === 'android'
      ? REVENUECAT_API_KEY_ANDROID
      : REVENUECAT_API_KEY_IOS;

    if (!apiKey) {
      console.warn('[RevenueCat] No API key configured');
      return;
    }

    console.log('[RevenueCat] Initializing SDK with API Key:', apiKey);

    await Purchases.configure({
      apiKey,
      appUserID: undefined, // We'll set this when user logs in
    });

    // Enable debug logs in development
    if (process.env.NODE_ENV === 'development') {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    }

    isInitialized = true;
    console.log('[RevenueCat] Initialized successfully');
  } catch (error) {
    console.error('[RevenueCat] Initialization error:', error);
  }
}

/**
 * Set user ID after login
 */
export async function setRevenueCatUser(userId: string) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await Purchases.logIn({ appUserID: userId });
    console.log('[RevenueCat] User logged in:', userId);
  } catch (error) {
    console.error('[RevenueCat] Login error:', error);
  }
}

/**
 * Log out user
 */
export async function logoutRevenueCat() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await Purchases.logOut();
    console.log('[RevenueCat] User logged out');
  } catch (error) {
    console.error('[RevenueCat] Logout error:', error);
  }
}

/**
 * Get available subscription products
 */
export async function getSubscriptionProducts() {
  if (!Capacitor.isNativePlatform()) {
    return [];
  }

  try {
    const offerings = await Purchases.getOfferings();
    const currentOffering = offerings.current;

    if (!currentOffering) {
      console.log('[RevenueCat] No current offering');
      return [];
    }

    return currentOffering.availablePackages;
  } catch (error) {
    console.error('[RevenueCat] Error fetching products:', error);
    return [];
  }
}

/**
 * Purchase a subscription
 */
export async function purchaseSubscription(packageId: string, oldProductIdentifier?: string | null) {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Purchases only available on mobile');
  }

  try {
    const offerings = await Purchases.getOfferings();
    console.log('[RevenueCat] Raw offerings object:', JSON.stringify(offerings));
    console.log('[RevenueCat] Current offering:', JSON.stringify(offerings.current));
    console.log('[RevenueCat] Available packages:', JSON.stringify(offerings.current?.availablePackages));

    const pkg = offerings.current?.availablePackages.find(p => {
      if (packageId === 'yearly' || packageId === 'annual') {
        return p.identifier === 'yearly' || p.identifier === 'annual' || p.identifier === '$rc_yearly' || p.identifier === '$rc_annual';
      }
      if (packageId === 'monthly') {
        return p.identifier === 'monthly' || p.identifier === '$rc_monthly';
      }
      return p.identifier === packageId;
    });

    if (!pkg) {
      throw new Error('Package not found');
    }

    const purchaseOptions: any = { aPackage: pkg };

    if (Capacitor.getPlatform() === 'android' && oldProductIdentifier) {
      const isUpgrade = packageId === 'yearly' || packageId === 'annual';
      const prorationMode = isUpgrade 
        ? PRORATION_MODE.IMMEDIATE_AND_CHARGE_FULL_PRICE 
        : PRORATION_MODE.DEFERRED;

      purchaseOptions.googleProductChangeInfo = {
        oldProductIdentifier: oldProductIdentifier,
        prorationMode: prorationMode
      };
      console.log(`[RevenueCat] Android upgrade/downgrade: oldProductIdentifier=${oldProductIdentifier}, prorationMode=${prorationMode}`);
    }

    const result = await Purchases.purchasePackage(purchaseOptions);
    console.log('[RevenueCat] Purchase successful:', result);
    return result;
  } catch (error) {
    console.error('[RevenueCat] Purchase error:', error);
    throw error;
  }
}

/**
 * Get current subscription status
 */
export async function getSubscriptionStatus() {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const entitlements = customerInfo.customerInfo.entitlements.active;

    // Check if user has 'pro' entitlement
    const hasPro = 'pro' in entitlements;

    return {
      isPro: hasPro,
      expirationDate: hasPro ? entitlements['pro'].expirationDate : null,
      productIdentifier: hasPro ? entitlements['pro'].productIdentifier : null,
      productPlanIdentifier: hasPro ? entitlements['pro'].productPlanIdentifier : null,
    };
  } catch (error) {
    console.error('[RevenueCat] Error getting subscription status:', error);
    return null;
  }
}

/**
 * Restore purchases (for users who reinstalled the app)
 */
export async function restorePurchases() {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Restore only available on mobile');
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log('[RevenueCat] Purchases restored:', customerInfo);
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Restore error:', error);
    throw error;
  }
}
