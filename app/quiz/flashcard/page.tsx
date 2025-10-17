'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Volume2, RotateCw, Check, X } from 'lucide-react';
import type { Word } from '@/components/WordDetailsCard';
import { WordDetailsCard } from '@/components/WordDetailsCard';

interface UserSettings {
  flashcard?: {
    showFuriganaOnFront?: boolean;
    showRomajiOnFront?: boolean;
  };
}

export default function FlashcardQuizPage() {
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

  useEffect(() => {
    checkUserAndFetchWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUserAndFetchWords = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setUserId(session.user.id);
    
    // Fetch user settings
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('settings')
      .eq('user_id', session.user.id)
      .single();
    
    if (profile && profile.settings) {
      setSettings(profile.settings as UserSettings);
    }
    
    await fetchWords();
  };

  const fetchWords = async () => {
    try {
      let allWords: any[] = [];

      if (listIdsParam) {
        const listIds = listIdsParam.split(',');
        
        // Fetch from default lists
        const { data: defaultWords } = await supabase
          .from('vocabulary_words')
          .select('*')
          .in('list_id', listIds);

        // Fetch from custom lists
        const { data: customListWords } = await supabase
          .from('user_custom_list_words')
          .select(`
            word_id,
            vocabulary_words (*)
          `)
          .in('list_id', listIds);

        // Combine words
        allWords = [
          ...(defaultWords || []),
          ...(customListWords || []).map((item: any) => item.vocabulary_words)
        ].filter(word => word != null);
      } else {
        // Fetch all words if no lists specified
        const { data } = await supabase
          .from('vocabulary_words')
          .select('*');
        allWords = data || [];
      }

      if (allWords.length === 0) {
        alert('No words available for quiz');
        router.push('/');
        return;
      }

      const shuffled = [...allWords].sort(() => Math.random() - 0.5);
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
    const currentWord = words[currentIndex];

    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1),
    }));

    // Update progress immediately
    await updateWordProgress(currentWord.id, correct);

    // Move to next card
    if (currentIndex < words.length - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        setShowAnswer(false);
      }, 500);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    // Update streak
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
            quiz_type: 'flashcard',
            score: score.correct,
            total: words.length
          }
        } as any);
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }

    router.push(`/quiz/results?correct=${score.correct}&total=${words.length}`);
  };

  const updateWordProgress = async (wordId: string, correct: boolean) => {
    try {
      const { data: existing } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('word_id', wordId)
        .maybeSingle();

      if (existing) {
        const newStreak = Math.max(0, existing.correct_streak + (correct ? 1 : -1));
        const isMastered = newStreak >= 7;

        await supabase
          .from('user_progress')
          .update({
            correct_streak: newStreak,
            is_mastered: isMastered,
            last_reviewed: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_progress')
          .insert({
            user_id: userId,
            word_id: wordId,
            correct_streak: correct ? 1 : 0,
            is_mastered: false,
            last_reviewed: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const playPronunciation = () => {
    const currentWord = words[currentIndex];
    const audio = new Audio(currentWord.pronunciation_url);
    audio.play();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (words.length === 0) {
    return null;
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-3xl mx-auto py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Card {currentIndex + 1} of {words.length}</span>
            <span>{score.correct} correct, {score.incorrect} incorrect</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="perspective"
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="relative w-full h-[500px] cursor-pointer preserve-3d"
              onClick={handleFlip}
            >
              {/* Front of card */}
              <div className="absolute inset-0 backface-hidden">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 h-full flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    {/* Main reading - always show kanji if available, fallback to word */}
                    <div className="flex items-center gap-3">
                      <h2 className="text-6xl font-bold text-gray-900 dark:text-white">
                        {currentWord.kanji || currentWord.word}
                      </h2>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playPronunciation();
                        }}
                        className="p-3 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                        aria-label="Play pronunciation"
                      >
                        <Volume2 className="w-7 h-7" />
                      </button>
                    </div>
                    
                    {/* Conditionally show furigana based on settings */}
                    {settings?.flashcard?.showFuriganaOnFront && currentWord.furigana && (
                      <p className="text-2xl text-gray-600 dark:text-gray-400">{currentWord.furigana}</p>
                    )}
                    
                    {/* Conditionally show romaji based on settings */}
                    {settings?.flashcard?.showRomajiOnFront && (currentWord.romaji || currentWord.reading) && (
                      <p className="text-xl text-gray-500 dark:text-gray-500">{currentWord.romaji || currentWord.reading}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-8">
                    <RotateCw className="w-5 h-5" />
                    <p>Click to reveal answer</p>
                  </div>
                </div>
              </div>

              {/* Back of card - show reading, furigana, romaji, meaning, pronunciation */}
              <div className="absolute inset-0 backface-hidden rotate-y-180">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 h-full flex flex-col items-center justify-center relative">
                  {/* Show Details Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWord(currentWord);
                    }}
                    className="absolute top-4 right-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Show Details
                  </button>

                  <div className="flex flex-col items-center gap-6">
                    {/* Main Reading - Kanji */}
                    <div className="flex items-center gap-3">
                      <h3 className="text-6xl font-bold text-gray-900 dark:text-white">
                        {currentWord.kanji || currentWord.word}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playPronunciation();
                        }}
                        className="p-3 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                        aria-label="Play pronunciation"
                      >
                        <Volume2 className="w-7 h-7" />
                      </button>
                    </div>
                    
                    {/* Furigana and Romaji together */}
                    {(currentWord.furigana || currentWord.romaji || currentWord.reading) && (
                      <p className="text-3xl text-gray-600 dark:text-gray-400">
                        {currentWord.furigana}
                        {currentWord.furigana && (currentWord.romaji || currentWord.reading) && ' '}
                        {(currentWord.romaji || currentWord.reading) && `(${currentWord.romaji || currentWord.reading})`}
                      </p>
                    )}
                    
                    {/* Meaning */}
                    <p className="text-3xl text-blue-600 dark:text-blue-400 font-semibold text-center px-8">
                      {currentWord.meaning}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Answer buttons */}
            {showAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 grid grid-cols-2 gap-4"
              >
                <button
                  onClick={() => handleAnswer(false)}
                  className="flex items-center justify-center gap-2 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                  Incorrect
                </button>
                <button
                  onClick={() => handleAnswer(true)}
                  className="flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  <Check className="w-5 h-5" />
                  Correct
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Word Details Card Modal */}
      {selectedWord && (
        <WordDetailsCard
          word={selectedWord}
          isOpen={!!selectedWord}
          onClose={() => setSelectedWord(null)}
        />
      )}

      <style jsx>{`
        .perspective {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
