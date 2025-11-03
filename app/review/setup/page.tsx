'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { Brain, Clock, List, Info } from 'lucide-react';
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const uid = session.user.id;
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mb-3 sm:mb-4">
              <Brain className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Setup Smart Quiz (SRS)
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Configure your personalized review session
            </p>
          </div>

          {/* Info Box */}
          <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-start gap-2 sm:gap-3">
              <Info className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-purple-900 dark:text-purple-100">
                  <strong>Smart Quiz uses spaced repetition</strong> to optimize your learning. 
                  Words due for review will be shown first, followed by new words from your selected lists.{' '}
                  <button 
                    onClick={() => router.push('/faq')}
                    className="underline hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    Learn more in our FAQ
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* List Selection */}
          <div className="mb-6 sm:mb-8">
            <label className="block text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Select Lists
            </label>
            <button
              type="button"
              onClick={() => setShowListModal(true)}
              className="w-full p-4 sm:p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 transition-all text-left"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-1">
                    {selectedLists.length === 0
                      ? 'No lists selected'
                      : `${selectedLists.length} list${selectedLists.length === 1 ? '' : 's'} selected`}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                    {selectedLists.length === 0
                      ? 'Click to select lists'
                      : lists
                          .filter(list => selectedLists.includes(list.id))
                          .map(list => list.name)
                          .join(', ')}
                  </p>
                </div>
                <List className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              </div>
            </button>
          </div>

          {/* Duration Selection */}
          <div className="mb-8">
            <label className="block text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              <Clock className="inline w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Review Duration (words)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
              {([5, 10, 15, 20] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${
                    duration === d
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {d}
                </button>
              ))}
              <button
                onClick={() => setDuration('custom')}
                className={`py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all col-span-3 sm:col-span-1 ${
                  duration === 'custom'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Custom
              </button>
            </div>
            {duration === 'custom' && (
              <div className="mt-4">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter number of words (1-100)"
                />
              </div>
            )}
          </div>

          {/* Start Button */}
          <button
            onClick={startReview}
            disabled={selectedLists.length === 0}
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-base sm:text-lg hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            Start Smart Quiz
          </button>
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
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 p-4 sm:p-6"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Select Lists</h3>
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                  >
                    {selectedLists.length === lists.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto mb-3 sm:mb-4">
                  <div className="space-y-2">
                    {lists.map((list) => (
                      <label
                        key={list.id}
                        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLists.includes(list.id)}
                          onChange={() => toggleList(list.id)}
                          className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 rounded focus:ring-0 focus:ring-offset-0 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{list.name}</div>
                            {list.isCustom && (
                              <span className="px-1.5 sm:px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
                                Custom
                              </span>
                            )}
                          </div>
                          {list.description && (
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{list.description}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {selectedLists.length} of {lists.length} selected
                  </p>
                  <button
                    onClick={() => setShowListModal(false)}
                    className="px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
