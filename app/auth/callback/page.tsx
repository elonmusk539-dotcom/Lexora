'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[Auth Callback Client] Current URL:', window.location.href);
        
        // Check for errors in URL
        const errorParam = searchParams?.get('error');
        const errorDescription = searchParams?.get('error_description');

        if (errorParam) {
          console.error('[Auth Callback Client] OAuth error:', errorParam, errorDescription);
          setError(errorDescription || errorParam);
          setIsProcessing(false);
          setTimeout(() => router.push('/login?error=' + encodeURIComponent(errorDescription || errorParam)), 2000);
          return;
        }

        // Let Supabase handle the session automatically
        // It will detect the code in the URL and exchange it using the stored PKCE verifier
        console.log('[Auth Callback Client] Waiting for session...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[Auth Callback Client] Session error:', sessionError);
          setError(sessionError.message);
          setIsProcessing(false);
          setTimeout(() => router.push('/login?error=' + encodeURIComponent(sessionError.message)), 2000);
          return;
        }

        if (session) {
          console.log('[Auth Callback Client] Session found:', session.user.id);
          
          // Create user profile if needed
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!existingProfile) {
            console.log('[Auth Callback Client] Creating user profile...');
            await supabase
              .from('user_profiles')
              .insert({
                id: session.user.id,
                email: session.user.email || '',
                username: session.user.email?.split('@')[0] || 'user',
                created_at: new Date().toISOString(),
              });
          }

          // Get the 'next' parameter or default to home
          const next = searchParams?.get('next') || '/';
          console.log('[Auth Callback Client] Redirecting to:', next);
          
          // Small delay to ensure session is fully set
          await new Promise(resolve => setTimeout(resolve, 100));
          window.location.href = next;
        } else {
          console.log('[Auth Callback Client] No session found, checking for code...');
          
          // If no session yet, check if there's a code to exchange
          const code = searchParams?.get('code');
          if (code) {
            console.log('[Auth Callback Client] Code found, exchanging...');
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error('[Auth Callback Client] Exchange error:', exchangeError);
              setError(exchangeError.message);
              setIsProcessing(false);
              setTimeout(() => router.push('/login?error=' + encodeURIComponent(exchangeError.message)), 2000);
              return;
            }
            
            // Retry getting session after exchange
            const { data: { session: newSession } } = await supabase.auth.getSession();
            if (newSession) {
              const next = searchParams?.get('next') || '/';
              await new Promise(resolve => setTimeout(resolve, 100));
              window.location.href = next;
            }
          } else {
            console.log('[Auth Callback Client] No code found, redirecting to login');
            setError('No authentication code found');
            setIsProcessing(false);
            setTimeout(() => router.push('/login?error=no_code'), 2000);
          }
        }
      } catch (error) {
        console.error('[Auth Callback Client] Unexpected error:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        setIsProcessing(false);
        setTimeout(() => router.push('/login?error=callback_failed'), 2000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

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
        ) : isProcessing ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Completing sign in...</h2>
              <p className="text-gray-600 dark:text-gray-400">Please wait while we set up your account</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
