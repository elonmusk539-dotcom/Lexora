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
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 card cursor-pointer"
    >
      {/* Word info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)] truncate">
            {word.kanji || word.word}
          </h3>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={playPronunciation}
            className="p-1.5 rounded-lg glass text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/10 transition-all flex-shrink-0"
            aria-label="Play pronunciation"
          >
            <Volume2 className="w-4 h-4" />
          </motion.button>
        </div>
        {(word.furigana || word.romaji || word.reading) && (
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mb-1 truncate">
            {word.furigana}
            {word.furigana && (word.romaji || word.reading) && ' '}
            {(word.romaji || word.reading) && `(${word.romaji || word.reading})`}
          </p>
        )}
        <p className="text-sm sm:text-base text-[var(--color-text-secondary)] line-clamp-2 font-medium">
          {word.meaning}
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex-shrink-0">
        <CircularProgress progress={progress} isMastered={isMastered} />
      </div>
    </motion.div>
  );
}
