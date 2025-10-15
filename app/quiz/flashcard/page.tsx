'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Volume2, RotateCw, Check, X } from 'lucide-react';
import Image from 'next/image';
import type { Word } from '@/components/WordDetailsCard';

export default function FlashcardQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duration = parseInt(searchParams.get('duration') || '10');
  const listId = searchParams.get('listId');

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
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

      const shuffled = [...allWords].sort(() => Math.random() - 0.5);
      const selectedWords = shuffled.slice(0, Math.min(duration, shuffled.length));

      setWords(selectedWords);
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

    setAnswers((prev) => [...prev, { wordId: currentWord.id, correct }]);

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

  const finishQuiz = () => {
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
            <span>Card {currentIndex + 1} of {words.length}</span>
            <span>{score.correct} correct, {score.incorrect} incorrect</span>
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
                <div className="bg-white rounded-2xl shadow-2xl p-8 h-full flex flex-col items-center justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-6xl font-bold text-gray-900">{currentWord.word}</h2>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playPronunciation();
                      }}
                      className="p-3 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                      aria-label="Play pronunciation"
                    >
                      <Volume2 className="w-7 h-7" />
                    </button>
                  </div>
                  {currentWord.reading && (
                    <p className="text-2xl text-gray-600 mb-8">{currentWord.reading}</p>
                  )}
                  <div className="flex items-center gap-2 text-gray-500 mt-8">
                    <RotateCw className="w-5 h-5" />
                    <p>Click to reveal answer</p>
                  </div>
                </div>
              </div>

              {/* Back of card */}
              <div className="absolute inset-0 backface-hidden rotate-y-180">
                <div className="bg-white rounded-2xl shadow-2xl p-8 h-full flex flex-col">
                  <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4">
                    <Image
                      src={currentWord.image_url}
                      alt={currentWord.word}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-4xl font-bold text-gray-900 mb-2">{currentWord.word}</h3>
                  {currentWord.reading && (
                    <p className="text-xl text-gray-600 mb-4">{currentWord.reading}</p>
                  )}
                  <p className="text-2xl text-blue-600 font-semibold mb-4">{currentWord.meaning}</p>
                  <div className="flex-1 overflow-y-auto">
                    <p className="text-sm text-gray-600 mb-2">Examples:</p>
                    <div className="space-y-2">
                      {currentWord.examples.slice(0, 2).map((example, idx) => (
                        <p key={idx} className="text-sm text-gray-700">{example}</p>
                      ))}
                    </div>
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
