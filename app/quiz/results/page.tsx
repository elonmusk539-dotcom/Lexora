'use client';

import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Home, RotateCw } from 'lucide-react';

export default function QuizResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const correct = parseInt(searchParams.get('correct') || '0');
  const total = parseInt(searchParams.get('total') || '1');
  
  const percentage = Math.round((correct / total) * 100);
  const passed = percentage >= 70;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full"
      >
        {/* Trophy Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
            passed ? 'bg-green-100' : 'bg-blue-100'
          }`}
        >
          <Trophy className={`w-12 h-12 ${passed ? 'text-green-600' : 'text-blue-600'}`} />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-gray-900 text-center mb-2"
        >
          {passed ? 'Great Job!' : 'Quiz Complete!'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 text-center mb-8"
        >
          {passed ? 'You did amazing! Keep it up!' : 'Keep practicing to improve your score!'}
        </motion.p>

        {/* Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-8"
        >
          <div className="text-center">
            <div className="text-7xl font-bold text-blue-600 mb-2">
              {percentage}%
            </div>
            <div className="text-xl text-gray-700">
              {correct} out of {total} correct
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="bg-green-50 rounded-xl p-4 text-center border-2 border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-1">{correct}</div>
            <div className="text-sm text-gray-600">Correct</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center border-2 border-red-200">
            <div className="text-3xl font-bold text-red-600 mb-1">{total - correct}</div>
            <div className="text-sm text-gray-600">Incorrect</div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 gap-4"
        >
          <Link
            href="/"
            className="flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            <Home className="w-5 h-5" />
            Home
          </Link>
          <button
            onClick={() => router.push('/quiz')}
            className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            <RotateCw className="w-5 h-5" />
            Try Again
          </button>
        </motion.div>

        {/* Progress info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 p-4 bg-blue-50 rounded-xl"
        >
          <p className="text-sm text-gray-700 text-center">
            Your progress has been updated! Keep practicing to reach mastery level.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
