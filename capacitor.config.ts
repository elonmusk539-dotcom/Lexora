import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lexoraapp.japanese',
  appName: 'Lexora',
  webDir: 'public',
  server: {
    url: 'https://lexora-nu.vercel.app',
    allowNavigation: [
      'localhost',
      'lexora-nu.vercel.app',
      '*.vercel.app',
      '*.supabase.co'
    ]
  }
};

export default config;
