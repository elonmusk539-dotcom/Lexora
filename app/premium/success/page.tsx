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
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const validateSubscription = async () => {
      let debug = '';
      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          setError('Not authenticated. Please log in and try again.');
          setLoading(false);
          return;
        }

        debug += `User ID: ${session.user.id}\n`;

        // Wait a bit for webhook to process
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if subscription exists and is active
        const { data: activeSub, error: activeError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single();

        if (activeSub && !activeError) {
          debug += 'Found active subscription!\n';
          console.log('Active subscription confirmed:', activeSub);
          setSubscriptionValid(true);
          setError(null);
          setDebugInfo(debug);
          setLoading(false);
          return;
        }

        debug += activeError ? `Active check error: ${activeError.message}\n` : 'No active subscription found\n';

        // Check for ANY subscription for this user (pending_payment or otherwise)
        const { data: anySub, error: anyError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (anyError) {
          debug += `Any sub error: ${anyError.message}\n`;
        } else if (anySub) {
          debug += `Found subscription with status: ${anySub.status}\n`;

          // If there's a subscription with pending_payment status, try to verify with Dodo
          if (anySub.status === 'pending_payment') {
            debug += 'Attempting server-side verification...\n';

            // Call the verify endpoint with user ID - let the server handle it
            try {
              const verifyRes = await fetch('/api/dodo/verify-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: session.user.id })
              });
              const verifyData = await verifyRes.json();

              debug += `Verify response: ${JSON.stringify(verifyData)}\n`;

              if (verifyRes.ok && verifyData.verified) {
                console.log('Server verification successful!');
                setSubscriptionValid(true);
                setError(null);
                setDebugInfo(debug);
                setLoading(false);
                return;
              } else {
                debug += `Verification failed: ${verifyData.message || verifyData.error || 'Unknown'}\n`;
              }
            } catch (verifyErr) {
              debug += `Verify fetch error: ${verifyErr}\n`;
            }
          }
        } else {
          debug += 'No subscription record found at all\n';
        }

        setError('Payment verification failed. If you were charged, please contact support.');
        setDebugInfo(debug);
        setSubscriptionValid(false);
      } catch (err) {
        console.error('Error validating subscription:', err);
        setError('Error validating subscription: ' + (err instanceof Error ? err.message : 'Unknown'));
        setDebugInfo(debug + `Exception: ${err}\n`);
        setSubscriptionValid(false);
      } finally {
        setLoading(false);
      }
    };

    validateSubscription();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh">
        <div className="flex flex-col items-center justify-center h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--color-accent-primary)] mb-4" />
          <p className="text-[var(--color-text-muted)]">Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  // If subscription is not valid, show error
  if (!subscriptionValid) {
    return (
      <div className="min-h-screen bg-mesh">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="card-elevated p-4 sm:p-6 md:p-8 lg:p-12">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="bg-coral-500/10 rounded-full p-4">
                <AlertCircle className="w-16 h-16 text-coral-500" />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Payment Verification Issue
            </h1>

            <p className="text-lg text-[var(--color-text-muted)] mb-4">
              {error || 'Your payment could not be verified.'}
            </p>

            {/* Debug info for troubleshooting */}
            <details className="text-left mb-6">
              <summary className="cursor-pointer text-sm text-[var(--color-text-muted)]">Technical Details</summary>
              <pre className="mt-2 p-3 glass rounded-lg text-xs overflow-auto whitespace-pre-wrap text-[var(--color-text-secondary)]">
                {debugInfo}
              </pre>
            </details>

            <div className="space-y-4 text-left glass rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-amber-500/20">
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-3">
                What to do:
              </h3>
              <ul className="space-y-2 text-[var(--color-text-secondary)]">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <span>If you were charged, don&apos;t worry - your payment is safe. Contact support with the debug info above.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <span>Try refreshing this page in a few seconds.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <span>If the issue persists, try logging out and back in.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 btn-primary font-semibold"
              >
                Refresh Page
              </button>
              <Link
                href="/"
                className="px-6 py-3 btn-secondary font-semibold"
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
    <div className="min-h-screen bg-mesh">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="card-elevated p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="bg-green-500/10 rounded-full p-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
            Welcome to Lexora Pro! 🎉
          </h1>

          <p className="text-lg text-[var(--color-text-muted)] mb-6 sm:mb-8">
            Your subscription has been activated successfully. You now have access to all premium features!
          </p>

          <div className="space-y-4 text-left glass rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-3">
              What&apos;s unlocked:
            </h3>
            <ul className="space-y-2 text-[var(--color-text-secondary)]">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                All vocabulary lists
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Unlimited custom lists
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Unlimited custom words
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Advanced quiz features
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/lists"
              className="px-6 py-3 btn-primary font-semibold"
            >
              Explore All Lists
            </Link>
            <Link
              href="/my-lists"
              className="px-6 py-3 btn-secondary font-semibold"
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
      <div className="min-h-screen bg-mesh">
        <div className="flex flex-col items-center justify-center h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--color-accent-primary)] mb-4" />
          <p className="text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
