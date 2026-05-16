import { Capacitor } from '@capacitor/core';
import { isNativeApp } from '@/lib/capacitor';

/**
 * Check if we're running on a native platform (Android/iOS).
 * Uses the enhanced detection that falls back to user-agent
 * when the Capacitor bridge isn't injected (remote URL mode).
 */
export function isNativePlatform(): boolean {
  return isNativeApp();
}

/**
 * Check if we're running on Android specifically
 */
export function isAndroid(): boolean {
  try {
    if (Capacitor.getPlatform() === 'android') return true;
  } catch {
    // Bridge not available
  }
  // Fallback: check user-agent
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    return /Android/.test(navigator.userAgent) && /\bwv\b/.test(navigator.userAgent);
  }
  return false;
}

/**
 * Check if we're running on iOS specifically
 */
export function isIOS(): boolean {
  try {
    return Capacitor.getPlatform() === 'ios';
  } catch {
    return false;
  }
}

/**
 * Check if we're running on web
 */
export function isWeb(): boolean {
  return !isNativeApp();
}

/**
 * Get current platform name
 */
export function getPlatform(): 'web' | 'android' | 'ios' {
  try {
    const platform = Capacitor.getPlatform();
    if (platform === 'android') return 'android';
    if (platform === 'ios') return 'ios';
  } catch {
    // Bridge not available
  }
  // Fallback
  if (isAndroid()) return 'android';
  return 'web';
}
