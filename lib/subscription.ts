import { supabase } from '@/lib/supabase/client';

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const { data } = await supabase.rpc('has_active_subscription', {
    p_user_id: userId,
  });
  return data === true;
}

// Usage in components:
const isPremium = await hasActiveSubscription(userId);
if (!isPremium) {
  router.push('/premium');
  return;
}