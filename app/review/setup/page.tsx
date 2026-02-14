'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { Brain, Clock, List, Info, Sparkles } from 'lucide-react';
import { FREE_TIER_LISTS } from '@/lib/subscription/config';

type QuizDuration = 5 | 10 | 15 | 20 | 'custom';

interface VocabularyList {
  id: string;
  name: string;
  description: string | null;
  isCustom?: boolean;
}

// Due words preview interface - to be used when implementing preview feature
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface DueWord {
  id: string;
  word: string;
  kanji?: string;
  meaning: string;
  list_name: string;
  next_review_date: string | null;
}

interface UserSettings {
  review?: {
    lastDuration?: QuizDuration;
    customDuration?: number;
    lastSelectedLists?: string[];
  };
}

export default function SmartQuizSetupPage() {
  const router = useRouter();
  const [duration, setDuration] = useState<QuizDuration>(10);
  const [customDuration, setCustomDuration] = useState<number>(10);
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [showListModal, setShowListModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  // Due words preview state - to be implemented in future
  // const [dueWords, setDueWords] = useState<Record<string, DueWord[]>>({});
  // const [showDueWords, setShowDueWords] = useState(false);
  // const [loadingDueWords, setLoadingDueWords] = useState(false);

  useEffect(() => {
    checkUserAndLoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUserAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const uid = user.id;
      setUserId(uid);

      // Load vocabulary lists
      await loadLists(uid);

      // Load saved preferences
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('settings')
        .eq('user_id', uid)
        .single();

      const settings = profile?.settings as UserSettings;
      if (settings?.review) {
        if (settings.review.lastDuration) setDuration(settings.review.lastDuration);
        if (settings.review.customDuration) setCustomDuration(settings.review.customDuration);
        if (settings.review.lastSelectedLists) {
          setSelectedLists(settings.review.lastSelectedLists);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLists = async (uid: string) => {
    try {
      // Fetch user's subscription status
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', uid)
        .single();

      const isPro = subscription?.status === 'active' &&
        new Date(subscription.current_period_end) > new Date();

      // Load default lists
      const { data: defaultLists } = await supabase
        .from('vocabulary_lists')
        .select('id, name, description')
        .order('name');

      // Filter lists based on subscription tier
      let filteredDefaultLists = defaultLists || [];
      if (!isPro) {
        filteredDefaultLists = filteredDefaultLists.filter(
          (list: VocabularyList) => FREE_TIER_LISTS.includes(list.name)
        );
      }

      // Load custom lists
      const { data: customLists } = await supabase
        .from('user_custom_lists')
        .select('id, name, description')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      const allLists = [
        ...filteredDefaultLists,
        ...(customLists || []).map(list => ({ ...list, isCustom: true })),
      ];

      setLists(allLists);

      // Auto-select all lists if none selected
      if (selectedLists.length === 0) {
        setSelectedLists(allLists.map(l => l.id));
      }
    } catch (error) {
      console.error('Error loading lists:', error);
    }
  };

  const toggleList = (listId: string) => {
    setSelectedLists(prev =>
      prev.includes(listId)
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLists.length === lists.length) {
      setSelectedLists([]);
    } else {
      setSelectedLists(lists.map(l => l.id));
    }
  };

  const startReview = async () => {
    if (selectedLists.length === 0) {
      alert('Please select at least one list');
      return;
    }

    // Save preferences
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('settings')
        .eq('user_id', userId)
        .single();

      const currentSettings = profile?.settings || {};
      const updatedSettings = {
        ...currentSettings,
        review: {
          lastDuration: duration,
          customDuration: customDuration,
          lastSelectedLists: selectedLists,
        },
      };

      await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          settings: updatedSettings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Continue anyway
    }

    const listIds = selectedLists.join(',');
    const actualDuration = duration === 'custom' ? customDuration : duration;
    router.push(`/review?duration=${actualDuration}&lists=${listIds}`);
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
      <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        <div className="card-elevated p-4 sm:p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-600 shadow-glow">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">Smart Quiz (SRS)</h2>
          </div>
          <p className="text-[var(--color-text-muted)] mb-8">
            Configure your personalized spaced repetition review session
          </p>

          {/* Info Box */}
          <div className="mb-8 p-4 glass rounded-xl border border-[var(--color-border)] bg-ocean-500/5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[var(--color-accent-primary)] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  <strong className="text-[var(--color-text-primary)]">Smart Quiz uses spaced repetition</strong> to optimize your learning.
                  Words due for review will be shown first, followed by new words from your selected lists.{' '}
                  <button
                    onClick={() => router.push('/faq')}
                    className="underline text-[var(--color-accent-primary)] hover:text-[var(--color-accent-secondary)]"
                  >
                    Learn more in our FAQ
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* List Selection */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              <List className="w-5 h-5 text-[var(--color-accent-primary)]" />
              Select Lists
            </label>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={() => setShowListModal(true)}
              className="w-full p-5 sm:p-6 rounded-xl glass border-2 border-[var(--color-border)] hover:border-[var(--color-border-focus)] transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)] mb-1">
                    {selectedLists.length === 0
                      ? 'No lists selected'
                      : `${selectedLists.length} list${selectedLists.length === 1 ? '' : 's'} selected`}
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)] line-clamp-1">
                    {selectedLists.length === 0
                      ? 'Click to select lists'
                      : lists
                        .filter(list => selectedLists.includes(list.id))
                        .map(list => list.name)
                        .join(', ')}
                  </p>
                </div>
                <div className="p-2 rounded-lg glass">
                  <List className="w-5 h-5 text-[var(--color-text-muted)]" />
                </div>
              </div>
            </motion.button>
          </div>

          {/* Duration Selection */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              <Clock className="w-5 h-5 text-[var(--color-accent-primary)]" />
              Review Duration (words)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([5, 10, 15] as const).map((d) => (
                <motion.button
                  key={d}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDuration(d)}
                  className={`py-3 rounded-xl font-semibold transition-colors duration-200 ${duration === d
                    ? 'bg-gradient-to-r from-ocean-600 to-ocean-500 text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]'
                    }`}
                >
                  {d}
                </motion.button>
              ))}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDuration('custom')}
                className={`py-3 rounded-xl font-semibold transition-colors duration-200 ${duration === 'custom'
                  ? 'bg-gradient-to-r from-ocean-600 to-ocean-500 text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]'
                  }`}
              >
                Custom
              </motion.button>
            </div>
            {duration === 'custom' && (
              <div className="mt-4">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="input w-full"
                  placeholder="Enter number of words (1-100)"
                />
              </div>
            )}
          </div>

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startReview}
            disabled={selectedLists.length === 0}
            className="w-full py-4 bg-gradient-to-r from-coral-500 to-coral-400 text-white rounded-xl font-bold text-lg shadow-glow-coral transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5" />
            Start Smart Quiz
          </motion.button>
        </div>
      </div>

      {/* List Selection Modal */}
      <AnimatePresence>
        {showListModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowListModal(false)}
              className="fixed inset-0 bg-night-400/70 z-40 backdrop-blur-md"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-full max-w-2xl glass-strong rounded-2xl shadow-xl z-50 flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[var(--color-border)] flex-shrink-0">
                <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">Select Lists</h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleSelectAll}
                  className="text-sm text-[var(--color-accent-primary)] hover:text-[var(--color-accent-secondary)] font-semibold transition-colors"
                >
                  {selectedLists.length === lists.length ? 'Deselect All' : 'Select All'}
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="space-y-2">
                  {lists.map((list) => (
                    <label
                      key={list.id}
                      className="flex items-center gap-3 p-4 glass rounded-xl cursor-pointer hover:bg-[var(--color-surface-overlay)] transition-all"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedLists.includes(list.id)}
                          onChange={() => toggleList(list.id)}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 border-2 border-[var(--color-border)] rounded-md peer-checked:border-[var(--color-accent-primary)] peer-checked:bg-[var(--color-accent-primary)] transition-all flex items-center justify-center">
                          <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[var(--color-text-primary)]">{list.name}</span>
                          {list.isCustom && (
                            <span className="badge badge-accent text-[10px]">
                              Custom
                            </span>
                          )}
                        </div>
                        {list.description && (
                          <p className="text-sm text-[var(--color-text-muted)] line-clamp-1">{list.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 sm:p-6 border-t border-[var(--color-border)] flex-shrink-0">
                <p className="text-sm text-[var(--color-text-muted)]">
                  {selectedLists.length} of {lists.length} selected
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowListModal(false)}
                  className="btn-primary px-6"
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
