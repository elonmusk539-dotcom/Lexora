import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

// Check if running in Capacitor native app
export const isNativeApp = () => {
  return Capacitor.isNativePlatform();
};

// Setup deep link listener for OAuth callback
export const setupDeepLinkListener = (onUrl: (url: string) => void) => {
  if (!isNativeApp()) return () => { };

  let appUrlHandle: { remove: () => void } | null = null;
  let browserFinishedHandle: { remove: () => void } | null = null;

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

  return () => {
    appUrlHandle?.remove();
    browserFinishedHandle?.remove();
  };
};

// Open URL in in-app browser (for OAuth)
export const openInAppBrowser = async (url: string) => {
  if (!isNativeApp()) {
    // On web, just redirect normally
    window.location.href = url;
    return;
  }

  // On native, use Capacitor Browser
  await Browser.open({
    url,
    windowName: '_self',
    presentationStyle: 'popover'
  });
};

// Close in-app browser
export const closeInAppBrowser = async () => {
  if (isNativeApp()) {
    try {
      await Browser.close();
    } catch {
      // Browser may already be closed
    }
  }
};
