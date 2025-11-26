'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { MessageSquare, Upload, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import Image from 'next/image';

interface ScreenshotPreviewProps {
  file: File;
  index: number;
  onRemove: () => void;
}

function ScreenshotPreview({ file, index, onRemove }: ScreenshotPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!previewUrl) {
    return null;
  }

  return (
    <div className="relative group">
      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
        <Image
          src={previewUrl}
          alt={`Screenshot ${index + 1}`}
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 768px) 33vw, 200px"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function FeedbackPage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Feedback form states
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'feature_request' | 'improvement' | 'other'>('bug');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackScreenshots, setFeedbackScreenshots] = useState<File[]>([]);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    
    // Check total count
    if (feedbackScreenshots.length + newFiles.length > 3) {
      setFeedbackError('Maximum 3 screenshots allowed');
      setTimeout(() => setFeedbackError(''), 3000);
      return;
    }

    // Validate and compress each file
    const validFiles: File[] = [];
    for (const file of newFiles) {
      if (!file.type.startsWith('image/')) {
        setFeedbackError('Only image files are allowed');
        setTimeout(() => setFeedbackError(''), 3000);
        continue;
      }

      if (file.size > 2 * 1024 * 1024) {
        try {
          const compressed = await imageCompression(file, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
          });
          validFiles.push(compressed);
        } catch (error) {
          console.error('Error compressing image:', error);
          setFeedbackError('Failed to compress image. Please try a smaller file.');
          setTimeout(() => setFeedbackError(''), 3000);
        }
      } else {
        validFiles.push(file);
      }
    }

    setFeedbackScreenshots(prev => [...prev, ...validFiles]);
  };

  const removeScreenshot = (index: number) => {
    setFeedbackScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setFeedbackError('You must be logged in');
      return;
    }

    if (!feedbackMessage.trim()) {
      setFeedbackError('Please enter a message');
      setTimeout(() => setFeedbackError(''), 3000);
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackError('');
    setFeedbackSuccess('');

    try {
      const screenshotUrls: string[] = [];

      // Upload screenshots if any
      for (const file of feedbackScreenshots) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from('feedback-screenshots')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Error uploading screenshot:', uploadError);
          continue; // Skip this file but continue with others
        }

        if (data) {
          screenshotUrls.push(data.path);
        }
      }

      // Insert feedback
      const { error: insertError } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user.id,
          category: feedbackCategory,
          message: feedbackMessage.trim(),
          screenshots: screenshotUrls,
          status: 'pending',
        });

      if (insertError) throw insertError;

      setFeedbackSuccess('Feedback submitted successfully! Thank you for helping us improve.');
      setFeedbackMessage('');
      setFeedbackScreenshots([]);
      setFeedbackCategory('bug');
      
      setTimeout(() => setFeedbackSuccess(''), 5000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
      setFeedbackError(errorMessage);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-gray-900 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Feedback</h1>
              </div>
              <p className="text-gray-700 dark:text-gray-300">Help us improve Lexora by sharing your thoughts</p>
            </div>

            {feedbackSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm text-center"
              >
                {feedbackSuccess}
              </motion.div>
            )}

            {feedbackError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
              >
                {feedbackError}
              </motion.div>
            )}

            <form onSubmit={handleFeedbackSubmit} className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'bug', label: 'Bug Report' },
                    { id: 'feature_request', label: 'Feature Request' },
                    { id: 'improvement', label: 'Improvement' },
                    { id: 'other', label: 'Other' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFeedbackCategory(cat.id as any)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        feedbackCategory === cat.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label htmlFor="feedbackMessage" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Message
                </label>
                <textarea
                  id="feedbackMessage"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Screenshots (Optional)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {feedbackScreenshots.map((file, index) => (
                    <ScreenshotPreview
                      key={index}
                      file={file}
                      index={index}
                      onRemove={() => removeScreenshot(index)}
                    />
                  ))}
                  
                  {feedbackScreenshots.length < 3 && (
                    <label className="h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500 mb-1" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleScreenshotChange}
                      />
                    </label>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Max 3 images, up to 2MB each.
                </p>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={feedbackSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {feedbackSubmitting ? (
                  'Sending...'
                ) : (
                  <>
                    <MessageSquare className="w-5 h-5" />
                    Send Feedback
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
