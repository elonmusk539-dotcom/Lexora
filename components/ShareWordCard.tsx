'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import Image from 'next/image';

interface VocabularyWord {
  id: string;
  word: string;
  kanji?: string | null;
  furigana?: string | null;
  romaji?: string | null;
  meaning?: string | null;
  reading?: string | null;
  translation?: string | null;
  image_url?: string | null;
}

interface VocabularyExample {
  id: string;
  kanji: string;
  furigana?: string | null;
  romaji?: string | null;
  translation?: string | null;
}

interface ShareWordCardProps {
  word: VocabularyWord;
  examples?: VocabularyExample[];
}

export function ShareWordCard({ word, examples }: ShareWordCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Also prevent scrolling on the parent elements
      const wordDetailsCard = document.querySelector('[class*="max-h-\\[85vh\\]"]');
      if (wordDetailsCard) {
        (wordDetailsCard as HTMLElement).style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = 'unset';
      const wordDetailsCard = document.querySelector('[class*="max-h-\\[85vh\\]"]');
      if (wordDetailsCard) {
        (wordDetailsCard as HTMLElement).style.overflow = 'auto';
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const generateImage = async () => {
    if (!cardRef.current) return;

    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#6366f1',
        logging: false,
        useCORS: true,
      });

      canvas.toBlob((blob: Blob | null) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lexora-${word.kanji || word.word}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/word/${word.id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/word/${word.id}`;
    const wordDisplay = word.kanji || word.word;
    const readingDisplay = word.romaji || word.reading || '';
    const shareText = `Check out this word: ${wordDisplay} (${readingDisplay}) - ${word.meaning || word.translation || 'Learn more on Lexora!'}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${wordDisplay} - Lexora`,
          text: shareText,
          url: url
        });
      } catch (error) {
        // User cancelled or share failed
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          copyLink(); // Fallback to copy
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      copyLink();
    }
  };

  const firstExample = examples?.[0];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
        title="Share"
      >
        <Share2 className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-[60] p-3 sm:p-6 max-h-[80vh] sm:max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors z-10"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
              </button>

              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 pr-8">Share Word</h3>

              {/* Preview card - scaled for mobile */}
              <div className="mb-4 sm:mb-6">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-2 sm:p-4 rounded-xl">
                  <div
                    ref={cardRef}
                    className="rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between mx-auto"
                    style={{ 
                      width: '100%', 
                      maxWidth: '320px',
                      aspectRatio: '9/16',
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 50%, #6366F1 100%)'
                    }}
                  >
                    {/* Top Section - Word Info */}
                    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2">
                      {word.image_url && (
                        <div className="mb-1 rounded-lg sm:rounded-xl overflow-hidden shadow-lg">
                          <Image
                            src={word.image_url}
                            alt={word.kanji || word.word}
                            width={128}
                            height={128}
                            className="w-24 h-24 sm:w-32 sm:h-32 object-cover"
                            crossOrigin="anonymous"
                            unoptimized
                          />
                        </div>
                      )}
                      
                      <div className="text-3xl sm:text-4xl font-bold text-white">{word.kanji || word.word}</div>
                      
                      {word.furigana && (
                        <div className="text-base sm:text-lg text-white" style={{ opacity: 0.9 }}>{word.furigana}</div>
                      )}
                      
                      {word.romaji && (
                        <div className="text-sm sm:text-base text-white" style={{ opacity: 0.8 }}>{word.romaji}</div>
                      )}
                      
                      <div className="text-lg sm:text-xl font-semibold text-white">
                        {word.meaning}
                      </div>

                      {/* Example */}
                      {firstExample && (
                        <div className="rounded-lg p-2 max-w-[90%] mt-1" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
                          <div className="text-white text-sm sm:text-base mb-0.5">{firstExample.kanji}</div>
                          {firstExample.furigana && (
                            <div className="text-white text-xs" style={{ opacity: 0.8 }}>{firstExample.furigana}</div>
                          )}
                          {firstExample.romaji && (
                            <div className="text-white text-xs" style={{ opacity: 0.7 }}>{firstExample.romaji}</div>
                          )}
                          {firstExample.translation && (
                            <div className="text-white text-xs sm:text-sm" style={{ opacity: 0.9 }}>{firstExample.translation}</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Section - Branding */}
                    <div className="text-center pt-2 sm:pt-4">
                      <div className="text-xl sm:text-2xl font-bold text-white mb-0.5">Lexora</div>
                      <div className="text-white text-[10px] sm:text-xs" style={{ opacity: 0.8 }}>Learn Japanese Vocabulary</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 sm:space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateImage}
                  disabled={generating}
                  className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg sm:rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  {generating ? 'Generating...' : 'Download Card'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShare}
                  className="w-full py-2.5 sm:py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  Share
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
