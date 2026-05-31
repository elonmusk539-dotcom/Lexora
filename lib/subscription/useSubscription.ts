'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { UserSubscription } from './config';

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription>({
    tier: 'free',
    status: 'none',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscription({ tier: 'free', status: 'none' });
        setLoading(false);
        return;
      }

      const { data: subData, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

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
      setSubscription({ tier: 'free', status: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = () => {
    setLoading(true);
    checkSubscription();
  };

  return {
    subscription,
    loading,
    isPro: subscription.tier === 'pro',
    isFree: subscription.tier === 'free',
    refreshSubscription,
  };
}
