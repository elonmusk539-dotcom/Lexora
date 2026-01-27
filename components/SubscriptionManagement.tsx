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

      const response = await fetch('/api/dodo/cancel', {
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
      <div className="card p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent-primary)]" />
        </div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 bg-gradient-to-br from-coral-500/10 to-orange-500/10 border-coral-500/30"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-coral-400 to-coral-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-glow-coral">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
              Upgrade to Lexora Pro
            </h3>
            <p className="text-[var(--color-text-muted)] mb-4">
              Unlock unlimited vocabulary lists, custom content, and premium features.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/premium')}
              className="btn-accent"
            >
              View Premium Plans
            </motion.button>
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
        className="card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-coral-400 to-coral-600 rounded-xl flex items-center justify-center shadow-glow-coral">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              Lexora Pro
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              {isCancelled ? 'Cancelled' : 'Active Subscription'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Subscription Details */}
          <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
            <CreditCard className="w-5 h-5 text-[var(--color-accent-primary)]" />
            <div>
              <p className="text-sm font-medium">Billing Interval</p>
              <p className="text-sm text-[var(--color-text-muted)] capitalize">
                {subscription.interval || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
            <Calendar className="w-5 h-5 text-[var(--color-accent-primary)]" />
            <div>
              <p className="text-sm font-medium">
                {isCancelled ? 'Access Until' : 'Next Billing Date'}
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {currentPeriodEnd}
              </p>
            </div>
          </div>

          {isCancelled && (
            <div className="flex items-start gap-3 p-4 glass rounded-xl bg-coral-500/10 border border-coral-500/30">
              <AlertCircle className="w-5 h-5 text-coral-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-coral-600 dark:text-coral-400">
                <p className="font-medium mb-1">Subscription Cancelled</p>
                <p>
                  You will retain Pro access until {currentPeriodEnd}. After that, your account will revert to the free plan.
                </p>
              </div>
            </div>
          )}

          {/* Cancel Button */}
          {!isCancelled && (
            <div className="pt-4 border-t border-[var(--color-border)]">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowCancelModal(true)}
                className="w-full px-4 py-2 text-coral-500 hover:bg-coral-500/10 border border-coral-500/30 rounded-xl font-medium transition-colors"
              >
                Cancel Subscription
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-night-400/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong rounded-2xl p-6 max-w-md w-full shadow-xl"
          >
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">
              Cancel Subscription?
            </h3>

            <p className="text-[var(--color-text-muted)] mb-4">
              We&apos;re sorry to see you go! You&apos;ll retain Pro access until the end of your current billing period ({currentPeriodEnd}).
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Please tell us why you&apos;re cancelling (optional):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Your feedback helps us improve..."
                className="input w-full resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 btn-ghost disabled:opacity-50"
              >
                Keep Pro
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-coral-500 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
