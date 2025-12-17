import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lexora.app',
  appName: 'Lexora',
  webDir: 'public',
  server: {
    url: 'https://lexora-nu.vercel.app', // TODO: Update this to your production URL
    cleartext: true
  }
};

export default config;
