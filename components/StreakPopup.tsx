'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Flame, X } from 'lucide-react';

interface StreakPopupProps {
  isOpen: boolean;
  streakCount: number;
  onClose: () => void;
}

export function StreakPopup({ isOpen, streakCount, onClose }: StreakPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-night-400/70 z-[100] backdrop-blur-md"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-full max-w-md z-[101] max-h-[80vh] sm:max-h-[90vh]"
          >
            <div className="bg-gradient-to-br from-coral-500 via-orange-500 to-coral-400 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border-4 border-coral-300/50 relative overflow-hidden">
              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors z-10"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </motion.button>

              {/* Animated flames background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute -top-10 -left-10 w-32 h-32 sm:w-40 sm:h-40 bg-white/10 rounded-full blur-3xl"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, -5, 5, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.5,
                  }}
                  className="absolute -bottom-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 bg-yellow-300/20 rounded-full blur-3xl"
                />
              </div>

              {/* Content */}
              <div className="relative z-10 text-center">
                {/* Animated flame icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{
                    scale: [0, 1.2, 1],
                    rotate: [0, -10, 10, -10, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    times: [0, 0.5, 1],
                  }}
                  className="mb-4 sm:mb-6 flex justify-center"
                >
                  <div className="relative">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="absolute inset-0 bg-white/30 rounded-full blur-xl"
                    />
                    <Flame className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-white relative" fill="currentColor" />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl sm:text-3xl font-bold text-white mb-2"
                >
                  Streak Updated! 🎉
                </motion.h2>

                {/* Streak count */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', damping: 15 }}
                  className="mb-4 sm:mb-6"
                >
                  <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-white/20 rounded-full backdrop-blur-sm border-2 border-white/30">
                    <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-white flex-shrink-0" fill="currentColor" />
                    <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
                      {streakCount}
                    </span>
                    <span className="text-base sm:text-lg md:text-xl font-semibold text-white/90">
                      {streakCount === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                </motion.div>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 mb-4 sm:mb-6 text-base sm:text-lg"
                >
                  Keep up the amazing work! 🌟
                </motion.p>

                {/* Continue button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-white text-coral-600 font-bold text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                >
                  Continue
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
