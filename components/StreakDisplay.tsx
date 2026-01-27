'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, X, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_freeze_used: boolean;
  streak_freeze_date: string | null;
}

interface StreakDisplayProps {
  compact?: boolean;
}

export function StreakDisplay({ compact = false }: StreakDisplayProps) {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [showMissedModal, setShowMissedModal] = useState(false);
  const [daysMissed, setDaysMissed] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('current_streak, longest_streak, last_activity_date, streak_freeze_used, streak_freeze_date')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setStreakData(profile as StreakData);
        checkMissedDays(profile as StreakData);
      }
    } catch (error) {
      console.error('Error loading streak:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStreak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkMissedDays = (data: StreakData) => {
    if (!data.last_activity_date) return;

    const lastActivity = new Date(data.last_activity_date);
    const today = new Date();
    const diffTime = today.getTime() - lastActivity.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1 && !data.streak_freeze_used && data.current_streak > 0) {
      setDaysMissed(1);
      setShowMissedModal(true);
    } else if (diffDays > 1 && data.current_streak > 0) {
      setDaysMissed(diffDays);
      setShowMissedModal(true);
    }
  };

  const useStreakFreeze = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      await supabase
        .from('user_profiles')
        .update({
          streak_freeze_used: true,
          streak_freeze_date: today,
          last_activity_date: today,
        })
        .eq('user_id', user.id);

      setShowMissedModal(false);
      loadStreak();
    } catch (error) {
      console.error('Error using streak freeze:', error);
    }
  };

  const restartStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      await supabase
        .from('user_profiles')
        .update({
          current_streak: 1,
          last_activity_date: today,
          streak_freeze_used: false,
          streak_freeze_date: null,
        })
        .eq('user_id', user.id);

      setShowMissedModal(false);
      loadStreak();
    } catch (error) {
      console.error('Error restarting streak:', error);
    }
  };

  if (loading || !streakData) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-2 glass rounded-lg border border-coral-500/30">
        <Flame className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-coral-500" />
        <span className="text-sm sm:text-base font-bold text-coral-500">{streakData.current_streak}</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4 p-4 glass rounded-xl bg-gradient-to-r from-coral-500/10 to-orange-500/10 border border-coral-500/30">
        <div className="flex items-center gap-2">
          <Flame className="w-8 h-8 text-coral-500" />
          <div>
            <div className="text-2xl font-bold text-coral-500">
              {streakData.current_streak}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">day streak</div>
          </div>
        </div>
        <div className="h-10 w-px bg-coral-500/30"></div>
        <div>
          <div className="text-sm text-[var(--color-text-muted)]">Best</div>
          <div className="text-lg font-bold text-[var(--color-text-primary)]">{streakData.longest_streak}</div>
        </div>
      </div>

      {/* Missed Day Modal */}
      <AnimatePresence>
        {showMissedModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMissedModal(false)}
              className="fixed inset-0 bg-night-400/70 z-50 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass-strong rounded-2xl shadow-xl z-[60] p-4 sm:p-6"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowMissedModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl glass hover:bg-[var(--color-surface-overlay)] transition-all"
              >
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </motion.button>

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-coral-500 to-orange-500 rounded-2xl mb-4 shadow-glow-coral">
                  <Flame className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                  {daysMissed === 1 ? 'You missed yesterday!' : `${daysMissed} days missed`}
                </h3>
                <p className="text-[var(--color-text-muted)]">
                  {daysMissed === 1
                    ? 'Your streak is at risk. But don\'t worry, it happens to everyone!'
                    : 'Your streak has been lost, but you can start fresh anytime.'}
                </p>
              </div>

              <div className="space-y-3">
                {daysMissed === 1 && !streakData.streak_freeze_used && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={useStreakFreeze}
                    className="w-full py-3 px-4 bg-gradient-to-r from-coral-500 to-orange-500 text-white rounded-xl font-medium shadow-glow-coral flex items-center justify-center gap-2"
                  >
                    <Gift className="w-5 h-5" />
                    Use Streak Freeze (One-time)
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={restartStreak}
                  className="w-full btn-primary py-3"
                >
                  Start Fresh (No worries!)
                </motion.button>

                <button
                  onClick={() => setShowMissedModal(false)}
                  className="w-full py-3 px-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Remind me later
                </button>
              </div>

              {daysMissed === 1 && !streakData.streak_freeze_used && (
                <div className="mt-4 p-3 glass rounded-xl">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    💡 <strong>Streak Freeze:</strong> Covers one missed day. Everyone deserves a break sometimes!
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
