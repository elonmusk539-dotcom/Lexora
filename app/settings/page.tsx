'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Settings as SettingsIcon, Save, Moon, Sun, MessageSquare, Upload, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { useTheme } from '@/contexts/ThemeContext';
import imageCompression from 'browser-image-compression';

interface UserSettings {
  flashcard: {
    showFuriganaOnFront: boolean;
    showRomajiOnFront: boolean;
  };
  mcq: {
    showFurigana: boolean;
    showRomaji: boolean;
  };
  smartQuiz: {
    showFuriganaOnFront: boolean;
    showRomajiOnFront: boolean;
    showImageOnFront: boolean;
    showImageOnBack: boolean;
    showExamples: boolean;
    numberOfExamples: number;
  };
  quiz: {
    lastQuizType?: 'mcq' | 'flashcard';
    lastDuration?: number | 'custom';
    lastSelectedLists?: string[];
    customDuration?: number;
  };
  review: {
    lastDuration?: number | 'custom';
    lastSelectedLists?: string[];
    customDuration?: number;
  };
}

const DEFAULT_SETTINGS: UserSettings = {
  flashcard: {
    showFuriganaOnFront: false,
    showRomajiOnFront: false,
  },
  mcq: {
    showFurigana: false,
    showRomaji: false,
  },
  smartQuiz: {
    showFuriganaOnFront: false,
    showRomajiOnFront: false,
    showImageOnFront: true,
    showImageOnBack: true,
    showExamples: true,
    numberOfExamples: 3,
  },
  quiz: {
    lastQuizType: 'mcq',
    lastDuration: 10,
    lastSelectedLists: [],
    customDuration: 10,
  },
  review: {
    lastDuration: 10,
    lastSelectedLists: [],
    customDuration: 10,
  },
};

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Feedback form states
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'feature_request' | 'improvement' | 'other'>('bug');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackScreenshots, setFeedbackScreenshots] = useState<File[]>([]);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  useEffect(() => {
    checkUserAndLoadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkUserAndLoadSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // Fetch user settings from profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('settings')
        .eq('user_id', user.id)
        .single();

      if (profile && profile.settings) {
        // Deep merge settings to ensure all properties have default values
        const mergedSettings = {
          ...DEFAULT_SETTINGS,
          flashcard: { ...DEFAULT_SETTINGS.flashcard, ...profile.settings.flashcard },
          mcq: { ...DEFAULT_SETTINGS.mcq, ...profile.settings.mcq },
          smartQuiz: { ...DEFAULT_SETTINGS.smartQuiz, ...profile.settings.smartQuiz },
          quiz: { ...DEFAULT_SETTINGS.quiz, ...profile.settings.quiz },
          review: { ...DEFAULT_SETTINGS.review, ...profile.settings.review },
        };
        setSettings(mergedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    if (!user) {
      setError('You must be logged in');
      setSaving(false);
      return;
    }

    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            settings,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Create new profile with settings
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            settings,
          });

        if (insertError) throw insertError;
      }

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  const updateFlashcardSetting = (key: keyof UserSettings['flashcard'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      flashcard: {
        ...prev.flashcard,
        [key]: value,
      },
    }));
  };

  const updateMcqSetting = (key: keyof UserSettings['mcq'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      mcq: {
        ...prev.mcq,
        [key]: value,
      },
    }));
  };

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
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
            {/* Page Title */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <SettingsIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Customize your learning experience</p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Settings Form */}
            <form onSubmit={handleSave} className="space-y-6 sm:space-y-8">
              {/* Appearance Settings Section */}
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Appearance
                </h3>
                
                <div className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="flex-1">
                      <label className="block font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                        Dark Mode
                      </label>
                      <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-200 mt-1">
                        Switch between light and dark theme
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="relative inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      {theme === 'dark' ? (
                        <>
                          <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">Dark</span>
                        </>
                      ) : (
                        <>
                          <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                          <span className="text-sm sm:text-base font-medium text-gray-900">Light</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Flashcard Settings Section */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Flashcard Quiz Settings
                </h3>
                
                <div className="space-y-4">
                  {/* Show Furigana on Front */}
                  <label
                    htmlFor="showFuriganaOnFront"
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id="showFuriganaOnFront"
                      checked={settings.flashcard.showFuriganaOnFront}
                      onChange={(e) => updateFlashcardSetting('showFuriganaOnFront', e.target.checked)}
                      className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-gray-900 dark:text-white">
                        Show Furigana on Flashcard Front
                      </span>
                      <p className="text-sm text-gray-900 dark:text-gray-200 mt-1">
                        Display hiragana reading (furigana) above kanji on the front of flashcards
                      </p>
                      <div className="mt-2 text-sm">
                        <span className="text-gray-700 dark:text-gray-300">Example: </span>
                        <ruby className="text-lg text-gray-700 dark:text-gray-300">
                          食べる
                          <rt className="text-xs text-gray-700 dark:text-gray-300">{settings.flashcard.showFuriganaOnFront ? 'たべる' : ''}</rt>
                        </ruby>
                      </div>
                    </div>
                  </label>

                  {/* Show Romaji on Front */}
                  <label
                    htmlFor="showRomajiOnFront"
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id="showRomajiOnFront"
                      checked={settings.flashcard.showRomajiOnFront}
                      onChange={(e) => updateFlashcardSetting('showRomajiOnFront', e.target.checked)}
                      className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-gray-900 dark:text-white">
                        Show Romaji on Flashcard Front
                      </span>
                      <p className="text-sm text-gray-900 dark:text-gray-200 mt-1">
                        Display romanized reading (romaji) on the front of flashcards
                      </p>
                      <div className="mt-2 text-sm">
                        <span className="text-gray-700 dark:text-gray-300">Example: </span>
                        <span className="text-lg text-gray-700 dark:text-gray-300">食べる</span>
                        {settings.flashcard.showRomajiOnFront && (
                          <span className="ml-2 text-gray-700 dark:text-gray-300">(taberu)</span>
                        )}
                      </div>
                    </div>
                  </label>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      <strong>Note:</strong> The back of the flashcard will always show all information including kanji, furigana, romaji, and meaning.
                    </p>
                  </div>
                </div>
              </div>

              {/* MCQ Settings Section */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Multiple Choice Quiz Settings
                </h3>
                
                <div className="space-y-4">
                  {/* Show Furigana in MCQ */}
                  <label
                    htmlFor="mcqShowFurigana"
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id="mcqShowFurigana"
                      checked={settings.mcq.showFurigana}
                      onChange={(e) => updateMcqSetting('showFurigana', e.target.checked)}
                      className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-gray-900 dark:text-white">
                        Show Furigana in Questions
                      </span>
                      <p className="text-sm text-gray-900 dark:text-gray-200 mt-1">
                        Display hiragana reading (furigana) above kanji in MCQ questions
                      </p>
                      <div className="mt-2 text-sm">
                        <span className="text-gray-700 dark:text-gray-300">Example: </span>
                        <ruby className="text-lg text-gray-700 dark:text-gray-300">
                          食べる
                          <rt className="text-xs text-gray-700 dark:text-gray-300">{settings.mcq.showFurigana ? 'たべる' : ''}</rt>
                        </ruby>
                      </div>
                    </div>
                  </label>

                  {/* Show Romaji in MCQ */}
                  <label
                    htmlFor="mcqShowRomaji"
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id="mcqShowRomaji"
                      checked={settings.mcq.showRomaji}
                      onChange={(e) => updateMcqSetting('showRomaji', e.target.checked)}
                      className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-gray-900 dark:text-white">
                        Show Romaji in Questions
                      </span>
                      <p className="text-sm text-gray-900 dark:text-gray-200 mt-1">
                        Display romanized reading (romaji) in MCQ questions
                      </p>
                      <div className="mt-2 text-sm">
                        <span className="text-gray-700 dark:text-gray-300">Example: </span>
                        <span className="text-lg text-gray-700 dark:text-gray-300">食べる</span>
                        {settings.mcq.showRomaji && (
                          <span className="ml-2 text-gray-700 dark:text-gray-300">(taberu)</span>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Smart Quiz Settings Section */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Smart Quiz Settings
                </h3>
                
                <div className="space-y-4">
                  {/* Show Furigana on Front */}
                  <label
                    htmlFor="smartQuizShowFuriganaOnFront"
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id="smartQuizShowFuriganaOnFront"
                      checked={settings.smartQuiz.showFuriganaOnFront}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        smartQuiz: { ...prev.smartQuiz, showFuriganaOnFront: e.target.checked }
                      }))}
                      className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-gray-900 dark:text-white">
                        Show Furigana on Front
                      </span>
                      <p className="text-sm text-gray-900 dark:text-gray-200 mt-1">
                        Display furigana before revealing the answer
                      </p>
                    </div>
                  </label>

                  {/* Show Romaji on Front */}
                  <label
                    htmlFor="smartQuizShowRomajiOnFront"
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id="smartQuizShowRomajiOnFront"
                      checked={settings.smartQuiz.showRomajiOnFront}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        smartQuiz: { ...prev.smartQuiz, showRomajiOnFront: e.target.checked }
                      }))}
                      className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-gray-900 dark:text-white">
                        Show Romaji on Front
                      </span>
                      <p className="text-sm text-gray-900 dark:text-gray-200 mt-1">
                        Display romaji before revealing the answer
                      </p>
                    </div>
                  </label>

                  {/* Show Image on Front */}
                  <label
                    htmlFor="smartQuizShowImageOnFront"
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id="smartQuizShowImageOnFront"
                      checked={settings.smartQuiz.showImageOnFront}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        smartQuiz: { ...prev.smartQuiz, showImageOnFront: e.target.checked }
                      }))}
                      className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-gray-900 dark:text-white">
                        Show Image on Front
                      </span>
                      <p className="text-sm text-gray-900 dark:text-gray-200 mt-1">
                        Display the word image on the front of the card (before showing answer)
                      </p>
                    </div>
                  </label>

                  {/* Show Image on Back */}
                  <label
                    htmlFor="smartQuizShowImageOnBack"
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id="smartQuizShowImageOnBack"
                      checked={settings.smartQuiz.showImageOnBack}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        smartQuiz: { ...prev.smartQuiz, showImageOnBack: e.target.checked }
                      }))}
                      className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-gray-900 dark:text-white">
                        Show Image on Back
                      </span>
                      <p className="text-sm text-gray-900 dark:text-gray-200 mt-1">
                        Display the word image on the back of the card (after showing answer)
                      </p>
                    </div>
                  </label>

                  {/* Show Examples */}
                  <label
                    htmlFor="smartQuizShowExamples"
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id="smartQuizShowExamples"
                      checked={settings.smartQuiz.showExamples}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        smartQuiz: { ...prev.smartQuiz, showExamples: e.target.checked }
                      }))}
                      className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-gray-900 dark:text-white">
                        Show Example Sentences
                      </span>
                      <p className="text-sm text-gray-900 dark:text-gray-200 mt-1">
                        Display example sentences after revealing the answer
                      </p>
                    </div>
                  </label>

                  {/* Number of Examples */}
                  {settings.smartQuiz.showExamples && (
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <label htmlFor="numberOfExamples" className="block font-medium text-gray-900 dark:text-white mb-2">
                        Number of Examples to Show
                      </label>
                      <select
                        id="numberOfExamples"
                        value={settings.smartQuiz.numberOfExamples}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          smartQuiz: { ...prev.smartQuiz, numberOfExamples: parseInt(e.target.value) }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value={1}>1 example</option>
                        <option value={2}>2 examples</option>
                        <option value={3}>3 examples</option>
                        <option value={4}>4 examples</option>
                        <option value={5}>5 examples</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Future Settings Sections Can Go Here */}
              {/* 
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Other Settings
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">More settings coming soon...</p>
              </div>
              */}

              {/* Save Button */}
              <div className="pt-4">
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </motion.button>

                {/* Success Message */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm text-center"
                  >
                    {success}
                  </motion.div>
                )}
              </div>
            </form>

            {/* Feedback Form - Separate from settings */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Send Feedback</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300">Help us improve Lexora by sharing your thoughts</p>
              </div>

              {/* Feedback Success Message */}
              {feedbackSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm"
                >
                  {feedbackSuccess}
                </motion.div>
              )}

              {/* Feedback Error Message */}
              {feedbackError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
                >
                  {feedbackError}
                </motion.div>
              )}

              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label htmlFor="feedback-category" className="block font-medium text-gray-900 dark:text-white mb-2">
                    Category
                  </label>
                  <select
                    id="feedback-category"
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value as 'bug' | 'feature_request' | 'improvement' | 'other')}
                    className="w-full px-4 py-2 border border-gray-400 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 text-gray-900 dark:text-gray-300"
                  >
                    <option className="text-gray-700 dark:text-gray-300" value="bug">🐛 Bug Report</option>
                    <option className="text-gray-700 dark:text-gray-300" value="feature_request">✨ Feature Request</option>
                    <option className="text-gray-700 dark:text-gray-300" value="improvement">💡 Improvement Suggestion</option>
                    <option className="text-gray-700 dark:text-gray-300" value="other">💬 Other</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="feedback-message" className="block font-medium text-gray-900 dark:text-white mb-2">
                    Message
                  </label>
                  <textarea
                    id="feedback-message"
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    rows={5}
                    placeholder="Tell us what's on your mind..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                {/* Screenshot Upload */}
                <div>
                  <label className="block font-medium text-gray-900 dark:text-white mb-2">
                    Screenshots (Optional)
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-200 mb-2">
                    Upload up to 3 screenshots (max 2MB each)
                  </p>
                  
                  {/* Screenshot Preview */}
                  {feedbackScreenshots.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {feedbackScreenshots.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Screenshot ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={() => removeScreenshot(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {feedbackScreenshots.length < 3 && (
                    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 transition-colors">
                      <Upload className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      <span className="text-sm text-gray-900 dark:text-gray-200">
                        {feedbackScreenshots.length === 0 ? 'Upload Screenshots' : `Add More (${3 - feedbackScreenshots.length} remaining)`}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleScreenshotChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={feedbackSubmitting || !feedbackMessage.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
