'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Trophy, Home, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { WordListItem } from '@/components/WordListItem';
import { WordDetailsCard, type Word } from '@/components/WordDetailsCard';
import { StreakPopup } from '@/components/StreakPopup';
import { MilestonePopup } from '@/components/MilestonePopup';

interface WordProgress {
  correct_streak: number;
  is_mastered: boolean;
  repetitions: number;
  ease_factor: number;
}

function ReviewComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [showWordsList, setShowWordsList] = useState(false);
  const [reviewWords, setReviewWords] = useState<Word[]>([]);
  const [wordProgress, setWordProgress] = useState<Record<string, WordProgress>>({});
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showMilestonePopup, setShowMilestonePopup] = useState(false);
  const [milestoneType, setMilestoneType] = useState<'streak' | 'words_mastered'>('streak');
  const [milestoneValue, setMilestoneValue] = useState(0);

  useEffect(() => {
    const statsParam = searchParams.get('stats');
    if (statsParam) {
      try {
        setStats(JSON.parse(statsParam));
      } catch (error) {
        console.error('Error parsing stats:', error);
      }
    }

    // Fetch user streak and show popup
    const fetchStreak = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('streak_count, last_activity_date, last_shown_streak_milestone, last_shown_words_milestone')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setCurrentStreak(profile.streak_count || 0);
        
        // Check if this is the first quiz of the day
        const today = new Date().toISOString().split('T')[0];
        const lastActivity = profile.last_activity_date;
        
        if (lastActivity !== today && profile.streak_count > 0) {
          // Show streak popup after a short delay
          setTimeout(() => setShowStreakPopup(true), 500);

          // Check for streak milestones
          const streakMilestones = [7, 14, 21, 30, 60, 90];
          const lastShownStreak = profile.last_shown_streak_milestone || 0;
          
          for (const milestone of streakMilestones) {
            if (profile.streak_count >= milestone && lastShownStreak < milestone) {
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
        }

        // Check for words mastered milestones
        const { count } = await supabase
          .from('user_progress')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_mastered', true);

        if (count !== null && count > 0) {
          const wordsMilestones = [50, 100, 250, 500, 1000];
          const lastShownWords = profile.last_shown_words_milestone || 0;
          
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
      }
    };

    fetchStreak();

    // Load reviewed words from session storage
    const loadReviewedWords = async () => {
      const reviewSessionStr = sessionStorage.getItem('reviewSession');
      if (!reviewSessionStr) return;

      try {
        const session = JSON.parse(reviewSessionStr);
        setReviewWords(session.words || []);

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
        console.error('Error loading reviewed words:', error);
      }
    };

    loadReviewedWords();
  }, [searchParams]);

  const total = stats.again + stats.hard + stats.good + stats.easy;

  const getProgressPercentage = (wordId: string) => {
    const progress = wordProgress[wordId];
    if (!progress) return 0;
    // For Smart Quiz (SRS), calculate progress based on repetitions and ease factor
    // Mastered at 7+ repetitions and ease factor >= 2.5
    if (progress.is_mastered) return 100;
    return Math.min((progress.repetitions / 7) * 100, 99);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-12"
        >
          {/* Trophy Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center"
          >
            <Trophy className="w-12 h-12 text-green-600 dark:text-green-400" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-gray-900 dark:text-white text-center mb-4"
          >
            Review Complete! 🎉
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 dark:text-gray-400 text-center mb-8"
          >
            Great job! You reviewed {total} word{total !== 1 ? 's' : ''} today.
          </motion.p>

          {/* Overall Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8"
          >
            <div className="text-center">
              <div className="text-7xl font-bold text-green-600 dark:text-green-400 mb-2">
                {total}
              </div>
              <div className="text-xl text-gray-700 dark:text-gray-300">
                words reviewed today
              </div>
            </div>
          </motion.div>

          {/* Words Reviewed Section */}
          {reviewWords.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <button
                onClick={() => setShowWordsList(!showWordsList)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl hover:from-green-100 hover:to-blue-100 dark:hover:from-green-900/30 dark:hover:to-blue-900/30 transition-all"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  Words Reviewed in This Quiz ({reviewWords.length})
                </span>
                {showWordsList ? (
                  <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {showWordsList && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-3 max-h-96 overflow-y-auto scrollbar-hide"
                >
                  {reviewWords.map((word, index) => {
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
            className="grid grid-cols-2 gap-4"
          >
            <Link
              href="/"
              className="flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Home className="w-5 h-5" />
              Home
            </Link>
            <button
              onClick={() => router.push('/review')}
              className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Review More
            </button>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
          >
            <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
              Words will appear again based on your ratings. Keep reviewing daily for best results!
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Word Details Modal */}
      {selectedWord && (
        <WordDetailsCard
          word={selectedWord}
          isOpen={!!selectedWord}
          onClose={() => setSelectedWord(null)}
        />
      )}

      {/* Streak Popup */}
      <StreakPopup
        isOpen={showStreakPopup}
        streakCount={currentStreak}
        onClose={() => setShowStreakPopup(false)}
      />

      {/* Milestone Popup */}
      <MilestonePopup
        isOpen={showMilestonePopup}
        type={milestoneType}
        milestone={milestoneValue}
        onClose={() => setShowMilestonePopup(false)}
      />
    </div>
  );
}

export default function ReviewCompletePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <ReviewComplete />
    </Suspense>
  );
}
