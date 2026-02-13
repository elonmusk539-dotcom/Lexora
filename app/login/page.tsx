'use client';

import { motion } from 'framer-motion';
import { useMemo, useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase, getURL } from '@/lib/supabase/client';
import Link from 'next/link';
import { isNativeApp, setupDeepLinkListener, closeInAppBrowser } from '@/lib/capacitor';
import { Waves } from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle deep link callbacks for OAuth in native app
  useEffect(() => {
    const cleanup = setupDeepLinkListener(async (url) => {

      // Close the in-app browser
      await closeInAppBrowser();

      // Extract the code from the callback URL
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError(error.message);
        } else {
          window.location.href = '/';
        }
      }
    });

    return cleanup;
  }, []);

  const oauthRedirect = useMemo(() => {
    const nextParam = searchParams?.get('next') ?? '/';

    // For native app, use the production URL for callback
    if (isNativeApp()) {
      return `https://lexora-nu.vercel.app/auth/callback?next=${encodeURIComponent(nextParam)}`;
    }

    // Always prefer window.location.origin if available (client-side)
    // This ensures we redirect back to exactly where we came from (localhost, 127.0.0.1, etc.)
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const baseUrl = origin || getURL();

    const redirectPath = nextParam.startsWith('/') ? nextParam : `/${nextParam}`;
    const fullRedirect = `${baseUrl}/auth/callback?next=${encodeURIComponent(redirectPath)}`;

    return fullRedirect;
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        // Wait a bit for session to be stored in localStorage on mobile
        await new Promise(resolve => setTimeout(resolve, 100));
        // Use window.location instead of router for more reliable redirect on mobile
        window.location.href = '/';
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during login';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: oauthRedirect,
          skipBrowserRedirect: isNativeApp(), // Don't auto-redirect in native app
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }

      // For native app, open the auth URL in the in-app browser
      if (isNativeApp() && data.url) {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: data.url });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred with Google login';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh px-4">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-ocean-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-coral-500/15 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-strong rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Logo and title */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center gap-3 mb-4"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <div className="p-3 rounded-2xl bg-gradient-to-br from-ocean-500 to-ocean-600 shadow-glow">
                <Waves className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">Lexora</h1>
            <p className="text-[var(--color-text-muted)]">Welcome back! Sign in to continue.</p>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-4 bg-coral-500/10 border border-coral-500/30 rounded-xl text-coral-500 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input w-full py-3"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input w-full py-3"
                placeholder="••••••••"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] rounded-full">Or continue with</span>
            </div>
          </div>

          {/* Google Login Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3.5 glass rounded-xl font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)] transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </motion.button>

          {/* Sign up link */}
          <p className="mt-6 text-center text-[var(--color-text-muted)]">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-[var(--color-accent-primary)] hover:text-[var(--color-accent-secondary)] font-semibold transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-primary)]"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
