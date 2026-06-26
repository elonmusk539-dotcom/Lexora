'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Volume2, RotateCw, Check, X, ArrowLeft } from 'lucide-react';
import type { Word } from '@/components/WordDetailsCard';
import { WordDetailsCard } from '@/components/WordDetailsCard';
import { playPronunciation } from '@/lib/audio';
import { useAuth } from '@/contexts/AuthContext';

interface UserSettings {
  flashcard?: {
    showFuriganaOnFront?: boolean;
    showRomajiOnFront?: boolean;
  };
}

function FlashcardQuiz() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duration = parseInt(searchParams.get('duration') || '10');
  const listIdsParam = searchParams.get('lists');

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState<{ correct: number; incorrect: number }>({ correct: 0, incorrect: 0 });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    setUserId(user.id);
    loadDataAndInitializeQuiz(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const loadDataAndInitializeQuiz = async (uid: string) => {
    try {
      let allWords: Word[] = [];
      let masteredWordIds = new Set<string>();

      const fetchVocabularyWords = async (listIds?: string[]) => {
        let allWordsList: any[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          let query = supabase
            .from('vocabulary_words')
            .select('*')
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (listIds) {
            query = query.in('list_id', listIds);
          }

          const { data, error } = await query;

          if (error) throw error;
          if (data && data.length > 0) {
            allWordsList = [...allWordsList, ...data];
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              page++;
            }
          } else {
            hasMore = false;
          }
        }
        return allWordsList;
      };

      if (listIdsParam) {
        const listIds = listIdsParam.split(',');
        const [
          profileResult,
          defaultWords,
          customListWordsResult,
          userCustomWordsResult,
          masteredProgressResult
        ] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('settings')
            .eq('user_id', uid)
            .single(),
          fetchVocabularyWords(listIds),
          supabase
            .from('user_custom_list_words')
            .select(`
              word_id,
              vocabulary_words (*)
            `)
            .in('list_id', listIds),
          supabase
            .from('user_custom_list_custom_words')
            .select(`
              custom_word_id,
              user_custom_words (*)
            `)
            .in('list_id', listIds),
          supabase
            .from('user_progress')
            .select('word_id')
            .eq('user_id', uid)
            .eq('is_mastered', true)
        ]);

        if (profileResult.data && profileResult.data.settings) {
          setSettings(profileResult.data.settings as UserSettings);
        }

        // Process custom words
        const processedCustomWords: Word[] = (userCustomWordsResult.data || [])
          .map((item) => {
            const cw = item.user_custom_words as unknown as Record<string, unknown>;
            if (!cw) return null;
            return {
              id: cw.id as string,
              word: (cw.kanji as string) || '',
              reading: (cw.romaji as string) || '',
              meaning: (cw.meaning as string) || '',
              pronunciation_url: (cw.pronunciation_url as string) || '',
              image_url: (cw.image_url as string) || '',
              word_type: 'custom' as const,
              examples: cw.examples ?
                (cw.examples as Array<{ kanji: string; furigana: string; romaji: string; translation: string }>).map((ex) =>
                  `${ex.kanji}|${ex.furigana}|${ex.romaji}|${ex.translation}`
                ) : []
            };
          })
          .filter((w): w is Word => w != null);

        interface ListWordItem {
          word_id: string;
          vocabulary_words: Word;
        }

        const listWordItems = (customListWordsResult.data ?? []) as unknown as ListWordItem[];

        allWords = [
          ...(defaultWords as Word[]),
          ...listWordItems.map((item) => item.vocabulary_words),
          ...processedCustomWords
        ].filter((word): word is Word => word != null);

        masteredWordIds = new Set((masteredProgressResult.data || []).map((p: { word_id: string }) => p.word_id));
      } else {
        const [
          profileResult,
          wordsList,
          masteredProgressResult
        ] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('settings')
            .eq('user_id', uid)
            .single(),
          fetchVocabularyWords(),
          supabase
            .from('user_progress')
            .select('word_id')
            .eq('user_id', uid)
            .eq('is_mastered', true)
        ]);

        if (profileResult.data && profileResult.data.settings) {
          setSettings(profileResult.data.settings as UserSettings);
        }

        allWords = (wordsList || []) as Word[];
        masteredWordIds = new Set((masteredProgressResult.data || []).map((p: { word_id: string }) => p.word_id));
      }

      if (allWords.length === 0) {
        alert('No words available for quiz');
        router.push('/');
        return;
      }

      const availableWords = allWords.filter(w => !masteredWordIds.has(w.id));

      if (availableWords.length === 0) {
        alert('All words are mastered! No words available for quiz.');
        router.push('/');
        return;
      }

      const shuffled = [...availableWords].sort(() => Math.random() - 0.5);
      const selectedWords = shuffled.slice(0, Math.min(duration, shuffled.length));

      setWords(selectedWords as Word[]);
    } catch (error) {
      console.error('Error fetching words:', error);
      alert('Error loading quiz');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!showAnswer) {
      setShowAnswer(true);
    }
  };

  const handleAnswer = async (correct: boolean) => {
    if (isAnswering) return;
    setIsAnswering(true);

    const currentWord = words[currentIndex];

    const newScore = {
      correct: score.correct + (correct ? 1 : 0),
      incorrect: score.incorrect + (correct ? 0 : 1),
    };
    setScore(newScore);

    await updateWordProgress(currentWord.id, correct);

    if (currentIndex < words.length - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        setShowAnswer(false);
        setIsAnswering(false);
      }, 100);
    } else {
      finishQuiz(newScore);
    }
  };

  const finishQuiz = async (finalScore = score) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('user_activity_log').insert({
          user_id: user.id,
          activity_date: today,
          activity_type: 'quiz_completed',
          details: {
            quiz_type: 'flashcard',
            score: finalScore.correct,
            total: words.length
          } as Record<string, unknown>
        });
      }
    } catch (error) {
      console.error('Error in finishQuiz:', error);
    }

    const quizSession = {
      words: words.map(w => ({
        id: w.id,
        word: w.kanji || w.word,
        meaning: w.meaning,
      })),
      timestamp: Date.now(),
    };
    localStorage.setItem('lastQuizSession', JSON.stringify(quizSession));

    router.push(`/quiz/results?correct=${finalScore.correct}&total=${words.length}`);
  };

  const updateWordProgress = async (wordId: string, correct: boolean) => {
    try {
      const quality = correct ? 3 : 0;

      await supabase.rpc('update_srs_progress', {
        p_user_id: userId,
        p_word_id: wordId,
        p_quality: quality,
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handlePlayPronunciation = () => {
    const currentWord = words[currentIndex];
    playPronunciation(currentWord.pronunciation_url);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-primary)]"></div>
      </div>
    );
  }

  if (words.length === 0 && !loading) {
    return null;
  }

  const currentWord = words[currentIndex] || null;
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-mesh p-3 sm:p-4 md:p-6 overflow-hidden flex flex-col" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}>
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col py-2 sm:py-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>

          <div className="text-sm font-medium text-[var(--color-text-muted)]">
            {loading ? '... / ...' : `${currentIndex + 1} / ${words.length}`}
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <div className="flex flex-row justify-between text-xs sm:text-sm text-[var(--color-text-muted)] mb-2">
            <span>Progress</span>
            <div className="flex gap-3 sm:gap-4">
              <span className="text-green-500">{loading ? '...' : score.correct} correct</span>
              <span className="text-coral-500">{loading ? '...' : score.incorrect} incorrect</span>
            </div>
          </div>
          <div className="w-full bg-[var(--color-border)] rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="bg-gradient-to-r from-ocean-600 to-ocean-500 h-2 rounded-full"
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <div className="w-full">
              <div className="card-elevated rounded-2xl p-4 sm:p-6 md:p-8 h-[340px] sm:h-[440px] md:h-[480px] flex flex-col items-center justify-center relative select-none animate-pulse">
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="h-10 bg-[var(--color-border)]/55 rounded-md w-1/3 mb-2" />
                  <div className="h-6 bg-[var(--color-border)]/35 rounded-md w-1/4 mb-1" />
                  <div className="h-5 bg-[var(--color-border)]/30 rounded-md w-1/5 mb-8" />
                  <div className="h-5 bg-[var(--color-border)]/30 rounded-md w-1/3" />
                </div>
              </div>
            </div>
          ) : currentWord ? (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <div
                className="card-elevated rounded-2xl p-4 sm:p-6 md:p-8 h-[340px] sm:h-[440px] md:h-[480px] cursor-pointer flex flex-col items-center justify-center relative select-none"
                onClick={handleFlip}
              >
                {!isFlipped ? (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="flex items-center justify-center gap-3">
                      <h2 className="text-4xl font-bold text-[var(--color-text-primary)]">
                        {currentWord.kanji || currentWord.word}
                      </h2>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayPronunciation();
                        }}
                        className="p-2.5 rounded-full glass hover:bg-ocean-500/10 text-[var(--color-accent-primary)] transition-colors"
                        aria-label="Play pronunciation"
                      >
                        <Volume2 className="w-6 h-6" />
                      </button>
                    </div>

                    {settings?.flashcard?.showFuriganaOnFront && currentWord.furigana && (
                      <p className="text-xl text-[var(--color-text-secondary)]">{currentWord.furigana}</p>
                    )}

                    {settings?.flashcard?.showRomajiOnFront && (currentWord.romaji || currentWord.reading) && (
                      <p className="text-xl text-[var(--color-text-muted)]">{currentWord.romaji || currentWord.reading}</p>
                    )}

                    <div className="flex items-center gap-2 text-[var(--color-text-muted)] mt-8">
                      <RotateCw className="w-5 h-5" />
                      <p className="text-sm font-medium">Click to reveal answer</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 w-full h-full justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWord(currentWord);
                      }}
                      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gradient-to-r from-ocean-600 to-ocean-500 text-white rounded-full hover:from-ocean-700 hover:to-ocean-600 transition-all shadow-glow font-bold font-sans"
                      aria-label="Show Details"
                    >
                      i
                    </button>

                    <div className="flex flex-col items-center gap-4 w-full">
                      <div className="flex items-center justify-center gap-3">
                        <h2 className="text-4xl font-bold text-[var(--color-text-primary)]">
                          {currentWord.kanji || currentWord.word}
                        </h2>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayPronunciation();
                          }}
                          className="p-2.5 rounded-full glass hover:bg-ocean-500/10 text-[var(--color-accent-primary)] transition-colors"
                          aria-label="Play pronunciation"
                        >
                          <Volume2 className="w-6 h-6" />
                        </button>
                      </div>

                      {currentWord.furigana && (
                        <p className="text-xl text-[var(--color-text-secondary)]">{currentWord.furigana}</p>
                      )}

                      {(currentWord.romaji || currentWord.reading) && (
                        <p className="text-xl text-[var(--color-text-muted)]">{currentWord.romaji || currentWord.reading}</p>
                      )}

                      <p className="text-3xl text-[var(--color-accent-primary)] font-semibold text-center px-8 mt-2">
                        {currentWord.meaning}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 grid grid-cols-2 gap-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(false)}
                    className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-coral-600 to-coral-500 text-white rounded-xl font-semibold shadow-glow-coral transition-all"
                  >
                    <X className="w-5 h-5" />
                    Incorrect
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(true)}
                    className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold shadow-lg transition-all"
                  >
                    <Check className="w-5 h-5" />
                    Correct
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

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

export default function FlashcardQuizPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <FlashcardQuiz />
    </Suspense>
  );
}
