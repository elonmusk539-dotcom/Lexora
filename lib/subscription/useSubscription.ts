'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { UserSubscription } from './config';

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

        if (error || !subData) {
          setSubscription({ tier: 'free', status: 'none' });
          return;
        }

        const data = subData as unknown as Record<string, unknown>;
        const isActive = data.status === 'active' || data.status === 'trialing';

        setSubscription({
          tier: isActive ? 'pro' : 'free',
          status: (data.status as 'active' | 'canceled' | 'past_due') || 'none',
          currentPeriodEnd: data.current_period_end as string,
          cancelAtPeriodEnd: data.cancel_at_period_end as boolean,
          interval: data.interval as 'month' | 'year',
        });
      } catch {
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

