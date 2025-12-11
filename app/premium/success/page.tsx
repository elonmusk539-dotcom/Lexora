'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [subscriptionValid, setSubscriptionValid] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const validateSubscription = async () => {
      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        // Wait a bit for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if subscription exists and is active
        const { data: subscription, error: dbError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single();

        if (dbError || !subscription) {
          console.log('No active subscription found for user:', session.user.id);

          // Fallback: Verify directly with Dodo (handling localhost/webhook delays)
          const sessionId = searchParams.get('session_id');
          if (sessionId) {
            console.log('Attempting direct verification for session:', sessionId);
            try {
              const verifyRes = await fetch('/api/dodo/verify-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
              });
              const verifyData = await verifyRes.json();

              if (verifyRes.ok && verifyData.verified) {
                console.log('Direct verification successful!');
                setSubscriptionValid(true);
                setError(null);
                return;
              } else {
                console.error('Direct verification failed:', verifyData);
                // Show specific error from verification if possible
                if (verifyData.message) {
                  setError(`Verification failed: ${verifyData.message}`);
                }
              }
            } catch (fallbackError) {
              console.error('Fallback verification error:', fallbackError);
            }
          }

          setError('Payment was not completed. Please try again.');
          setSubscriptionValid(false);
        } else {
          console.log('Active subscription confirmed:', subscription);
          setSubscriptionValid(true);
          setError(null);
        }
      } catch (err) {
        console.error('Error validating subscription:', err);
        setError('Error validating subscription');
        setSubscriptionValid(false);
      } finally {
        setLoading(false);
      }
    };

    validateSubscription();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center justify-center h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  // If subscription is not valid, show error
  if (!subscriptionValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-12">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4">
                <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Payment Failed ❌
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 break-words text-left bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm font-mono">
              {error || 'Your payment was not completed successfully.'}
            </p>

            <div className="space-y-4 text-left bg-red-50 dark:bg-red-900/20 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-red-200 dark:border-red-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                What to do next:
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  Check your payment details
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  Try a different payment method
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  Contact support if the issue persists
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/premium"
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
              >
                Try Again
              </Link>
              <Link
                href="/"
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Subscription is valid - show success
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
              <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Lexora Pro! 🎉
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8">
            Your subscription has been activated successfully. You now have access to all premium features!
          </p>

          <div className="space-y-4 text-left bg-gray-50 dark:bg-gray-900 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              What&apos;s unlocked:
            </h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                All vocabulary lists
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Unlimited custom lists
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Unlimited custom words
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Advanced quiz features
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/lists"
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              Explore All Lists
            </Link>
            <Link
              href="/my-lists"
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Create Custom Lists
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center justify-center h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
