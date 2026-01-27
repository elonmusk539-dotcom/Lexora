'use client';

import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Home, RotateCw, ChevronDown, ChevronUp } from 'lucide-react';
import { StreakPopup } from '@/components/StreakPopup';
import { MilestonePopup } from '@/components/MilestonePopup';
import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase/client';
import { WordListItem } from '@/components/WordListItem';
import { WordDetailsCard, type Word } from '@/components/WordDetailsCard';

interface WordProgress {
  correct_streak: number;
  is_mastered: boolean;
  repetitions: number;
  ease_factor: number;
}

function QuizResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const correct = parseInt(searchParams.get('correct') || '0');
  const total = parseInt(searchParams.get('total') || '1');
  const streak = parseInt(searchParams.get('streak') || '0');

  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [showWordsList, setShowWordsList] = useState(false);
  const [quizWords, setQuizWords] = useState<Word[]>([]);
  const [wordProgress, setWordProgress] = useState<Record<string, WordProgress>>({});
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [showMilestonePopup, setShowMilestonePopup] = useState(false);
  const [milestoneType, setMilestoneType] = useState<'streak' | 'words_mastered'>('streak');
  const [milestoneValue, setMilestoneValue] = useState(0);

  const percentage = Math.round((correct / total) * 100);
  const passed = percentage >= 70;

  useEffect(() => {
    // Show streak popup only on first quiz of the day
    if (streak > 0) {
      const today = new Date().toISOString().split('T')[0];
      const lastStreakShown = localStorage.getItem('lastStreakShown');

      if (lastStreakShown !== today) {
        // First quiz of the day - show streak popup
        const timer = setTimeout(() => {
          localStorage.setItem('lastStreakShown', today);
          setShowStreakPopup(true);
        }, 800);

        // Check for streak milestones
        const checkMilestones = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Get profile data
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('last_shown_streak_milestone, last_shown_words_milestone')
            .eq('user_id', user.id)
            .single();

          // Check streak milestones
          const streakMilestones = [7, 14, 21, 30, 60, 90];
          const lastShownStreak = profile?.last_shown_streak_milestone || 0;

          for (const milestone of streakMilestones) {
            if (streak >= milestone && lastShownStreak < milestone) {
              // Update database
              await supabase
                .from('user_profiles')
                .update({ last_shown_streak_milestone: milestone })
                .eq('user_id', user.id);

              setTimeout(() => {
                setShowStreakPopup(false);
                setMilestoneType('streak');
                setMilestoneValue(milestone);
                setShowMilestonePopup(true);
              }, 3000);
              break;
            }
          }

          // Check words mastered milestones
          const { count } = await supabase
            .from('user_progress')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('is_mastered', true);

          if (count !== null && count > 0) {
            const wordsMilestones = [50, 100, 250, 500, 1000];
            const lastShownWords = profile?.last_shown_words_milestone || 0;

            for (const milestone of wordsMilestones) {
              if (count >= milestone && lastShownWords < milestone) {
                // Update database
                await supabase
                  .from('user_profiles')
                  .update({ last_shown_words_milestone: milestone })
                  .eq('user_id', user.id);

                setTimeout(() => {
                  setShowStreakPopup(false);
                  setMilestoneType('words_mastered');
                  setMilestoneValue(milestone);
                  setShowMilestonePopup(true);
                }, 3500);
                break;
              }
            }
          }
        };

        checkMilestones();

        return () => clearTimeout(timer);
      }
    }
  }, [streak]);

  useEffect(() => {
    loadQuizSession();
  }, []);

  const loadQuizSession = async () => {
    try {
      const sessionData = localStorage.getItem('lastQuizSession');
      if (!sessionData) {
        setLoading(false);
        return;
      }

      const session = JSON.parse(sessionData);

      // Check if session is recent (within last 5 minutes)
      if (Date.now() - session.timestamp > 5 * 60 * 1000) {
        setLoading(false);
        return;
      }

      setQuizWords(session.words || []);

      // Fetch progress for these words
      const { data: { user } } = await supabase.auth.getUser();
      if (user && session.words.length > 0) {
        const wordIds = session.words.map((w: Word) => w.id);
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('word_id, correct_streak, is_mastered, repetitions, ease_factor')
          .eq('user_id', user.id)
          .in('word_id', wordIds);

        if (progressData) {
          const progressMap: Record<string, WordProgress> = {};
          progressData.forEach(p => {
            progressMap[p.word_id] = {
              correct_streak: p.correct_streak,
              is_mastered: p.is_mastered,
              repetitions: p.repetitions || 0,
              ease_factor: p.ease_factor || 2.5,
            };
          });
          setWordProgress(progressMap);
        }
      }
    } catch (error) {
      console.error('Error loading quiz session:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (wordId: string) => {
    const progress = wordProgress[wordId];
    if (!progress) return 0;
    // Unified progress based on SRS repetitions (mastered at 7+ repetitions)
    if (progress.is_mastered) return 100;
    return Math.min((progress.repetitions / 7) * 100, 99);
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-3 sm:p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-elevated p-4 sm:p-6 md:p-8 max-w-2xl w-full"
      >
        {/* Trophy Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 sm:mb-6 rounded-2xl flex items-center justify-center ${passed ? 'bg-green-500/10' : 'bg-ocean-500/10'
            }`}
        >
          <Trophy className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${passed ? 'text-green-500' : 'text-[var(--color-accent-primary)]'}`} />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center mb-2"
        >
          {passed ? 'Great Job!' : 'Quiz Complete!'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center mb-6 sm:mb-8"
        >
          {passed ? 'You did amazing! Keep it up!' : 'Keep practicing to improve your score!'}
        </motion.p>

        {/* Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-ocean-500/10 to-teal-500/10"
        >
          <div className="text-center">
            <div className="text-5xl sm:text-6xl md:text-7xl font-bold text-[var(--color-accent-primary)] mb-2">
              {percentage}%
            </div>
            <div className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)]">
              {correct} out of {total} correct
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <div className="glass rounded-xl p-3 sm:p-4 text-center bg-green-500/10 border border-green-500/30">
            <div className="text-2xl sm:text-3xl font-bold text-green-500 mb-1">{correct}</div>
            <div className="text-xs sm:text-sm text-[var(--color-text-muted)]">Correct</div>
          </div>
          <div className="glass rounded-xl p-3 sm:p-4 text-center bg-coral-500/10 border border-coral-500/30">
            <div className="text-2xl sm:text-3xl font-bold text-coral-500 mb-1">{total - correct}</div>
            <div className="text-xs sm:text-sm text-[var(--color-text-muted)]">Incorrect</div>
          </div>
        </motion.div>

        {/* Quiz Words List */}
        {!loading && quizWords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="mb-6 sm:mb-8"
          >
            <button
              onClick={() => setShowWordsList(!showWordsList)}
              className="w-full flex items-center justify-between p-3 sm:p-4 glass rounded-xl bg-gradient-to-r from-ocean-500/10 to-teal-500/10 border border-[var(--color-border)] hover:border-[var(--color-border-focus)] transition-all"
            >
              <span className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">
                View Quizzed Words ({quizWords.length})
              </span>
              {showWordsList ? (
                <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-text-muted)]" />
              ) : (
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-text-muted)]" />
              )}
            </button>

            {showWordsList && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide pb-3"
              >
                {quizWords.map((word, index) => {
                  const progress = wordProgress[word.id];
                  const progressPercent = getProgressPercentage(word.id);
                  const isMastered = progress?.is_mastered || false;

                  return (
                    <motion.div
                      key={word.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <WordListItem
                        word={word}
                        progress={progressPercent}
                        isMastered={isMastered}
                        onClick={() => setSelectedWord(word)}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 gap-3 sm:gap-4"
        >
          <Link
            href="/"
            className="flex items-center justify-center gap-2 py-2.5 sm:py-3 btn-ghost text-sm sm:text-base font-semibold"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            Home
          </Link>
          <button
            onClick={() => router.push('/quiz')}
            className="flex items-center justify-center gap-2 py-2.5 sm:py-3 btn-primary text-sm sm:text-base"
          >
            <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
            Try Again
          </button>
        </motion.div>

        {/* Progress info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
        >
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 text-center">
            Your progress has been updated! Keep practicing to reach mastery level.
          </p>
        </motion.div>
      </motion.div>

      {/* Streak Popup */}
      <StreakPopup
        isOpen={showStreakPopup}
        streakCount={streak}
        onClose={() => setShowStreakPopup(false)}
      />

      {/* Milestone Popup */}
      <MilestonePopup
        isOpen={showMilestonePopup}
        type={milestoneType}
        milestone={milestoneValue}
        onClose={() => setShowMilestonePopup(false)}
      />

      {/* Word Details Modal */}
      {selectedWord && (
        <WordDetailsCard
          word={selectedWord}
          isOpen={!!selectedWord}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}

export default function QuizResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <QuizResults />
    </Suspense>
  );
}
