'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Volume2, X, BookOpen } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ShareWordCard } from './ShareWordCard';

export interface VocabularyExample {
  id: string;
  word_id: string;
  kanji: string;
  furigana?: string | null;
  romaji?: string | null;
  translation?: string | null;
}

export interface Word {
  id: string;
  // New Japanese structure
  kanji?: string | null;
  furigana?: string | null;
  romaji?: string | null;
  // Legacy fields (for backwards compatibility)
  word: string;
  reading?: string | null;
  meaning: string;
  image_url: string;
  pronunciation_url: string;
  examples: string[];
  word_type?: 'regular' | 'custom'; // Add word_type field
  list_id?: string;
  vocabulary_lists?: {
    id?: string;
    name?: string | null;
  } | null;
}

interface WordDetailsCardProps {
  word: Word;
  onClose: () => void;
  isOpen: boolean;
}

export function WordDetailsCard({ word, onClose, isOpen }: WordDetailsCardProps) {
  const [detailedExamples, setDetailedExamples] = useState<VocabularyExample[]>([]);
  const [loadingExamples, setLoadingExamples] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportIssueType, setReportIssueType] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && word.id) {
      fetchDetailedExamples();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, word.id]);

  const fetchDetailedExamples = async () => {
    try {
      const { data, error } = await supabase
        .from('vocabulary_examples')
        .select('*')
        .eq('word_id', word.id)
        .order('id', { ascending: true });

      if (error) throw error;

      // Debug: Log the fetched examples to console
      console.log('Fetched examples for word:', word.id, data);

      setDetailedExamples(data || []);
    } catch (error) {
      console.error('Error fetching examples:', error);
      // Fallback to legacy examples if new ones don't exist
      setDetailedExamples([]);
    } finally {
      setLoadingExamples(false);
    }
  };

  const playPronunciation = () => {
    const audio = new Audio(word.pronunciation_url);
    audio.play();
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to report issues');
        return;
      }

      const { error } = await supabase
        .from('word_flags')
        .insert({
          word_id: word.id,
          user_id: user.id,
          issue_type: reportIssueType,
          description: reportDescription,
          status: 'pending',
        } as never);

      if (error) throw error;

      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
        setReportIssueType('');
        setReportDescription('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setReportSubmitting(false);
    }
  };

  // Lock body scroll when modal is open
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      };
    }
  }, [isOpen]);

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
            className="fixed inset-0 bg-night-400/70 dark:bg-night-500/80 z-40 backdrop-blur-md"
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-full max-w-2xl max-h-[80vh] sm:max-h-[85vh] overflow-y-auto glass-strong rounded-2xl shadow-xl z-[60] p-4 sm:p-6 scrollbar-hide mb-8 sm:mb-0"
          >
            {/* Action buttons row - All in one line */}
            <div className="flex gap-2 mb-4 pt-1 justify-between items-center">
              <div className="flex gap-2">
                {/* Flag button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowReportModal(true)}
                  className="p-2.5 rounded-xl glass text-coral-500 hover:bg-coral-500/10 transition-all"
                  aria-label="Report an issue"
                >
                  <Flag className="w-5 h-5" />
                </motion.button>

                {/* Share button (only for non-custom words) */}
                {word.word_type !== 'custom' && (
                  <ShareWordCard word={word} examples={detailedExamples} />
                )}
              </div>

              {/* Close button - aligned right */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2.5 rounded-xl glass text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-all"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Image - Square container */}
            <div className="relative w-full aspect-square max-w-md mx-auto rounded-xl overflow-hidden mb-5 sm:mb-6 ring-1 ring-[var(--color-border)]">
              <Image
                src={word.image_url}
                alt={word.word}
                fill
                className="object-cover"
                priority
              />
              {/* Subtle gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--color-bg-primary)]/40 to-transparent" />
            </div>

            {/* Word and pronunciation */}
            <div className="mb-5 sm:mb-6 text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">
                  {word.kanji || word.word}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={playPronunciation}
                  className="p-2 rounded-xl glass text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/10 transition-all"
                  aria-label="Play pronunciation"
                >
                  <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
              </div>
              {(word.furigana || word.romaji || word.reading) && (
                <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-muted)] mb-2">
                  {word.furigana}
                  {word.furigana && (word.romaji || word.reading) && ' '}
                  {(word.romaji || word.reading) && `(${word.romaji || word.reading})`}
                </p>
              )}
              <p className="text-base sm:text-lg text-[var(--color-accent-primary)] font-semibold">{word.meaning}</p>
            </div>

            {/* Examples */}
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <BookOpen className="w-5 h-5 text-[var(--color-accent-primary)]" />
                <h3 className="text-lg sm:text-xl font-semibold text-[var(--color-text-primary)]">Examples</h3>
              </div>
              {loadingExamples ? (
                <div className="text-center py-4 text-sm sm:text-base text-[var(--color-text-muted)]">
                  <div className="animate-shimmer h-20 rounded-xl"></div>
                </div>
              ) : detailedExamples.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {detailedExamples.map((example, index) => (
                    <motion.div
                      key={example.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 sm:p-4 glass rounded-xl"
                    >
                      {/* Vertically stacked: Kanji → Furigana → Romaji → Translation */}
                      <div className="space-y-1">
                        {/* Kanji reading */}
                        {example.kanji && (
                          <p className="text-[var(--color-text-primary)] font-medium text-sm sm:text-base">{example.kanji}</p>
                        )}
                        {/* Furigana */}
                        {example.furigana && (
                          <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">{example.furigana}</p>
                        )}
                        {/* Romaji */}
                        {example.romaji && (
                          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] italic">{example.romaji}</p>
                        )}
                        {/* Translation */}
                        {example.translation && (
                          <p className="text-xs sm:text-sm text-[var(--color-accent-primary)] font-medium pt-1">{example.translation}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : word.examples && word.examples.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {word.examples.map((example, index) => {
                    // Parse pipe-separated format: kanji|furigana|romaji|translation
                    const parts = typeof example === 'string' ? example.split('|') : [];
                    const [kanji, furigana, romaji, translation] = parts;

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 sm:p-4 glass rounded-xl"
                      >
                        <div className="space-y-1">
                          {kanji && <p className="text-[var(--color-text-primary)] font-medium text-sm sm:text-base">{kanji}</p>}
                          {furigana && <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">{furigana}</p>}
                          {romaji && <p className="text-xs sm:text-sm text-[var(--color-text-muted)] italic">{romaji}</p>}
                          {translation && <p className="text-xs sm:text-sm text-[var(--color-accent-primary)] font-medium pt-1">{translation}</p>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[var(--color-text-muted)] text-center py-4 text-sm sm:text-base">No examples available</p>
              )}
            </div>
          </motion.div>

          {/* Report Modal */}
          <AnimatePresence>
            {showReportModal && (
              <>
                {/* Report Modal Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowReportModal(false)}
                  className="fixed inset-0 bg-night-400/80 z-[65] backdrop-blur-md"
                />

                {/* Report Modal Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-full max-w-md glass-strong rounded-2xl shadow-xl z-[70] p-4 sm:p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mb-4">Report an Issue</h3>

                  {reportSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-4"
                    >
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-base sm:text-lg text-[var(--color-text-primary)] font-semibold mb-2">Thank you!</p>
                      <p className="text-sm sm:text-base text-[var(--color-text-muted)] mb-4">Your report has been submitted.</p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowReportModal(false);
                          setReportSuccess(false);
                          setReportIssueType('');
                          setReportDescription('');
                        }}
                        className="btn-primary px-6"
                      >
                        Close
                      </motion.button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleReportSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                          Issue Type
                        </label>
                        <select
                          value={reportIssueType}
                          onChange={(e) => setReportIssueType(e.target.value)}
                          required
                          className="input w-full text-sm sm:text-base"
                        >
                          <option value="">Select an issue...</option>
                          <option value="incorrect_meaning">Incorrect Meaning</option>
                          <option value="wrong_image">Wrong Image</option>
                          <option value="bad_audio">Bad Audio</option>
                          <option value="incorrect_reading">Incorrect Reading</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                          Description
                        </label>
                        <textarea
                          value={reportDescription}
                          onChange={(e) => setReportDescription(e.target.value)}
                          required
                          rows={4}
                          placeholder="Please describe the issue..."
                          className="input w-full text-sm sm:text-base resize-none"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowReportModal(false)}
                          className="flex-1 btn-ghost text-sm sm:text-base"
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          type="submit"
                          disabled={reportSubmitting}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 bg-gradient-to-r from-coral-500 to-coral-400 text-white font-semibold rounded-xl py-3 shadow-glow-coral disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          {reportSubmitting ? 'Submitting...' : 'Submit'}
                        </motion.button>
                      </div>
                    </form>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
