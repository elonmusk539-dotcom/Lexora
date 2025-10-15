'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Volume2, X, Check } from 'lucide-react';
import type { Word } from '@/components/WordDetailsCard';

interface QuizWord extends Word {
  options: string[];
  correctAnswer: string;
}

export default function MCQQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duration = parseInt(searchParams.get('duration') || '10');
  const listId = searchParams.get('listId');

  const [words, setWords] = useState<QuizWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState<{ correct: number; incorrect: number }>({ correct: 0, incorrect: 0 });
  const [answers, setAnswers] = useState<Array<{ wordId: string; correct: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

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
    await fetchWords();
  };

  const fetchWords = async () => {
    try {
      let query = supabase
        .from('vocabulary_words')
        .select('*');

      if (listId) {
        query = query.eq('list_id', listId);
      }

      const { data: allWords, error } = await query;

      if (error) throw error;

      if (!allWords || allWords.length === 0) {
        alert('No words available for quiz');
        router.push('/');
        return;
      }

      // Shuffle and take requested number of words
      const shuffled = [...allWords].sort(() => Math.random() - 0.5);
      const selectedWords = shuffled.slice(0, Math.min(duration, shuffled.length));

      // Generate options for each word
      const quizWords: QuizWord[] = selectedWords.map((word) => {
        const wrongOptions = allWords
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
    // Update progress for each word
    for (const answer of answers) {
      await updateWordProgress(answer.wordId, answer.correct);
    }

    // Navigate to results page
    router.push(`/quiz/results?correct=${score.correct}&total=${words.length}`);
  };

  const updateWordProgress = async (wordId: string, correct: boolean) => {
    try {
      // Check if progress exists
      const { data: existing } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('word_id', wordId)
        .single();

      if (existing) {
        // Update existing progress
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
        // Create new progress
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (words.length === 0) {
    return null;
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-3xl mx-auto py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentIndex + 1} of {words.length}</span>
            <span>{score.correct} correct</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="bg-blue-600 h-2 rounded-full"
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
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            {/* Word */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <h2 className="text-5xl font-bold text-gray-900">{currentWord.word}</h2>
                <button
                  onClick={playPronunciation}
                  className="p-3 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                  aria-label="Play pronunciation"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>
              {currentWord.reading && (
                <p className="text-xl text-gray-600">{currentWord.reading}</p>
              )}
            </div>

            {/* Question */}
            <p className="text-center text-lg text-gray-700 mb-6">
              What does this word mean?
            </p>

            {/* Options */}
            <div className="grid gap-3">
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
                    className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                      showCorrect
                        ? 'border-green-500 bg-green-50'
                        : showIncorrect
                        ? 'border-red-500 bg-red-50'
                        : isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <span className={`font-medium ${
                      showCorrect ? 'text-green-700' : showIncorrect ? 'text-red-700' : 'text-gray-900'
                    }`}>
                      {option}
                    </span>
                    {showCorrect && <Check className="w-6 h-6 text-green-600" />}
                    {showIncorrect && <X className="w-6 h-6 text-red-600" />}
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
                className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
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
