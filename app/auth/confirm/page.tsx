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
        // Get tokens from URL hash
        const hash = window.location.hash.substring(1);
        if (!hash) {
          setStatus('error');
          setErrorMessage('No authentication data found');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }

        // Decode tokens
        const tokens = JSON.parse(Buffer.from(hash, 'base64').toString());
        
        if (!tokens.access_token || !tokens.refresh_token) {
          throw new Error('Invalid token data');
        }

        // Set the session using Supabase client
        const { error } = await supabase.auth.setSession({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });

        if (error) {
          throw error;
        }

        // Session set successfully
        setStatus('success');
        
        // Wait a bit longer on mobile to ensure localStorage is written
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use window.location for reliable redirect on mobile
        window.location.href = '/';
      } catch (error) {
        console.error('Auth confirmation error:', error);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Completing sign in...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we set up your account
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Sign in successful!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting you to the app...
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Authentication Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {errorMessage}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting to login...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
