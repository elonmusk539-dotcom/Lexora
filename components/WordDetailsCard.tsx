'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Volume2 } from 'lucide-react';
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
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
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
            className="fixed left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-[45] p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {/* Top right buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <ShareWordCard word={word} examples={detailedExamples} />
              <button
                onClick={() => setShowReportModal(true)}
                className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                aria-label="Report an issue"
              >
                <Flag className="w-5 h-5" />
              </button>
            </div>

            {/* Image - Square container */}
            <div className="relative w-full aspect-square max-w-md mx-auto rounded-xl overflow-hidden mb-6 bg-gray-100 dark:bg-gray-700">
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
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{word.kanji || word.word}</h2>
                <button
                  onClick={playPronunciation}
                  className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                  aria-label="Play pronunciation"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>
              {(word.furigana || word.romaji || word.reading) && (
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
                  {word.furigana}
                  {word.furigana && (word.romaji || word.reading) && ' '}
                  {(word.romaji || word.reading) && `(${word.romaji || word.reading})`}
                </p>
              )}
              <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">{word.meaning}</p>
            </div>

            {/* Examples */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Examples</h3>
              {loadingExamples ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading examples...</div>
              ) : detailedExamples.length > 0 ? (
                <div className="space-y-3">
                  {detailedExamples.map((example, index) => (
                    <motion.div
                      key={example.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      {/* Vertically stacked: Kanji → Furigana → Romaji → Translation */}
                      <div className="space-y-1">
                        {/* Kanji reading */}
                        {example.kanji && (
                          <p className="text-gray-900 dark:text-white font-medium text-base">{example.kanji}</p>
                        )}
                        {/* Furigana */}
                        {example.furigana && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{example.furigana}</p>
                        )}
                        {/* Romaji */}
                        {example.romaji && (
                          <p className="text-sm text-gray-500 dark:text-gray-500 italic">{example.romaji}</p>
                        )}
                        {/* Translation */}
                        {example.translation && (
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{example.translation}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : word.examples && word.examples.length > 0 ? (
                <div className="space-y-3">
                  {word.examples.map((example, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <p className="text-gray-800 dark:text-gray-200">{example}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No examples available</p>
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
                  className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                />

                {/* Report Modal Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-[55] p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Report an Issue</h3>
                  
                  {reportSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-4"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-lg text-gray-900 font-medium mb-2">Thank you!</p>
                      <p className="text-gray-600 mb-4">Your report has been submitted successfully.</p>
                      <button
                        onClick={() => {
                          setShowReportModal(false);
                          setReportSuccess(false);
                          setReportIssueType('');
                          setReportDescription('');
                        }}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Close
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleReportSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Issue Type
                        </label>
                        <select
                          value={reportIssueType}
                          onChange={(e) => setReportIssueType(e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={reportDescription}
                          onChange={(e) => setReportDescription(e.target.value)}
                          required
                          rows={4}
                          placeholder="Please describe the issue..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 resize-none"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowReportModal(false)}
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={reportSubmitting}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                        </button>
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
