import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lexoraapp.japanese',
  appName: 'Lexora',
  webDir: 'public',
  server: {
    url: 'http://192.168.0.105:3000', // Local dev server IP for testing
    cleartext: true
  }
};

export default config;
