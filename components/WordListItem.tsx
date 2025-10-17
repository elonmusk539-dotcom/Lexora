'use client';

import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import React from 'react';
import { CircularProgress } from './CircularProgress';
import type { Word } from './WordDetailsCard';

interface WordListItemProps {
  word: Word;
  progress: number;
  isMastered: boolean;
  onClick: () => void;
}

export function WordListItem({
  word,
  progress,
  isMastered,
  onClick,
}: WordListItemProps) {
  const playPronunciation = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = new Audio(word.pronunciation_url);
    audio.play();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Word info */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{word.kanji || word.word}</h3>
          <button
            onClick={playPronunciation}
            className="p-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
            aria-label="Play pronunciation"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        {(word.furigana || word.romaji || word.reading) && (
          <p className="text-sm text-gray-900 dark:text-white mb-1">
            {word.furigana}
            {word.furigana && (word.romaji || word.reading) && ' '}
            {(word.romaji || word.reading) && `(${word.romaji || word.reading})`}
          </p>
        )}
        <p className="text-gray-900 dark:text-white">{word.meaning}</p>
      </div>

      {/* Progress indicator */}
      <div className="flex-shrink-0">
        <CircularProgress progress={progress} isMastered={isMastered} />
      </div>
    </motion.div>
  );
}
