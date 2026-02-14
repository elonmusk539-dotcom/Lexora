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
        // Check for errors in URL
        const errorParam = searchParams?.get('error');
        const errorDescription = searchParams?.get('error_description');

        if (errorParam) {
          setError(errorDescription || errorParam);
          setIsProcessing(false);
          setTimeout(() => router.push('/login?error=' + encodeURIComponent(errorDescription || errorParam)), 2000);
          return;
        }

        // Let Supabase handle the session automatically
        // It will detect the code in the URL and exchange it using the stored PKCE verifier
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          setIsProcessing(false);
          setTimeout(() => router.push('/login?error=' + encodeURIComponent(sessionError.message)), 2000);
          return;
        }

        if (session) {
          // Validate user identity server-side
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setError('Could not verify user identity');
            setIsProcessing(false);
            setTimeout(() => router.push('/login?error=identity_verification_failed'), 2000);
            return;
          }

          // Create user profile if needed
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (!existingProfile) {
            await supabase
              .from('user_profiles')
              .insert({
                id: user.id,
                email: user.email || '',
                username: user.email?.split('@')[0] || 'user',
                created_at: new Date().toISOString(),
              });
          }

          // Get the 'next' parameter or default to home
          const nextParam = searchParams?.get('next') || '/';
          // Prevent open redirect: only allow relative paths
          const next = (nextParam.startsWith('/') && !nextParam.startsWith('//')) ? nextParam : '/';

          // Small delay to ensure session is fully set
          await new Promise(resolve => setTimeout(resolve, 100));
          window.location.href = next;
        } else {
          // If no session yet, check if there's a code to exchange
          const code = searchParams?.get('code');
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
              setError(exchangeError.message);
              setIsProcessing(false);
              setTimeout(() => router.push('/login?error=' + encodeURIComponent(exchangeError.message)), 2000);
              return;
            }

            // Retry getting user after exchange
            const { data: { user: newUser } } = await supabase.auth.getUser();
            if (newUser) {
              const nextParam2 = searchParams?.get('next') || '/';
              const next2 = (nextParam2.startsWith('/') && !nextParam2.startsWith('//')) ? nextParam2 : '/';
              await new Promise(resolve => setTimeout(resolve, 100));
              window.location.href = next2;
            }
          } else {
            setError('No authentication code found');
            setIsProcessing(false);
            setTimeout(() => router.push('/login?error=no_code'), 2000);
          }
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        setIsProcessing(false);
        setTimeout(() => router.push('/login?error=callback_failed'), 2000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-coral-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-coral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Authentication Error</h2>
              <p className="text-[var(--color-text-muted)]">{error}</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-2">Redirecting to login...</p>
            </div>
          </div>
        ) : isProcessing ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-primary)] mx-auto"></div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Completing sign in...</h2>
              <p className="text-[var(--color-text-muted)]">Please wait while we set up your account</p>
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
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-primary)]"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
