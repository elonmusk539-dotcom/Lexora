'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[Auth Callback Client] Processing OAuth callback...');
        
        // Get the code from URL
        const searchParams = new URLSearchParams(window.location.search);
        
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (errorParam) {
          console.error('[Auth Callback Client] OAuth error:', errorParam, errorDescription);
          setError(errorDescription || errorParam);
          setTimeout(() => router.push('/login?error=' + encodeURIComponent(errorDescription || errorParam)), 2000);
          return;
        }

        if (code) {
          console.log('[Auth Callback Client] Exchanging code for session...');
          
          // Exchange code for session - this will use the PKCE verifier from localStorage
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('[Auth Callback Client] Exchange error:', exchangeError);
            setError(exchangeError.message);
            setTimeout(() => router.push('/login?error=' + encodeURIComponent(exchangeError.message)), 2000);
            return;
          }

          if (data?.session) {
            console.log('[Auth Callback Client] Session established successfully');
            
            // Create user profile if needed
            if (data.user) {
              const { data: existingProfile } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', data.user.id)
                .maybeSingle();

              if (!existingProfile) {
                console.log('[Auth Callback Client] Creating user profile...');
                await supabase
                  .from('user_profiles')
                  .insert({
                    id: data.user.id,
                    email: data.user.email || '',
                    username: data.user.email?.split('@')[0] || 'user',
                    created_at: new Date().toISOString(),
                  });
              }
            }

            // Get the 'next' parameter or default to home
            const next = searchParams.get('next') || '/';
            console.log('[Auth Callback Client] Redirecting to:', next);
            router.push(next);
          }
        } else {
          // No code, redirect to login
          console.log('[Auth Callback Client] No code present, redirecting to login');
          router.push('/login?error=no_code');
        }
      } catch (error) {
        console.error('[Auth Callback Client] Unexpected error:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        setTimeout(() => router.push('/login?error=callback_failed'), 2000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authentication Error</h2>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Redirecting to login...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Completing sign in...</h2>
              <p className="text-gray-600 dark:text-gray-400">Please wait while we set up your account</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
