'use client';

import { motion } from 'framer-motion';
import { LogOut, Home, BookOpen, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type QuizType = 'mcq' | 'flashcard';
type QuizDuration = 5 | 10 | 15 | 20;

export default function QuizPage() {
  const [quizType, setQuizType] = useState<QuizType>('mcq');
  const [duration, setDuration] = useState<QuizDuration>(10);
  const router = useRouter();

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const startQuiz = () => {
    router.push(`/quiz/${quizType}?duration=${duration}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Lexora</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Home</span>
              </Link>
              <Link
                href="/lists"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">Lists</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-700 hover:text-red-600 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Start a Quiz</h2>
          <p className="text-gray-600 mb-8">
            Choose your quiz type and duration
          </p>

          {/* Quiz Type Selection */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Quiz Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setQuizType('mcq')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  quizType === 'mcq'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Multiple Choice
                </h3>
                <p className="text-sm text-gray-600">
                  Choose the correct meaning from 4 options
                </p>
              </button>

              <button
                onClick={() => setQuizType('flashcard')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  quizType === 'flashcard'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Flashcards
                </h3>
                <p className="text-sm text-gray-600">
                  Review words and rate your knowledge
                </p>
              </button>
            </div>
          </div>

          {/* Duration Selection */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              <Clock className="inline w-5 h-5 mr-2" />
              Quiz Duration (words)
            </label>
            <div className="grid grid-cols-4 gap-3">
              {([5, 10, 15, 20] as QuizDuration[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`py-3 rounded-lg font-semibold transition-all ${
                    duration === d
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startQuiz}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Start Quiz
          </motion.button>
        </motion.div>
      </main>
    </div>
  );
}
