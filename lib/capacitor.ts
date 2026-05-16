import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

// Check if running in Capacitor native app.
// When using server.url with a remote URL, the Capacitor bridge may not
// be injected, so Capacitor.isNativePlatform() returns false even inside
// the Android WebView. We fall back to user-agent detection: Android
// WebView includes "; wv)" in the UA string, which regular Chrome does not.
export const isNativeApp = (): boolean => {
  // First, try the official Capacitor bridge check
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {
    // Bridge not available
  }

  // Fallback 1: The Android WebView injects window.Capacitor globally
  // even if it fails to set the platform correctly for remote URLs.
  if (typeof window !== 'undefined' && typeof (window as any).Capacitor !== 'undefined') {
    return true;
  }

  // Fallback 2: detect Android WebView via user-agent
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    const ua = navigator.userAgent;
    if (/\bwv\b/.test(ua) && /Android/.test(ua)) {
      return true;
    }
  }

  return false;
};

// Check if the Capacitor bridge is actually available for plugin calls.
// Unlike isNativeApp(), this returns true ONLY when the bridge is injected
// and Capacitor plugins (Browser, App, etc.) can be called.
export const hasBridge = (): boolean => {
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {
    // Bridge not available
  }
  
  if (typeof window !== 'undefined' && typeof (window as any).Capacitor !== 'undefined') {
    return true;
  }

  return false;
};

// Setup deep link listener for OAuth callback
export const setupDeepLinkListener = (onUrl: (url: string) => void) => {
  if (!hasBridge()) return () => { };

  let appUrlHandle: { remove: () => void } | null = null;
  let browserFinishedHandle: { remove: () => void } | null = null;

  try {
    // Listen for app URL open events (deep links)
    App.addListener('appUrlOpen', (event) => {
      console.log('[Capacitor] App opened with URL:', event.url);
      onUrl(event.url);
    }).then(handle => {
      appUrlHandle = handle;
    });

    // Listen for browser finished events (when in-app browser closes)
    // On Android 15+, the OAuth callback may complete in the browser
    // without triggering a deep link, so we check auth state when browser closes
    Browser.addListener('browserFinished', () => {
      console.log('[Capacitor] Browser finished - checking auth state');
      onUrl('__browser_finished__');
    }).then(handle => {
      browserFinishedHandle = handle;
    });
  } catch (e) {
    console.warn('[Capacitor] Failed to set up deep link listeners:', e);
  }

  return () => {
    appUrlHandle?.remove();
    browserFinishedHandle?.remove();
  };
};

export const openInAppBrowser = async (url: string) => {
  if (!hasBridge()) {
    // On web or WebView without bridge, just redirect normally
    window.location.href = url;
    return;
  }

  // Try to force the native Browser plugin directly.
  // When platform is 'web' (due to remote server.url), the standard Browser.open()
  // falls back to window.open(), which keeps OAuth in the WebView and gets blocked by Google.
  // By calling the injected native proxy directly, we force a Chrome Custom Tab.
  const nativeBrowser = typeof window !== 'undefined' ? (window as any).Capacitor?.Plugins?.Browser : null;
  
  if (nativeBrowser && nativeBrowser.open) {
    try {
      await nativeBrowser.open({
        url,
        windowName: '_self',
        presentationStyle: 'popover'
      });
      return;
    } catch (e) {
      console.warn('Native browser plugin failed, falling back', e);
    }
  }

  // Fallback to standard web navigation
  window.location.href = url;
};

// Close in-app browser
export const closeInAppBrowser = async () => {
  if (hasBridge()) {
    try {
      await Browser.close();
    } catch {
      // Browser may already be closed
    }
  }
};
