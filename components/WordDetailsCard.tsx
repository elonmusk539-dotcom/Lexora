'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2 } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

export interface Word {
  id: string;
  word: string;
  reading?: string;
  meaning: string;
  image_url: string;
  pronunciation_url: string;
  examples: string[];
}

interface WordDetailsCardProps {
  word: Word;
  onClose: () => void;
  isOpen: boolean;
}

export function WordDetailsCard({ word, onClose, isOpen }: WordDetailsCardProps) {
  const playPronunciation = () => {
    const audio = new Audio(word.pronunciation_url);
    audio.play();
  };

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
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl z-50 p-6"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image */}
            <div className="relative w-full h-64 rounded-xl overflow-hidden mb-6">
              <Image
                src={word.image_url}
                alt={word.word}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Word and pronunciation */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-4xl font-bold text-gray-900">{word.word}</h2>
                <button
                  onClick={playPronunciation}
                  className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                  aria-label="Play pronunciation"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>
              {word.reading && (
                <p className="text-xl text-gray-600 mb-2">{word.reading}</p>
              )}
              <p className="text-lg text-gray-700 font-medium">{word.meaning}</p>
            </div>

            {/* Examples */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Examples</h3>
              <div className="space-y-3">
                {word.examples.map((example, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <p className="text-gray-800">{example}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
