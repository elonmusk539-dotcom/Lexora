'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, X } from 'lucide-react';

interface MilestonePopupProps {
  isOpen: boolean;
  type: 'streak' | 'words_mastered';
  milestone: number;
  onClose: () => void;
}

type MilestoneConfig = {
  title: string;
  color: string;
  icon: string;
  message: string;
};

const MILESTONE_CONFIGS: {
  streak: Record<number, MilestoneConfig>;
  words_mastered: Record<number, MilestoneConfig>;
} = {
  streak: {
    7: { title: '7 Day Streak!', color: 'from-orange-400 to-red-500', icon: '🔥', message: 'You\'re on fire! Keep it up!' },
    14: { title: '2 Week Streak!', color: 'from-pink-400 to-purple-500', icon: '⚡', message: 'Incredible consistency!' },
    21: { title: '3 Week Streak!', color: 'from-blue-400 to-indigo-500', icon: '💎', message: 'Diamond dedication!' },
    30: { title: '30 Day Streak!', color: 'from-yellow-400 to-amber-500', icon: '👑', message: 'A full month! Legendary!' },
    60: { title: '60 Day Streak!', color: 'from-green-400 to-emerald-500', icon: '🌟', message: 'Absolutely unstoppable!' },
    90: { title: '90 Day Streak!', color: 'from-purple-500 to-pink-600', icon: '🏆', message: 'Master of consistency!' },
  },
  words_mastered: {
    50: { title: '50 Words Mastered!', color: 'from-blue-400 to-cyan-500', icon: '🎯', message: 'Great progress!' },
    100: { title: '100 Words Mastered!', color: 'from-green-400 to-teal-500', icon: '✨', message: 'Century club member!' },
    250: { title: '250 Words Mastered!', color: 'from-purple-400 to-indigo-500', icon: '🌠', message: 'Vocabulary champion!' },
    500: { title: '500 Words Mastered!', color: 'from-yellow-400 to-orange-500', icon: '🎊', message: 'Half a thousand! Amazing!' },
    1000: { title: '1000 Words Mastered!', color: 'from-pink-500 to-rose-600', icon: '👑', message: 'Language royalty!' },
  },
};

export function MilestonePopup({ isOpen, type, milestone, onClose }: MilestonePopupProps) {
  const config = MILESTONE_CONFIGS[type][milestone];
  
  if (!config) return null;

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
            className="fixed inset-0 bg-black/70 z-[100] backdrop-blur-md"
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              rotate: 0,
              transition: {
                type: 'spring',
                damping: 15,
                stiffness: 200,
              }
            }}
            exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-full max-w-lg z-[101]"
          >
            <div className={`bg-gradient-to-br ${config.color} rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 relative overflow-hidden`}>
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>

              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: Math.random() * 100 + '%', 
                      y: Math.random() * 100 + '%',
                      scale: 0,
                      rotate: 0,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      rotate: [0, 180, 360],
                      y: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
                    }}
                    transition={{
                      duration: 3,
                      delay: i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                    className="absolute w-3 h-3 sm:w-4 sm:h-4"
                  >
                    <Sparkles className="w-full h-full text-white/30" />
                  </motion.div>
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10 text-center text-white">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    damping: 10,
                    stiffness: 100,
                    delay: 0.2,
                  }}
                  className="text-5xl sm:text-6xl md:text-8xl mb-4 sm:mb-6"
                >
                  {config.icon}
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 drop-shadow-lg"
                >
                  {config.title}
                </motion.h2>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 drop-shadow-md"
                >
                  {config.message}
                </motion.p>

                {/* Trophy Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full backdrop-blur-sm"
                >
                  <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </motion.div>

                {/* Continue button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={onClose}
                  className="mt-6 sm:mt-8 px-6 sm:px-8 py-2.5 sm:py-3 bg-white/90 hover:bg-white text-gray-900 rounded-full font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all"
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
