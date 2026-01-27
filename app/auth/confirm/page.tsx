'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthConfirmPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const confirmAuth = async () => {
      try {
        console.log('[Auth Confirm] Starting auth confirmation...');
        console.log('[Auth Confirm] Full URL:', window.location.href);
        console.log('[Auth Confirm] Hash:', window.location.hash);

        // Get tokens from URL hash
        const hash = window.location.hash.substring(1);
        if (!hash) {
          console.error('[Auth Confirm] No hash found in URL');
          setStatus('error');
          setErrorMessage('No authentication data found');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }

        console.log('[Auth Confirm] Decoding hash...');
        // Decode tokens using browser-native atob (not Node.js Buffer)
        let tokens;
        try {
          const decodedString = atob(hash);
          console.log('[Auth Confirm] Decoded string:', decodedString);
          tokens = JSON.parse(decodedString);
          console.log('[Auth Confirm] Parsed tokens:', {
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token
          });
        } catch (decodeError) {
          console.error('[Auth Confirm] Failed to decode/parse hash:', decodeError);
          throw new Error('Invalid authentication data format');
        }

        if (!tokens.access_token || !tokens.refresh_token) {
          console.error('[Auth Confirm] Missing tokens in data');
          throw new Error('Invalid token data');
        }

        console.log('[Auth Confirm] Setting session...');
        // Set the session using Supabase client
        const { error } = await supabase.auth.setSession({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });

        if (error) {
          console.error('[Auth Confirm] Supabase setSession error:', error);
          throw error;
        }

        console.log('[Auth Confirm] Session set successfully!');
        // Session set successfully
        setStatus('success');

        // Wait a bit longer on mobile to ensure localStorage is written
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('[Auth Confirm] Redirecting to home...');
        // Use window.location for reliable redirect on mobile
        window.location.href = '/';
      } catch (error) {
        console.error('[Auth Confirm] Auth confirmation error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');

        // Redirect to login after showing error
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    };

    confirmAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh px-4">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-[var(--color-accent-primary)] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              Completing sign in...
            </h2>
            <p className="text-[var(--color-text-muted)]">
              Please wait while we set up your account
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              Sign in successful!
            </h2>
            <p className="text-[var(--color-text-muted)]">
              Redirecting you to the app...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-coral-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-coral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              Authentication Error
            </h2>
            <p className="text-[var(--color-text-muted)] mb-2">
              {errorMessage}
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Redirecting to login...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
