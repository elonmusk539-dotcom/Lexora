'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Volume2, X, Check } from 'lucide-react';
import type { Word } from '@/components/WordDetailsCard';

interface QuizWord extends Word {
  options: string[];
  correctAnswer: string;
}

interface UserSettings {
  mcq: {
    showFurigana: boolean;
    showRomaji: boolean;
  };
}

function MCQQuiz() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duration = parseInt(searchParams.get('duration') || '10');
  const listIdsParam = searchParams.get('lists');

  const [words, setWords] = useState<QuizWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState<{ correct: number; incorrect: number }>({ correct: 0, incorrect: 0 });
  const [answers, setAnswers] = useState<Array<{ wordId: string; correct: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [settings, setSettings] = useState<UserSettings | null>(null);

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
        
        const processedCustomWords = (userCustomWords || []).map((item: CustomWordItem) => {
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
        allWords = [
          ...(defaultWords || []),
          ...(customListWords || []).map((item: ListWordItem) => item.vocabulary_words),
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

        const masteredWordIds = new Set((masteredProgress || []).map((p: { word_id: string }) => p.word_id));
        availableWords = allWords.filter(w => !masteredWordIds.has(w.id));
      }

      if (availableWords.length === 0) {
        alert('All words are mastered! No words available for quiz.');
        router.push('/');
        return;
      }

      // Shuffle and take requested number of words
      const shuffled = [...availableWords].sort(() => Math.random() - 0.5);
      const selectedWords = shuffled.slice(0, Math.min(duration, shuffled.length));

      // Generate options for each word
      const quizWords: QuizWord[] = selectedWords.map((word) => {
        const wrongOptions = availableWords
          .filter((w) => w.id !== word.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((w) => w.meaning);

        const options = [...wrongOptions, word.meaning].sort(() => Math.random() - 0.5);

        return {
          ...word,
          options,
          correctAnswer: word.meaning,
        };
      });

      setWords(quizWords);
    } catch (error) {
      console.error('Error fetching words:', error);
      alert('Error loading quiz');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if (showResult) return;

    setSelectedAnswer(answer);
    setShowResult(true);

    const currentWord = words[currentIndex];
    const isCorrect = answer === currentWord.correctAnswer;

    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));

    setAnswers((prev) => [...prev, { wordId: currentWord.id, correct: isCorrect }]);
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
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
            quiz_type: 'mcq',
            score: score.correct,
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

    // Navigate to results page
    router.push(`/quiz/results?correct=${score.correct}&total=${words.length}&streak=${updatedStreak}`);
    
    // Update progress in background
    for (const answer of answers) {
      updateWordProgress(answer.wordId, answer.correct).catch(console.error);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4 md:p-6">
      <div className="max-w-3xl mx-auto py-4 sm:py-6 md:py-8">
        {/* Progress bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 gap-1 sm:gap-0">
            <span>Question {currentIndex + 1} of {words.length}</span>
            <div className="flex gap-3 sm:gap-4">
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

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8"
          >
            {/* Word */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">{currentWord.kanji || currentWord.word}</h2>
                <button
                  onClick={playPronunciation}
                  className="p-2 sm:p-3 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                  aria-label="Play pronunciation"
                >
                  <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              {/* Conditionally show furigana based on settings */}
              {settings?.mcq?.showFurigana && currentWord.furigana && (
                <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-1">{currentWord.furigana}</p>
              )}
              {/* Conditionally show romaji based on settings */}
              {settings?.mcq?.showRomaji && (currentWord.romaji || currentWord.reading) && (
                <p className="text-base sm:text-lg md:text-xl text-gray-500 dark:text-gray-500">{currentWord.romaji || currentWord.reading}</p>
              )}
            </div>

            {/* Question */}
            <p className="text-center text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
              What does this word mean?
            </p>

            {/* Options */}
            <div className="grid gap-2 sm:gap-3">
              {currentWord.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentWord.correctAnswer;
                const showCorrect = showResult && isCorrect;
                const showIncorrect = showResult && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={index}
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(option)}
                    disabled={showResult}
                    className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                      showCorrect
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : showIncorrect
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500'
                    }`}
                  >
                    <span className={`text-sm sm:text-base font-medium ${
                      showCorrect ? 'text-green-700 dark:text-green-400' : showIncorrect ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {option}
                    </span>
                    {showCorrect && <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400 flex-shrink-0" />}
                    {showIncorrect && <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400 flex-shrink-0" />}
                  </motion.button>
                );
              })}
            </div>

            {/* Next button */}
            {showResult && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleNext}
                className="w-full mt-4 sm:mt-6 py-3 bg-blue-600 text-white rounded-xl text-sm sm:text-base font-semibold hover:bg-blue-700 transition-colors"
              >
                {currentIndex < words.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function MCQQuizPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <MCQQuiz />
    </Suspense>
  );
}
