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

  let listenerHandle: { remove: () => void } | null = null;

  // Listen for app URL open events (deep links)
  App.addListener('appUrlOpen', (event) => {
    console.log('[Capacitor] App opened with URL:', event.url);
    onUrl(event.url);
  }).then(handle => {
    listenerHandle = handle;
  });

  return () => {
    listenerHandle?.remove();
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
    await Browser.close();
  }
};
