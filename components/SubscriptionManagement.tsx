'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Calendar, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { useSubscription } from '@/lib/subscription/useSubscription';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function SubscriptionManagement() {
  const { subscription, isPro, loading } = useSubscription();
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const router = useRouter();

  const handleCancelSubscription = async () => {
    setCancelling(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to cancel your subscription');
        setCancelling(false);
        return;
      }

      console.log('Sending cancel request for user:', user.id);

      const response = await fetch('/api/paypal/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          reason: cancelReason.trim() || 'No reason provided',
        }),
      });

      console.log('Cancel response status:', response.status);
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse response JSON:', e);
        data = { error: 'Invalid response from server' };
      }
      
      console.log('Cancel response data:', data);

      if (!response.ok) {
        const errorMessage = data.error || data.details || 'Failed to cancel subscription';
        console.error('Cancel subscription error:', { status: response.status, data });
        throw new Error(errorMessage);
      }

      alert(data.message || 'Subscription cancelled successfully');
      setShowCancelModal(false);
      setCancelReason('');
      
      // Refresh the page to update subscription status
      router.refresh();
      window.location.reload();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription. Please try again or contact support.';
      alert(errorMessage);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-750 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Upgrade to Lexora Pro
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Unlock unlimited vocabulary lists, custom content, and premium features.
            </p>
            <button
              onClick={() => router.push('/premium')}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              View Premium Plans
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const isCancelled = subscription.status === 'canceled' || subscription.cancelAtPeriodEnd;
  const currentPeriodEnd = subscription.currentPeriodEnd 
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Lexora Pro
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isCancelled ? 'Cancelled' : 'Active Subscription'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Subscription Details */}
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <CreditCard className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium">Billing Interval</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {subscription.interval || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Calendar className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium">
                {isCancelled ? 'Access Until' : 'Next Billing Date'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentPeriodEnd}
              </p>
            </div>
          </div>

          {isCancelled && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">Subscription Cancelled</p>
                <p>
                  You will retain Pro access until {currentPeriodEnd}. After that, your account will revert to the free plan.
                </p>
              </div>
            </div>
          )}

          {/* Cancel Button */}
          {!isCancelled && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg font-medium transition-colors"
              >
                Cancel Subscription
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Cancel Subscription?
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We&apos;re sorry to see you go! You&apos;ll retain Pro access until the end of your current billing period ({currentPeriodEnd}).
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Please tell us why you&apos;re cancelling (optional):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Your feedback helps us improve..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Keep Pro
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
