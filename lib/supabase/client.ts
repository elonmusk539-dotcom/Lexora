import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Determine the site URL based on environment
const getURL = () => {
  // Check if we're on localhost/development
  const isLocalhost = typeof window !== 'undefined' 
    ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    : false;

  // For local development, always use localhost
  if (isLocalhost || process.env.NODE_ENV === 'development') {
    console.log('[getURL] Using localhost for development');
    return 'http://localhost:3000/';
  }

  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    process.env.VERCEL_URL ??
    'http://localhost:3000';

  if (!url.match(/^https?:\/\//)) {
    url = `https://${url}`;
  }

  if (!url.endsWith('/')) {
    url = `${url}/`;
  }

  console.log('[getURL] Resolved URL:', url);
  return url;
};

export const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token',
    }
  }
);

export { getURL };
