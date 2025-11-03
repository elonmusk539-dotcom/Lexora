'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, Suspense } from 'react';
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
      let allWords: Word[] = [];

      if (listIdsParam) {
        const listIds = listIdsParam.split(',');
        
        // Fetch from default vocabulary lists
        const { data: defaultWords } = await supabase
          .from('vocabulary_words')
          .select('*')
          .in('list_id', listIds);

        // Fetch regular words from custom lists
        const { data: customListWords } = await supabase
          .from('user_custom_list_words')
          .select(`
            word_id,
            vocabulary_words (*)
          `)
          .in('list_id', listIds);

        // Fetch user-created custom words from custom lists
        const { data: userCustomWords } = await supabase
          .from('user_custom_list_custom_words')
          .select(`
            custom_word_id,
            user_custom_words (*)
          `)
          .in('list_id', listIds);

        // Process user custom words to match vocabulary_words structure
        interface CustomWordItem {
          custom_word_id: string;
          user_custom_words: {
            id: string;
            kanji: string;
            furigana: string | null;
            romaji: string | null;
            meaning: string;
            pronunciation_url: string;
            image_url: string;
            examples: Array<{ kanji: string; furigana: string; romaji: string; translation: string }> | null;
            [key: string]: unknown;
          };
        }
        
  const customWordItems = (userCustomWords ?? []) as unknown as CustomWordItem[];
  const processedCustomWords = customWordItems.map((item) => {
          const word = item.user_custom_words;
          return {
            ...word,
            word: word.kanji,
            reading: word.romaji,
            // Convert JSONB examples to string array format
            examples: word.examples ? 
              word.examples.map((ex) => 
                `${ex.kanji}|${ex.furigana}|${ex.romaji}|${ex.translation}`
              ) : []
          } as Word;
        });

        interface ListWordItem {
          word_id: string;
          vocabulary_words: Word;
        }

        // Combine all words
        const listWordItems = (customListWords ?? []) as unknown as ListWordItem[];

        allWords = [
          ...((defaultWords ?? []) as Word[]),
          ...listWordItems.map((item) => item.vocabulary_words),
          ...processedCustomWords
        ].filter((word): word is Word => word != null);
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

      // Exclude mastered words
      const { data: { user } } = await supabase.auth.getUser();
      let availableWords = allWords;
      
      if (user) {
        const { data: masteredProgress } = await supabase
          .from('user_progress')
          .select('word_id')
          .eq('user_id', user.id)
          .eq('is_mastered', true);

        const masteredWordIds = new Set(masteredProgress?.map(p => p.word_id) || []);
        availableWords = allWords.filter(w => !masteredWordIds.has(w.id));
      }

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
    if (isAnswering) return; // Prevent double-clicking
    setIsAnswering(true);

    const currentWord = words[currentIndex];

    // Update score
    const newScore = {
      correct: score.correct + (correct ? 1 : 0),
      incorrect: score.incorrect + (correct ? 0 : 1),
    };
    setScore(newScore);

    // Update progress immediately
    await updateWordProgress(currentWord.id, correct);

    // Move to next card
    if (currentIndex < words.length - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        setShowAnswer(false);
        setIsAnswering(false);
      }, 100);
    } else {
      // Pass the updated score to finishQuiz
      finishQuiz(newScore);
    }
  };

  const finishQuiz = async (finalScore = score) => {
    // Update streak
    let updatedStreak = 0;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Update user streak and get the new streak value
        const { data: streakValue, error: streakError } = await supabase.rpc('update_user_streak', { p_user_id: user.id });
        
        if (streakError) {
          console.error('Error updating streak:', streakError);
        } else {
          updatedStreak = streakValue || 0;
        }
        
        // Log quiz activity
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

    // Store quiz session data in localStorage for results page
    const quizSession = {
      words: words.map(w => ({
        id: w.id,
        word: w.kanji || w.word,
        meaning: w.meaning,
      })),
      timestamp: Date.now(),
    };
    localStorage.setItem('lastQuizSession', JSON.stringify(quizSession));

    router.push(`/quiz/results?correct=${finalScore.correct}&total=${words.length}&streak=${updatedStreak}`);
  };

  const updateWordProgress = async (wordId: string, correct: boolean) => {
    try {
      // Use unified SRS system for progress tracking
      // Map correct/incorrect to quality ratings
      // Correct: quality=3 (Good), Incorrect: quality=0 (Again)
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
            <div className="flex gap-4">
              <span className="text-green-600 dark:text-green-400">{score.correct} correct</span>
              <span className="text-red-600 dark:text-red-400">{score.incorrect} incorrect</span>
            </div>
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
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 h-full flex flex-col items-center justify-center">
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
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 h-full flex flex-col items-center justify-center relative">
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

                  <div className="flex flex-col items-center gap-4">
                    {/* Main Reading - Kanji */}
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
                    
                    {/* Furigana - same size as front */}
                    {currentWord.furigana && (
                      <p className="text-2xl text-gray-600 dark:text-gray-400">{currentWord.furigana}</p>
                    )}
                    
                    {/* Romaji - same size as front */}
                    {(currentWord.romaji || currentWord.reading) && (
                      <p className="text-xl text-gray-500 dark:text-gray-500">{currentWord.romaji || currentWord.reading}</p>
                    )}
                    
                    {/* Meaning - slightly smaller than main reading */}
                    <p className="text-4xl text-gray-900 dark:text-white font-bold text-center px-8 mt-2">
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
