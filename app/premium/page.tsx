'use client';

import { useState } from 'react';
import { useSubscription } from '@/lib/subscription/useSubscription';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Infinity, List, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { isAndroid } from '@/lib/billing/platform';
import { purchaseSubscription } from '@/lib/billing/revenuecat';

export default function PremiumPage() {
  const { subscription, isPro, loading: subLoading } = useSubscription();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [processingSubscription, setProcessingSubscription] = useState(false);
  const isNativeAndroid = isAndroid();

  const handleSubscribeClick = async () => {
    try {
      setProcessingSubscription(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to subscribe');
        setProcessingSubscription(false);
        return;
      }

      // Only allow subscriptions on Android app
      if (!isNativeAndroid) {
        alert('Subscriptions are currently only available on the Android app. Please download the app from Google Play Store.');
        setProcessingSubscription(false);
        return;
      }

      // Determine package identifier based on billing interval
      const packageId = billingInterval === 'month' ? 'monthly' : 'yearly';

      // Purchase via RevenueCat (Google Play Billing)
      const result = await purchaseSubscription(packageId);

      if (result) {
        // Sync to Supabase
        await fetch('/api/subscription/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            platform: 'google_play',
            productId: result.customerInfo.entitlements.active.pro?.productIdentifier,
          }),
        });

        alert('Subscription successful! Thank you for upgrading to Pro.');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error processing subscription:', error);
      alert(error instanceof Error ? error.message : 'Subscription failed. Please try again.');
    } finally {
      setProcessingSubscription(false);
    }
  };
  return (
    <div className="min-h-screen bg-mesh">

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-coral-400 to-coral-600 rounded-2xl mb-4 sm:mb-6 shadow-glow-coral">
            <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-3 sm:mb-4">
            Upgrade to Lexora Pro
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-muted)] max-w-2xl mx-auto">
            Unlock unlimited learning potential and access all premium features
          </p>
        </div>

        {isPro && (
          <div className="mb-8 p-4 glass rounded-xl bg-green-500/10 border border-green-500/30 text-center">
            <p className="text-green-600 dark:text-green-400 font-medium">
              🎉 You&apos;re already a Pro member! Thank you for your support.
            </p>
            {subscription.currentPeriodEnd && (
              <p className="text-sm text-green-500 mt-1">
                Your subscription renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Billing Toggle */}
        {!isPro && (
          <div className="flex justify-center items-center gap-4 mb-8 sm:mb-12">
            <span className={`text-sm sm:text-base font-medium ${billingInterval === 'month' ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-muted)]'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
              className={`relative inline-flex h-7 w-14 sm:h-8 sm:w-16 items-center rounded-full transition-colors ${billingInterval === 'year' ? 'bg-gradient-to-r from-ocean-600 to-ocean-500' : 'bg-[var(--color-border)]'
                }`}
            >
              <span
                className={`inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white transition-transform ${billingInterval === 'year' ? 'translate-x-8 sm:translate-x-9' : 'translate-x-1'
                  }`}
              />
            </button>
            <span className={`text-sm sm:text-base font-medium ${billingInterval === 'year' ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-muted)]'}`}>
              Yearly
              <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </span>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 sm:p-8"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mb-2">Free</h3>
            <div className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-6">
              $0
              <span className="text-base sm:text-lg text-[var(--color-text-muted)] font-normal">/month</span>
            </div>

            <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[var(--color-accent-primary)] flex-shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-[var(--color-text-secondary)]">
                  Access to <strong>6 vocabulary lists</strong> (95 words)<br />
                  <span className="text-xs sm:text-sm text-[var(--color-text-muted)]">(Family, Numbers, Body Parts, Food & Drinks, Time, School & Work)</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[var(--color-accent-primary)] flex-shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-[var(--color-text-secondary)]">
                  Create up to <strong>2 custom lists</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[var(--color-accent-primary)] flex-shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-[var(--color-text-secondary)]">
                  Add up to <strong>10 custom words</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[var(--color-accent-primary)] flex-shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-[var(--color-text-secondary)]">
                  <strong>All quiz features</strong> (Smart Quiz, Normal Quiz, MCQ, Flashcards)
                </span>
              </li>
            </ul>

            <button
              disabled
              className="w-full py-3 bg-[var(--color-surface)] text-[var(--color-text-muted)] rounded-xl font-semibold cursor-not-allowed border border-[var(--color-border)]"
            >
              Current Plan
            </button>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-ocean-600 to-ocean-500 rounded-2xl shadow-glow p-4 sm:p-6 md:p-8 border border-ocean-400/30 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-coral-500 text-white px-4 py-1 text-xs sm:text-sm font-bold rounded-bl-lg">
              BEST VALUE
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Crown className="w-6 h-6" />
              Pro
            </h3>
            <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {billingInterval === 'month' ? '$2.99' : '$28.99'}
              <span className="text-base sm:text-lg text-ocean-200 font-normal">
                /{billingInterval}
              </span>
            </div>
            {billingInterval === 'year' && (
              <p className="text-sm text-ocean-200 mb-6">That&apos;s $2.41/month</p>
            )}

            <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <li className="flex items-start gap-3">
                <Infinity className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-white">
                  <strong>All vocabulary lists</strong> unlocked
                </span>
              </li>
              <li className="flex items-start gap-3">
                <List className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-white">
                  <strong>Unlimited custom lists</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-white">
                  <strong>Unlimited custom words</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-white">
                  <strong>All quiz features</strong> (Smart Quiz, Normal Quiz, MCQ, Flashcards)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-white">
                  Priority support
                </span>
              </li>
            </ul>

            {isPro ? (
              <button
                disabled
                className="w-full py-3 bg-[var(--color-surface)] text-[var(--color-text-muted)] rounded-xl font-bold text-base sm:text-lg cursor-not-allowed border border-[var(--color-border)] flex items-center justify-center gap-2"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={handleSubscribeClick}
                disabled={processingSubscription}
                className="w-full py-3 bg-white text-ocean-600 rounded-xl font-bold text-base sm:text-lg hover:bg-ocean-50 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingSubscription ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Subscribe Now'
                )}
              </button>
            )}
          </motion.div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-6 sm:mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <details className="card p-4 sm:p-6">
              <summary className="font-semibold text-base sm:text-lg text-[var(--color-text-primary)] cursor-pointer">
                Can I cancel anytime?
              </summary>
              <p className="mt-3 text-sm sm:text-base text-[var(--color-text-muted)]">
                Yes! You can cancel your subscription at any time. You&apos;ll retain access to Pro features until the end of your billing period.
              </p>
            </details>

            <details className="card p-4 sm:p-6">
              <summary className="font-semibold text-base sm:text-lg text-[var(--color-text-primary)] cursor-pointer">
                What payment methods do you accept?
              </summary>
              <p className="mt-3 text-sm sm:text-base text-[var(--color-text-muted)]">
                We accept all major credit cards, debit cards, carrier billing, and Google Play balance. Subscriptions are only available through the Android app via Google Play.
              </p>
            </details>

            <details className="card p-4 sm:p-6">
              <summary className="font-semibold text-base sm:text-lg text-[var(--color-text-primary)] cursor-pointer">
                What happens to my custom content if I downgrade?
              </summary>
              <p className="mt-3 text-sm sm:text-base text-[var(--color-text-muted)]">
                Your custom lists and words will be preserved, but you&apos;ll only be able to access up to 2 custom lists and 10 custom words on the free plan. You can upgrade anytime to regain full access.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
