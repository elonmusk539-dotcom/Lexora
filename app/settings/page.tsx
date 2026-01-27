'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Settings as SettingsIcon, Save, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

import { SubscriptionManagement } from '@/components/SubscriptionManagement';



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

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('settings')
        .eq('user_id', user.id)
        .single();

      if (profile && profile.settings) {
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
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            settings,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
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



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="card-elevated p-4 sm:p-6 md:p-8">
            {/* Page Title */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-600 shadow-glow">
                  <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">Settings</h2>
              </div>
              <p className="text-sm sm:text-base text-[var(--color-text-muted)]">Customize your learning experience</p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-4 bg-coral-500/10 border border-coral-500/30 rounded-xl text-coral-500 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Settings Form */}
            <form onSubmit={handleSave} className="space-y-6 sm:space-y-8">
              {/* Appearance Settings Section */}
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-[var(--color-text-primary)] mb-3 sm:mb-4 pb-2 border-b border-[var(--color-border)]">
                  Appearance
                </h3>

                <div className="p-3 sm:p-4 pl-4 sm:pl-4 glass rounded-xl">
                  <div className="flex flex-row items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="block font-medium text-[var(--color-text-primary)] text-sm sm:text-base">
                        Dark Mode
                      </label>
                      <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                        Switch between light and dark theme
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={toggleTheme}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 glass rounded-xl hover:bg-[var(--color-surface-overlay)] transition-all"
                    >
                      {theme === 'dark' ? (
                        <>
                          <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-accent-primary)]" />
                          <span className="text-sm sm:text-base font-medium text-[var(--color-text-primary)]">Dark</span>
                        </>
                      ) : (
                        <>
                          <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-coral-500" />
                          <span className="text-sm sm:text-base font-medium text-[var(--color-text-primary)]">Light</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Flashcard Settings Section */}
              <div>
                <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4 pb-2 border-b border-[var(--color-border)]">
                  Flashcard Quiz Settings
                </h3>

                <div className="space-y-4">
                  <label
                    htmlFor="showFuriganaOnFront"
                    className="flex items-start gap-4 p-4 glass rounded-xl cursor-pointer hover:bg-[var(--color-surface-overlay)] transition-all"
                  >
                    <input
                      type="checkbox"
                      id="showFuriganaOnFront"
                      checked={settings.flashcard.showFuriganaOnFront}
                      onChange={(e) => updateFlashcardSetting('showFuriganaOnFront', e.target.checked)}
                      className="mt-1 w-5 h-5 text-[var(--color-accent-primary)] rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-[var(--color-text-primary)]">
                        Show Furigana on Flashcard Front
                      </span>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        Display hiragana reading (furigana) above kanji on the front of flashcards
                      </p>
                      <div className="mt-2 text-sm">
                        <span className="text-[var(--color-text-muted)]">Example: </span>
                        <ruby className="text-lg text-[var(--color-text-secondary)]">
                          食べる
                          <rt className="text-xs text-[var(--color-text-muted)]">{settings.flashcard.showFuriganaOnFront ? 'たべる' : ''}</rt>
                        </ruby>
                      </div>
                    </div>
                  </label>

                  <label
                    htmlFor="showRomajiOnFront"
                    className="flex items-start gap-4 p-4 glass rounded-xl cursor-pointer hover:bg-[var(--color-surface-overlay)] transition-all"
                  >
                    <input
                      type="checkbox"
                      id="showRomajiOnFront"
                      checked={settings.flashcard.showRomajiOnFront}
                      onChange={(e) => updateFlashcardSetting('showRomajiOnFront', e.target.checked)}
                      className="mt-1 w-5 h-5 text-[var(--color-accent-primary)] rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-[var(--color-text-primary)]">
                        Show Romaji on Flashcard Front
                      </span>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        Display romanized reading (romaji) on the front of flashcards
                      </p>
                      <div className="mt-2 text-sm">
                        <span className="text-[var(--color-text-muted)]">Example: </span>
                        <span className="text-lg text-[var(--color-text-secondary)]">食べる</span>
                        {settings.flashcard.showRomajiOnFront && (
                          <span className="ml-2 text-[var(--color-text-muted)]">(taberu)</span>
                        )}
                      </div>
                    </div>
                  </label>

                  <div className="p-4 glass rounded-xl bg-ocean-500/10 border border-ocean-500/30">
                    <p className="text-sm text-ocean-600 dark:text-ocean-400">
                      <strong>Note:</strong> The back of the flashcard will always show all information including kanji, furigana, romaji, and meaning.
                    </p>
                  </div>
                </div>
              </div>

              {/* MCQ Settings Section */}
              <div>
                <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4 pb-2 border-b border-[var(--color-border)]">
                  Multiple Choice Quiz Settings
                </h3>

                <div className="space-y-4">
                  <label
                    htmlFor="mcqShowFurigana"
                    className="flex items-start gap-4 p-4 glass rounded-xl cursor-pointer hover:bg-[var(--color-surface-overlay)] transition-all"
                  >
                    <input
                      type="checkbox"
                      id="mcqShowFurigana"
                      checked={settings.mcq.showFurigana}
                      onChange={(e) => updateMcqSetting('showFurigana', e.target.checked)}
                      className="mt-1 w-5 h-5 text-[var(--color-accent-primary)] rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-[var(--color-text-primary)]">
                        Show Furigana in Questions
                      </span>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        Display hiragana reading (furigana) above kanji in MCQ questions
                      </p>
                    </div>
                  </label>

                  <label
                    htmlFor="mcqShowRomaji"
                    className="flex items-start gap-4 p-4 glass rounded-xl cursor-pointer hover:bg-[var(--color-surface-overlay)] transition-all"
                  >
                    <input
                      type="checkbox"
                      id="mcqShowRomaji"
                      checked={settings.mcq.showRomaji}
                      onChange={(e) => updateMcqSetting('showRomaji', e.target.checked)}
                      className="mt-1 w-5 h-5 text-[var(--color-accent-primary)] rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-[var(--color-text-primary)]">
                        Show Romaji in Questions
                      </span>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        Display romanized reading (romaji) in MCQ questions
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Smart Quiz Settings Section */}
              <div>
                <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4 pb-2 border-b border-[var(--color-border)]">
                  Smart Quiz Settings
                </h3>

                <div className="space-y-4">
                  <label
                    htmlFor="smartQuizShowFuriganaOnFront"
                    className="flex items-start gap-4 p-4 glass rounded-xl cursor-pointer hover:bg-[var(--color-surface-overlay)] transition-all"
                  >
                    <input
                      type="checkbox"
                      id="smartQuizShowFuriganaOnFront"
                      checked={settings.smartQuiz.showFuriganaOnFront}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        smartQuiz: { ...prev.smartQuiz, showFuriganaOnFront: e.target.checked }
                      }))}
                      className="mt-1 w-5 h-5 text-[var(--color-accent-primary)] rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-[var(--color-text-primary)]">Show Furigana on Front</span>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">Display furigana before revealing the answer</p>
                    </div>
                  </label>

                  <label
                    htmlFor="smartQuizShowRomajiOnFront"
                    className="flex items-start gap-4 p-4 glass rounded-xl cursor-pointer hover:bg-[var(--color-surface-overlay)] transition-all"
                  >
                    <input
                      type="checkbox"
                      id="smartQuizShowRomajiOnFront"
                      checked={settings.smartQuiz.showRomajiOnFront}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        smartQuiz: { ...prev.smartQuiz, showRomajiOnFront: e.target.checked }
                      }))}
                      className="mt-1 w-5 h-5 text-[var(--color-accent-primary)] rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-[var(--color-text-primary)]">Show Romaji on Front</span>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">Display romaji before revealing the answer</p>
                    </div>
                  </label>

                  <label
                    htmlFor="smartQuizShowImageOnFront"
                    className="flex items-start gap-4 p-4 glass rounded-xl cursor-pointer hover:bg-[var(--color-surface-overlay)] transition-all"
                  >
                    <input
                      type="checkbox"
                      id="smartQuizShowImageOnFront"
                      checked={settings.smartQuiz.showImageOnFront}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        smartQuiz: { ...prev.smartQuiz, showImageOnFront: e.target.checked }
                      }))}
                      className="mt-1 w-5 h-5 text-[var(--color-accent-primary)] rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-[var(--color-text-primary)]">Show Image on Front</span>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">Display the word image on the front of the card</p>
                    </div>
                  </label>

                  <label
                    htmlFor="smartQuizShowImageOnBack"
                    className="flex items-start gap-4 p-4 glass rounded-xl cursor-pointer hover:bg-[var(--color-surface-overlay)] transition-all"
                  >
                    <input
                      type="checkbox"
                      id="smartQuizShowImageOnBack"
                      checked={settings.smartQuiz.showImageOnBack}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        smartQuiz: { ...prev.smartQuiz, showImageOnBack: e.target.checked }
                      }))}
                      className="mt-1 w-5 h-5 text-[var(--color-accent-primary)] rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-[var(--color-text-primary)]">Show Image on Back</span>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">Display the word image on the back of the card</p>
                    </div>
                  </label>

                  <label
                    htmlFor="smartQuizShowExamples"
                    className="flex items-start gap-4 p-4 glass rounded-xl cursor-pointer hover:bg-[var(--color-surface-overlay)] transition-all"
                  >
                    <input
                      type="checkbox"
                      id="smartQuizShowExamples"
                      checked={settings.smartQuiz.showExamples}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        smartQuiz: { ...prev.smartQuiz, showExamples: e.target.checked }
                      }))}
                      className="mt-1 w-5 h-5 text-[var(--color-accent-primary)] rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="block font-medium text-[var(--color-text-primary)]">Show Example Sentences</span>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">Display example sentences after revealing the answer</p>
                    </div>
                  </label>

                  {settings.smartQuiz.showExamples && (
                    <div className="p-4 glass rounded-xl">
                      <label htmlFor="numberOfExamples" className="block font-medium text-[var(--color-text-primary)] mb-2">
                        Number of Examples to Show
                      </label>
                      <select
                        id="numberOfExamples"
                        value={settings.smartQuiz.numberOfExamples}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          smartQuiz: { ...prev.smartQuiz, numberOfExamples: parseInt(e.target.value) }
                        }))}
                        className="input w-full py-2"
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

              {/* Save Button */}
              <div className="pt-4">
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 px-4 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </motion.button>

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500 text-sm text-center"
                  >
                    {success}
                  </motion.div>
                )}
              </div>
            </form>

            {/* Subscription Management Section */}
            <div className="mt-8 pt-8 border-t border-[var(--color-border)]">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                  Subscription
                </h3>
                <p className="text-[var(--color-text-muted)]">
                  Manage your Lexora Pro subscription
                </p>
              </div>
              <SubscriptionManagement />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
