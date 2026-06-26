'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { UserSubscription } from './config';
import { Capacitor } from '@capacitor/core';
import { getSubscriptionStatus } from '@/lib/billing/revenuecat';

export function useSubscription(passedUserId?: string, skipAuth = false) {
  const [subscription, setSubscription] = useState<UserSubscription>({
    tier: 'free',
    status: 'none',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // If skipAuth is true and passedUserId is not yet loaded, wait and do not perform any fetch
    if (skipAuth && !passedUserId) {
      return;
    }

    const checkSubscription = async () => {
      try {
        let userId = passedUserId;
        if (!userId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            if (active) {
              setSubscription({ tier: 'free', status: 'none' });
              setLoading(false);
            }
            return;
          }
          userId = user.id;
        }

        const { data: subData, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!active) return;

        let dbIsActive = false;
        let dbStatus: 'active' | 'canceled' | 'past_due' | 'none' = 'none';
        let dbPeriodEnd: string | undefined = undefined;
        let dbCancelAtPeriodEnd = false;
        let dbInterval: 'month' | 'year' | undefined = undefined;

        if (!error && subData) {
          const data = subData as unknown as Record<string, unknown>;
          dbStatus = (data.status as 'active' | 'canceled' | 'past_due') || 'none';
          dbIsActive = dbStatus === 'active' || dbStatus === 'trialing';

          // Check if subscription has expired locally (e.g. sandbox 5-min expirations or offline)
          if (dbIsActive && data.current_period_end) {
            const expirationDate = new Date(data.current_period_end as string);
            if (expirationDate.getTime() < Date.now()) {
              dbIsActive = false;
              dbStatus = 'none';
            }
          }

          dbPeriodEnd = data.current_period_end as string;
          dbCancelAtPeriodEnd = data.cancel_at_period_end as boolean;
          dbInterval = data.interval as 'month' | 'year';
        }

        let finalIsPro = dbIsActive;
        let finalStatus = dbStatus;
        let finalPeriodEnd = dbPeriodEnd;
        let finalInterval = dbInterval;

        // If on native platform, cross-reference with native RevenueCat SDK as the source of truth
        if (Capacitor.isNativePlatform()) {
          const nativeStatus = await getSubscriptionStatus();
          if (nativeStatus && active) {
            finalIsPro = nativeStatus.isPro;
            finalStatus = nativeStatus.isPro ? 'active' : 'none';
            finalPeriodEnd = nativeStatus.expirationDate || undefined;

            if (nativeStatus.isPro) {
              const productIdentifier = nativeStatus.productIdentifier;
              const planIdentifier = nativeStatus.productPlanIdentifier;
              const isYearly = 
                (productIdentifier && (productIdentifier.includes('yearly') || productIdentifier.includes('year'))) ||
                (planIdentifier && (planIdentifier.includes('yearly') || planIdentifier.includes('year')));
              
              finalInterval = isYearly ? 'year' : 'month';
            }

            // If local DB status differs from native, sync database in background
            if (nativeStatus.isPro !== dbIsActive) {
              console.log('[useSubscription] Native status differs from local DB, triggering background sync...');
              fetch('/api/subscription/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId,
                  platform: 'google_play',
                  productId: nativeStatus.productIdentifier,
                  planId: nativeStatus.productPlanIdentifier || null,
                }),
              }).catch(err => console.error('[useSubscription] Sync error:', err));
            }
          }
        }

        setSubscription({
          tier: finalIsPro ? 'pro' : 'free',
          status: finalStatus,
          currentPeriodEnd: finalPeriodEnd,
          cancelAtPeriodEnd: dbCancelAtPeriodEnd,
          interval: finalInterval,
        });
      } catch (err) {
        console.error('[useSubscription] Error checking subscription:', err);
        if (active) setSubscription({ tier: 'free', status: 'none' });
      } finally {
        if (active) setLoading(false);
      }
    };

    setLoading(true);
    checkSubscription();

    return () => {
      active = false;
    };
  }, [passedUserId, skipAuth]);

  const refreshSubscription = () => {
    setLoading(true);
    // Trigger check again
    const temp = passedUserId;
    // We can just force check by passing the current id or checking again
  };

  return {
    subscription,
    loading,
    isPro: subscription.tier === 'pro',
    isFree: subscription.tier === 'free',
    refreshSubscription,
  };
}

