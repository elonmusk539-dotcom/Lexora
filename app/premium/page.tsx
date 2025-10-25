'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { useSubscription } from '@/lib/subscription/useSubscription';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Infinity, List, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function PremiumPage() {
  const { subscription, isPro, loading: subLoading } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  const handleSubscribe = async (priceId: string) => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      // Call API to create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: session.user.id,
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const monthlyPrice = '$2.99';
  const yearlyPrice = '$28.99';
  const yearlyMonthly = '$2.41';
  const savingsPercent = '17';

  if (subLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Header />

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4 sm:mb-6">
            <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Upgrade to Lexora Pro
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Unlock unlimited learning potential and access all premium features
          </p>
        </div>

        {isPro && (
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
            <p className="text-green-800 dark:text-green-200 font-medium">
              🎉 You&apos;re already a Pro member! Thank you for your support.
            </p>
            {subscription.currentPeriodEnd && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Your subscription renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Billing Toggle */}
        {!isPro && (
          <div className="flex justify-center items-center gap-4 mb-8 sm:mb-12">
            <span className={`text-sm sm:text-base font-medium ${billingInterval === 'month' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
              className={`relative inline-flex h-7 w-14 sm:h-8 sm:w-16 items-center rounded-full transition-colors ${
                billingInterval === 'year' ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white transition-transform ${
                  billingInterval === 'year' ? 'translate-x-8 sm:translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm sm:text-base font-medium ${billingInterval === 'year' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-500'}`}>
              Yearly
              <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                Save {savingsPercent}%
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
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
            <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              $0
              <span className="text-base sm:text-lg text-gray-500 dark:text-gray-400 font-normal">/month</span>
            </div>
            
            <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Access to <strong>4 vocabulary lists</strong><br/>
                  <span className="text-xs sm:text-sm text-gray-500">(Family, Numbers, Body parts, Food & Drinks)</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Create up to <strong>2 custom lists</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Add up to <strong>10 custom words</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Basic quiz features</span>
              </li>
            </ul>

            <button
              disabled
              className="w-full py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl font-semibold cursor-not-allowed"
            >
              Current Plan
            </button>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-2xl p-6 sm:p-8 border-2 border-purple-400 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-yellow-400 text-purple-900 px-4 py-1 text-xs sm:text-sm font-bold rounded-bl-lg">
              BEST VALUE
            </div>
            
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Crown className="w-6 h-6" />
              Pro
            </h3>
            <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {billingInterval === 'month' ? monthlyPrice : yearlyPrice}
              <span className="text-base sm:text-lg text-purple-200 font-normal">
                /{billingInterval}
              </span>
            </div>
            {billingInterval === 'year' && (
              <p className="text-sm text-purple-200 mb-6">That&apos;s {yearlyMonthly}/month</p>
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
                  Advanced quiz features
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-white">
                  Priority support
                </span>
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe(billingInterval === 'month' 
                ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY! 
                : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY!
              )}
              disabled={loading || isPro}
              className="w-full py-3 bg-white text-purple-600 rounded-xl font-bold text-base sm:text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : isPro ? (
                'Current Plan'
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  Upgrade to Pro
                </>
              )}
            </button>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            <details className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6">
              <summary className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white cursor-pointer">
                Can I cancel anytime?
              </summary>
              <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Yes! You can cancel your subscription at any time. You&apos;ll retain access to Pro features until the end of your billing period.
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6">
              <summary className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white cursor-pointer">
                What payment methods do you accept?
              </summary>
              <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                We accept all major credit cards through Stripe, including Visa, Mastercard, American Express, and more.
              </p>
            </details>

            <details className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6">
              <summary className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white cursor-pointer">
                What happens to my custom content if I downgrade?
              </summary>
              <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Your custom lists and words will be preserved, but you&apos;ll only be able to access up to 2 custom lists and 10 custom words on the free plan. You can upgrade anytime to regain full access.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
