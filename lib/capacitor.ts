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

  // Fallback: detect Android WebView via user-agent
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    const ua = navigator.userAgent;
    // Android WebView contains "wv)" — normal Chrome mobile does not.
    // Also check for the custom app identifier injected by Capacitor.
    if (/\bwv\b/.test(ua) && /Android/.test(ua)) {
      return true;
    }
  }

  return false;
};

// Check if the Capacitor bridge is actually available for plugin calls
const hasBridge = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
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

// Open URL in in-app browser (for OAuth)
export const openInAppBrowser = async (url: string) => {
  if (!hasBridge()) {
    // On web or WebView without bridge, just redirect normally
    window.location.href = url;
    return;
  }

  // On native with bridge, use Capacitor Browser
  await Browser.open({
    url,
    windowName: '_self',
    presentationStyle: 'popover'
  });
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
