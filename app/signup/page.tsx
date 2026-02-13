'use client';

import { motion } from 'framer-motion';
import { useMemo, useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase, getURL } from '@/lib/supabase/client';
import Link from 'next/link';
import { isNativeApp, setupDeepLinkListener, closeInAppBrowser } from '@/lib/capacitor';
import { Waves } from 'lucide-react';

function SignupForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Handle deep link callbacks for OAuth in native app
  useEffect(() => {
    const cleanup = setupDeepLinkListener(async (url) => {
      await closeInAppBrowser();
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

    // Check if we're on localhost
    const isLocalhost = typeof window !== 'undefined'
      ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      : false;

    // Force localhost in development or when on localhost
    const baseUrl = (isLocalhost || process.env.NODE_ENV === 'development')
      ? 'http://localhost:3000/'
      : getURL();

    const redirectPath = nextParam.startsWith('/') ? nextParam : `/${nextParam}`;
    const fullRedirect = `${baseUrl}auth/callback?next=${encodeURIComponent(redirectPath)}`;
    return fullRedirect;
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        // Wait a bit for session to be stored in localStorage on mobile
        await new Promise(resolve => setTimeout(resolve, 100));
        // Use window.location instead of router for more reliable redirect on mobile
        window.location.href = '/';
      } else {
        setSuccess(true);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during signup';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: oauthRedirect,
          skipBrowserRedirect: isNativeApp(),
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
      const errorMessage = error instanceof Error ? error.message : 'An error occurred with Google signup';
      setError(errorMessage);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh px-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-ocean-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-coral-500/15 rounded-full blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md glass-strong rounded-2xl shadow-xl p-6 sm:p-8 text-center relative z-10"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            Check your email!
          </h2>
          <p className="text-[var(--color-text-muted)] mb-6">
            We&apos;ve sent you a confirmation link. Please check your email to verify
            your account.
          </p>
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary px-6 py-3"
            >
              Go to Login
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

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
            <p className="text-[var(--color-text-muted)]">Create your account to get started</p>
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

          {/* Signup form */}
          <form onSubmit={handleSignup} className="space-y-5">
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

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'Creating account...' : 'Sign Up'}
            </motion.button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] rounded-full">Or continue with</span>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={handleGoogleSignup}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
              Sign up with Google
            </motion.button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-[var(--color-text-muted)]">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-[var(--color-accent-primary)] hover:text-[var(--color-accent-secondary)] font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-primary)]"></div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
