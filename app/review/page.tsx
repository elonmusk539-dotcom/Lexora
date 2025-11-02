'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import { Volume2, ArrowLeft, RotateCcw } from 'lucide-react';
import { WordDetailsCard } from '@/components/WordDetailsCard';

interface Word {
  id: string;
  kanji?: string | null;
  furigana?: string | null;
  romaji?: string | null;
  word: string;
  meaning: string;
  image_url: string;
  pronunciation_url: string;
  examples: string[];
}

interface ReviewSession {
  words: Word[];
  currentIndex: number;
  showAnswer: boolean;
  sessionStats: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
}

function SRSReview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<ReviewSession>({
    words: [],
    currentIndex: 0,
    showAnswer: false,
    sessionStats: { again: 0, hard: 0, good: 0, easy: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [settings, setSettings] = useState({
    showFuriganaOnFront: false,
    showRomajiOnFront: false,
    showImageOnFront: true,
    showImageOnBack: true,
    showExamples: true,
    numberOfExamples: 3,
  });
  const [wordProgress, setWordProgress] = useState<Record<string, { interval: number; easeFactor: number; repetitions: number }>>({});

  useEffect(() => {
    checkUserAndLoadDueWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUserAndLoadDueWords = async () => {
    try {
      const { data: { session: userSession } } = await supabase.auth.getSession();
      if (!userSession) {
        router.push('/login');
        return;
      }

      // Load user settings
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('settings')
        .eq('user_id', userSession.user.id)
        .single();

      if (profile?.settings?.smartQuiz) {
        setSettings({
          showFuriganaOnFront: profile.settings.smartQuiz.showFuriganaOnFront ?? false,
          showRomajiOnFront: profile.settings.smartQuiz.showRomajiOnFront ?? false,
          showImageOnFront: profile.settings.smartQuiz.showImageOnFront ?? true,
          showImageOnBack: profile.settings.smartQuiz.showImageOnBack ?? true,
          showExamples: profile.settings.smartQuiz.showExamples ?? true,
          numberOfExamples: profile.settings.smartQuiz.numberOfExamples ?? 3,
        });
      }

      // Get query parameters
      const duration = parseInt(searchParams.get('duration') || '20');
      const listIds = searchParams.get('lists')?.split(',').filter(Boolean) || [];

      await loadDueWords(userSession.user.id, duration, listIds);
    } catch (error) {
      console.error('Error loading due words:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate next review interval based on SM-2 algorithm
  const calculateNextInterval = (quality: number, currentWordId: string): number => {
    const progress = wordProgress[currentWordId] || { interval: 0, easeFactor: 2.5, repetitions: 0 };
    
    let newInterval = 1; // Default 1 day
    let newEaseFactor = progress.easeFactor;
    let newRepetitions = progress.repetitions;

    if (quality >= 3) {
      // Good or Easy
      if (newRepetitions === 0) {
        newInterval = 1;
      } else if (newRepetitions === 1) {
        newInterval = quality === 5 ? 4 : 3; // Easy: 4 days, Good: 3 days
      } else {
        newInterval = Math.round(progress.interval * progress.easeFactor);
        if (quality === 5) newInterval = Math.round(newInterval * 1.3); // Easy gets longer
      }
      newRepetitions += 1;
      newEaseFactor = Math.max(1.3, progress.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    } else {
      // Again or Hard
      newRepetitions = 0;
      newInterval = quality === 1 ? 1 : 1; // Hard: 1 day, Again: 1 day
      newEaseFactor = Math.max(1.3, progress.easeFactor - 0.2);
    }

    return newInterval;
  };

  const formatInterval = (days: number): string => {
    if (days < 1) return '<1d';
    if (days === 1) return '1d';
    if (days < 30) return `${days}d`;
    if (days < 365) {
      const months = Math.round(days / 30);
      return `${months}mo`;
    }
    const years = Math.round(days / 365);
    return `${years}y`;
  };

  const loadDueWords = async (userId: string, duration: number, selectedListIds: string[]) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // First, get due words from selected lists (exclude mastered)
      const { data: dueProgressData } = await supabase
        .from('user_progress')
        .select('word_id')
        .eq('user_id', userId)
        .eq('is_mastered', false)
        .lte('next_review_date', today);

      const dueWordIds = dueProgressData?.map(p => p.word_id) || [];

      // Get due words from selected lists
      let dueWordsFromLists: Word[] = [];
      if (dueWordIds.length > 0 && selectedListIds.length > 0) {
        const { data: dueWords } = await supabase
          .from('vocabulary_words')
          .select('*')
          .in('id', dueWordIds)
          .or(selectedListIds.map(id => `list_id.eq.${id}`).join(','));

        dueWordsFromLists = dueWords || [];
      }

      // If we need more words (and quiz length isn't met by due words alone), get new words from selected lists
      const remaining = Math.max(0, duration - dueWordsFromLists.length);
      let newWords: Word[] = [];

      if (remaining > 0 && selectedListIds.length > 0) {
        // Get words that don't have progress yet or have future review dates (and not mastered)
        const { data: newProgressData } = await supabase
          .from('user_progress')
          .select('word_id')
          .eq('user_id', userId)
          .eq('is_mastered', false)
          .or(`next_review_date.is.null,next_review_date.gt.${today}`);

        const newOrFutureWordIds = newProgressData?.map(p => p.word_id) || [];

        // Also get word IDs that have NO progress record at all
        const { data: allWordsInLists } = await supabase
          .from('vocabulary_words')
          .select('id')
          .or(selectedListIds.map(id => `list_id.eq.${id}`).join(','));

        const allWordIdsInLists = allWordsInLists?.map(w => w.id) || [];
        
        // Get all progress for this user
        const { data: allProgress } = await supabase
          .from('user_progress')
          .select('word_id')
          .eq('user_id', userId);

        const wordIdsWithProgress = new Set(allProgress?.map(p => p.word_id) || []);
        const wordIdsWithoutProgress = allWordIdsInLists.filter(id => !wordIdsWithProgress.has(id));

        // Combine: words without progress + words with non-mastered progress
        const availableWordIds = [...new Set([...wordIdsWithoutProgress, ...newOrFutureWordIds])];

        // Get new words from selected lists
        let query = supabase
          .from('vocabulary_words')
          .select('*')
          .or(selectedListIds.map(id => `list_id.eq.${id}`).join(','))
          .limit(remaining);

        // Exclude already included due words
        if (dueWordsFromLists.length > 0) {
          query = query.not('id', 'in', `(${dueWordsFromLists.map(w => w.id).join(',')})`);
        }

        // Only include available (non-mastered) words
        if (availableWordIds.length > 0) {
          query = query.in('id', availableWordIds);
        }

        const { data: newWordsData } = await query;
        newWords = newWordsData || [];
      }

      // Combine: due words first, then new words
      const allWords = [...dueWordsFromLists, ...newWords];

      if (allWords.length === 0) {
        // No words available
        return;
      }

      // Debug: Check if examples are in the data
      console.log('Smart Quiz - Sample word data:', allWords[0]);
      console.log('Smart Quiz - Examples for first word:', allWords[0]?.examples);

      // Shuffle to make it less predictable
      const shuffled = allWords.sort(() => Math.random() - 0.5);
      setSession(prev => ({ ...prev, words: shuffled }));

      // Fetch progress data for all words
      const wordIds = shuffled.map(w => w.id);
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('word_id, interval, ease_factor, repetitions')
        .eq('user_id', userId)
        .in('word_id', wordIds);

      const progressMap: Record<string, { interval: number; easeFactor: number; repetitions: number }> = {};
      (progressData || []).forEach((p: { word_id: string; interval: number; ease_factor: number; repetitions: number }) => {
        progressMap[p.word_id] = {
          interval: p.interval || 0,
          easeFactor: p.ease_factor || 2.5,
          repetitions: p.repetitions || 0,
        };
      });
      setWordProgress(progressMap);
    } catch (error) {
      console.error('Error loading due words:', error);
    }
  };

  const handleRating = async (quality: number) => {
    if (submitting) return;

    setSubmitting(true);
    const currentWord = session.words[session.currentIndex];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update SRS progress
      await supabase.rpc('update_srs_progress', {
        p_user_id: user.id,
        p_word_id: currentWord.id,
        p_quality: quality,
      });

      // Update session stats
      // Map quality (0, 1, 3, 5) to stat keys (again, hard, good, easy)
      const qualityToStat: { [key: number]: keyof typeof session.sessionStats } = {
        0: 'again',
        1: 'hard',
        3: 'good',
        5: 'easy',
      };
      const statKey = qualityToStat[quality];
      
      // Calculate updated stats immediately
      const updatedStats = {
        ...session.sessionStats,
        [statKey]: session.sessionStats[statKey] + 1,
      };
      
      setSession(prev => ({
        ...prev,
        sessionStats: updatedStats,
      }));

      // Move to next word or finish
      if (session.currentIndex < session.words.length - 1) {
        setTimeout(() => {
          setSession(prev => ({
            ...prev,
            currentIndex: prev.currentIndex + 1,
            showAnswer: false,
          }));
          setSubmitting(false);
        }, 300);
      } else {
        // Finish review session
        // Update streak and log activity
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Update user streak
            await supabase.rpc('update_user_streak', { p_user_id: user.id });
            
            // Log quiz activity
            const today = new Date().toISOString().split('T')[0];
            await supabase.from('user_activity_log').insert({
              user_id: user.id,
              activity_date: today,
              activity_type: 'quiz_completed',
          details: { 
            quiz_type: 'smart_quiz',
            words_reviewed: session.words.length,
            stats: updatedStats,
          }
        });            // Store session data for results page
            const reviewSession = {
              words: session.words.map(w => ({
                id: w.id,
                word: w.kanji || w.word,
                meaning: w.meaning,
                kanji: w.kanji,
                furigana: w.furigana,
                romaji: w.romaji,
                image_url: w.image_url,
                pronunciation_url: w.pronunciation_url,
                examples: w.examples,
              })),
              timestamp: Date.now(),
            };
            sessionStorage.setItem('reviewSession', JSON.stringify(reviewSession));
          }
        } catch (error) {
          console.error('Error updating streak:', error);
        }

        router.push('/review/complete?stats=' + encodeURIComponent(JSON.stringify(updatedStats)));
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      setSubmitting(false);
    }
  };

  const playPronunciation = () => {
    const word = session.words[session.currentIndex];
    if (word.pronunciation_url) {
      const audio = new Audio(word.pronunciation_url);
      audio.play();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (session.words.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <RotateCcw className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              All Caught Up!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              You have no words due for review right now. Great job staying on top of your studies!
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Back to Home
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentWord = session.words[session.currentIndex];
  const progress = ((session.currentIndex + 1) / session.words.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {session.currentIndex + 1} / {session.words.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Review Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={session.currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-8 mb-6 relative"
          >
            {/* Show Details Button - moved to avoid overlap */}
            <button
              onClick={() => setSelectedWord(currentWord)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors z-10 shadow-md"
            >
              Show Details
            </button>

            {/* Word Image - Front */}
            {!session.showAnswer && settings.showImageOnFront && (
              <div className="relative w-full aspect-square max-w-xs mx-auto rounded-xl overflow-hidden mb-6 bg-gray-100 dark:bg-gray-700">
                <img
                  src={currentWord.image_url}
                  alt={currentWord.word}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Word Info */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                  {currentWord.kanji || currentWord.word}
                </h2>
                <button
                  onClick={playPronunciation}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Volume2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </button>
              </div>
              
              {((session.showAnswer && currentWord.furigana) || (!session.showAnswer && settings.showFuriganaOnFront && currentWord.furigana)) && (
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
                  {currentWord.furigana}
                </p>
              )}
              
              {((session.showAnswer && currentWord.romaji) || (!session.showAnswer && settings.showRomajiOnFront && currentWord.romaji)) && (
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
                  {currentWord.romaji}
                </p>
              )}
            </div>

            {/* Show Answer Button / Answer */}
            {!session.showAnswer ? (
              <button
                onClick={() => setSession(prev => ({ ...prev, showAnswer: true }))}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors"
              >
                Show Answer
              </button>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 text-center"
                >
                  {/* Word Image - Back (moved to top) */}
                  {settings.showImageOnBack && (
                    <div className="relative w-full aspect-square max-w-xs mx-auto rounded-xl overflow-hidden mb-6 bg-gray-100 dark:bg-gray-700">
                      <img
                        src={currentWord.image_url}
                        alt={currentWord.word}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Meaning */}
                  <div className="text-3xl font-semibold text-blue-600 dark:text-blue-400 mb-6">
                    {currentWord.meaning}
                  </div>
                  
                  {/* Examples */}
                  {settings.showExamples && currentWord.examples && currentWord.examples.length > 0 && (
                    <div className="space-y-4">
                      {currentWord.examples.slice(0, settings.numberOfExamples).map((example, index) => {
                        const parts = example.split('|');
                        return (
                          <div key={index} className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-gray-200 mb-1">{parts[0]}</div>
                            {parts[3] && <div className="text-sm text-blue-600 dark:text-blue-400">{parts[3]}</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>

                {/* Rating Buttons */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  <button
                    onClick={() => handleRating(0)}
                    disabled={submitting}
                    className="py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                  >
                    Again
                    <div className="text-[10px] sm:text-xs opacity-75">{formatInterval(calculateNextInterval(0, currentWord.id))}</div>
                  </button>
                  <button
                    onClick={() => handleRating(1)}
                    disabled={submitting}
                    className="py-2.5 sm:py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                  >
                    Hard
                    <div className="text-[10px] sm:text-xs opacity-75">{formatInterval(calculateNextInterval(1, currentWord.id))}</div>
                  </button>
                  <button
                    onClick={() => handleRating(3)}
                    disabled={submitting}
                    className="py-2.5 sm:py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                  >
                    Good
                    <div className="text-[10px] sm:text-xs opacity-75">{formatInterval(calculateNextInterval(3, currentWord.id))}</div>
                  </button>
                  <button
                    onClick={() => handleRating(5)}
                    disabled={submitting}
                    className="py-2.5 sm:py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                  >
                    Easy
                    <div className="text-[10px] sm:text-xs opacity-75">{formatInterval(calculateNextInterval(5, currentWord.id))}</div>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

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

export default function SRSReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <SRSReview />
    </Suspense>
  );
}
