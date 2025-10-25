import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Determine the site URL based on environment
const getURL = () => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ?? // Set this in Vercel environment variables
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel
    'http://localhost:3000';
  
  // Make sure to include `https://` when not localhost
  url = url.includes('http') ? url : `https://${url}`;
  // Make sure to include a trailing `/`
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  return url;
};

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    }
  }
);

export { getURL };
