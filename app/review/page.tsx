'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
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
        const smartQuizSettings = {
          showFuriganaOnFront: profile.settings.smartQuiz.showFuriganaOnFront ?? false,
          showRomajiOnFront: profile.settings.smartQuiz.showRomajiOnFront ?? false,
          showImageOnFront: profile.settings.smartQuiz.showImageOnFront ?? true,
          showImageOnBack: profile.settings.smartQuiz.showImageOnBack ?? true,
          showExamples: profile.settings.smartQuiz.showExamples ?? true,
          numberOfExamples: profile.settings.smartQuiz.numberOfExamples ?? 3,
        };
        setSettings(smartQuizSettings);
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

    // Quality 0 (Again) or 1 (Hard) - restart
    if (quality < 3) {
      return 1;
    }

    // First review (repetitions === 0)
    if (progress.repetitions === 0) {
      return quality === 5 ? 4 : 3; // Easy: 4 days, Good: 3 days (even for first-time)
    }

    // Second review (repetitions === 1)
    if (progress.repetitions === 1) {
      return quality === 5 ? 6 : 4; // Easy: 6 days, Good: 4 days
    }

    // Subsequent reviews
    const currentInterval = Math.max(1, progress.interval);
    const baseInterval = Math.max(1, Math.round(currentInterval * progress.easeFactor));
    return quality === 5 ? Math.max(1, Math.round(baseInterval * 1.3)) : baseInterval;
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

      // Combine: due words first, then new words, LIMITED to the requested duration
      const allWordsUnlimited = [...dueWordsFromLists, ...newWords];
      const combinedWords = allWordsUnlimited.slice(0, duration);

      if (combinedWords.length === 0) {
        // No words available
        return;
      }

      const combinedWordIds = combinedWords.map((word) => word.id);
      const { data: examplesData, error: examplesError } = await supabase
        .from('vocabulary_examples')
        .select('word_id, kanji, furigana, romaji, translation, order_index')
        .in('word_id', combinedWordIds)
        .order('order_index', { ascending: true });

      if (examplesError) {
        console.error('Error fetching vocabulary examples:', examplesError);
      }

      interface ExampleRow {
        word_id: string;
        kanji: string | null;
        furigana: string | null;
        romaji: string | null;
        translation: string | null;
      }

      const examplesMap = new Map<string, string[]>();
      (examplesData || []).forEach((example: ExampleRow) => {
        const formatted = [
          example.kanji ?? '',
          example.furigana ?? '',
          example.romaji ?? '',
          example.translation ?? '',
        ].join('|');

        const currentExamples = examplesMap.get(example.word_id) || [];
        currentExamples.push(formatted);
        examplesMap.set(example.word_id, currentExamples);
      });

      type SupabaseWord = {
        id: string;
        word: string;
        meaning: string;
        image_url: string;
        pronunciation_url: string;
        kanji?: string | null;
        furigana?: string | null;
        romaji?: string | null;
        reading?: string | null;
      };

      const normalizedWords: Word[] = combinedWords.map((word: SupabaseWord) => ({
        id: word.id,
        kanji: word.kanji ?? word.word,
        furigana: word.furigana ?? null,
        romaji: word.romaji ?? word.reading ?? null,
        word: word.word,
        meaning: word.meaning,
        image_url: word.image_url,
        pronunciation_url: word.pronunciation_url,
        examples: examplesMap.get(word.id) ?? [],
      }));

      // Shuffle to make it less predictable
      const shuffled = [...normalizedWords].sort(() => Math.random() - 0.5);
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
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-primary)]"></div>
      </div>
    );
  }

  if (session.words.length === 0) {
    return (
      <div className="min-h-screen bg-mesh">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-elevated p-12 text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-green-500/10 rounded-2xl flex items-center justify-center">
              <RotateCcw className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">
              All Caught Up!
            </h1>
            <p className="text-[var(--color-text-muted)] mb-8">
              You have no words due for review right now. Great job staying on top of your studies!
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 btn-primary font-semibold"
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
    <div className="min-h-screen bg-mesh">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>

          <div className="text-sm font-medium text-[var(--color-text-muted)]">
            {session.currentIndex + 1} / {session.words.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-ocean-600 to-ocean-500"
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
            className="card-elevated p-4 sm:p-8 mb-6 relative"
          >
            {/* Show Details Button - moved to avoid overlap */}
            <button
              onClick={() => setSelectedWord(currentWord)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-ocean-600 to-ocean-500 text-white rounded-lg hover:from-ocean-700 hover:to-ocean-600 transition-all z-10 shadow-glow"
            >
              Show Details
            </button>

            {/* Word Image */}
            {currentWord.image_url && (
              ((!session.showAnswer && settings.showImageOnFront) ||
                (session.showAnswer && settings.showImageOnBack)) && (
                <div className="relative w-full aspect-square max-w-xs mx-auto rounded-xl overflow-hidden mt-10 mb-6 glass">
                  <Image
                    src={currentWord.image_url}
                    alt={currentWord.word}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 300px"
                    unoptimized
                  />
                </div>
              )
            )}

            {/* Word Info */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <h2 className="text-4xl font-bold text-[var(--color-text-primary)]">
                  {currentWord.kanji || currentWord.word}
                </h2>
                <button
                  onClick={playPronunciation}
                  className="p-2 rounded-full glass hover:bg-ocean-500/10 transition-colors"
                >
                  <Volume2 className="w-6 h-6 text-[var(--color-accent-primary)]" />
                </button>
              </div>

              {((session.showAnswer && currentWord.furigana) || (!session.showAnswer && settings.showFuriganaOnFront && currentWord.furigana)) && (
                <p className="text-xl text-[var(--color-text-secondary)] mb-2">
                  {currentWord.furigana}
                </p>
              )}

              {((session.showAnswer && currentWord.romaji) || (!session.showAnswer && settings.showRomajiOnFront && currentWord.romaji)) && (
                <p className="text-xl text-[var(--color-text-muted)] mb-2">
                  {currentWord.romaji}
                </p>
              )}
            </div>

            {/* Show Answer Button / Answer */}
            {!session.showAnswer ? (
              <button
                onClick={() => setSession(prev => ({ ...prev, showAnswer: true }))}
                className="w-full py-4 bg-gradient-to-r from-ocean-600 to-ocean-500 text-white rounded-xl font-semibold text-lg hover:from-ocean-700 hover:to-ocean-600 transition-all shadow-glow"
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
                  {/* Meaning */}
                  <div className="text-3xl font-semibold text-[var(--color-accent-primary)] mb-6">
                    {currentWord.meaning}
                  </div>

                  {/* Examples */}
                  {settings.showExamples && currentWord.examples && currentWord.examples.length > 0 ? (
                    <div className="space-y-4 mt-6">
                      <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Examples:</div>
                      {currentWord.examples.slice(0, settings.numberOfExamples).map((example, index) => {
                        const [kanji = '', furigana = '', romaji = '', translation = ''] = example.split('|');
                        return (
                          <div key={index} className="glass rounded-lg p-3 text-left space-y-1">
                            {kanji && (
                              <div className="font-medium text-[var(--color-text-primary)]">{kanji}</div>
                            )}
                            {furigana && (
                              <div className="text-sm text-[var(--color-text-secondary)]">{furigana}</div>
                            )}
                            {romaji && (
                              <div className="text-sm text-[var(--color-text-muted)]">{romaji}</div>
                            )}
                            {translation && (
                              <div className="text-sm text-[var(--color-accent-primary)]">{translation}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-[var(--color-text-muted)] mt-4">
                      {!settings.showExamples && '(Examples hidden in settings)'}
                      {settings.showExamples && (!currentWord.examples || currentWord.examples.length === 0) && '(No examples available for this word)'}
                    </div>
                  )}
                </motion.div>

                {/* Rating Buttons */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRating(0)}
                    disabled={submitting}
                    className="py-2.5 sm:py-3 bg-gradient-to-r from-coral-600 to-coral-500 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all shadow-glow-coral text-sm sm:text-base"
                  >
                    Again
                    <div className="text-[10px] sm:text-xs opacity-75">{formatInterval(calculateNextInterval(0, currentWord.id))}</div>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRating(1)}
                    disabled={submitting}
                    className="py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-amber-400 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all text-sm sm:text-base"
                  >
                    Hard
                    <div className="text-[10px] sm:text-xs opacity-75">{formatInterval(calculateNextInterval(1, currentWord.id))}</div>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRating(3)}
                    disabled={submitting}
                    className="py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-green-500 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all text-sm sm:text-base"
                  >
                    Good
                    <div className="text-[10px] sm:text-xs opacity-75">{formatInterval(calculateNextInterval(3, currentWord.id))}</div>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRating(5)}
                    disabled={submitting}
                    className="py-2.5 sm:py-3 bg-gradient-to-r from-ocean-600 to-ocean-500 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all shadow-glow text-sm sm:text-base"
                  >
                    Easy
                    <div className="text-[10px] sm:text-xs opacity-75">{formatInterval(calculateNextInterval(5, currentWord.id))}</div>
                  </motion.button>
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
