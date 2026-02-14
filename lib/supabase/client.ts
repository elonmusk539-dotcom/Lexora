import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Determine the site URL based on environment
const getURL = () => {
  // Check if we're on client side and have access to window
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }

  // Check if we're on localhost/development
  const isLocalhost = typeof window !== 'undefined'
    ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    : false;

  // For local development, always use localhost
  if (isLocalhost || process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
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

  return url;
};

// Use createBrowserClient from @supabase/ssr so that auth tokens are stored
// in cookies. This is required for the Next.js middleware (which uses
// createServerClient) to be able to read the session and authenticate
// protected routes. Using the plain createClient from @supabase/supabase-js
// stores tokens only in localStorage, which the server-side middleware
// cannot access — causing authenticated users to be redirected to /login.
export const supabase: SupabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export { getURL };
