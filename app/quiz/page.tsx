'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Clock, List } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { FREE_TIER_LISTS } from '@/lib/subscription/config';

type QuizType = 'mcq' | 'flashcard';
type QuizDuration = 5 | 10 | 15 | 20 | 'custom';

interface VocabularyList {
  id: string;
  name: string;
  description: string | null;
  isCustom?: boolean;
}

interface UserSettings {
  quiz?: {
    lastQuizType?: QuizType;
    lastDuration?: QuizDuration;
    customDuration?: number;
    lastSelectedLists?: string[];
  };
}

export default function QuizPage() {
  const [quizType, setQuizType] = useState<QuizType>('mcq');
  const [duration, setDuration] = useState<QuizDuration>(10);
  const [customDuration, setCustomDuration] = useState<number>(10);
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showListModal, setShowListModal] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setUserId(session.user.id);
    
    // Load saved preferences
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('settings')
      .eq('user_id', session.user.id)
      .single();

    let savedListIds: string[] = [];
    if (profile && profile.settings) {
      const settings = profile.settings as UserSettings;
      if (settings.quiz) {
        if (settings.quiz.lastQuizType) setQuizType(settings.quiz.lastQuizType);
        if (settings.quiz.lastDuration) setDuration(settings.quiz.lastDuration);
        if (settings.quiz.customDuration) setCustomDuration(settings.quiz.customDuration);
        if (settings.quiz.lastSelectedLists && settings.quiz.lastSelectedLists.length > 0) {
          savedListIds = settings.quiz.lastSelectedLists;
          setSelectedLists(savedListIds);
        }
      }
    }

    // Fetch lists after loading preferences
    await fetchLists(savedListIds);
  };

  const fetchLists = async (savedListIds: string[] = []) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user's subscription status
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', user.id)
        .single();

  const isPro = subscription?.status === 'active' && 
        new Date(subscription.current_period_end) > new Date();

      // Fetch default vocabulary lists
      const { data: defaultLists, error: defaultError } = await supabase
        .from('vocabulary_lists')
        .select('id, name, description')
        .order('created_at', { ascending: true });

      if (defaultError) throw defaultError;

      // Filter lists based on subscription tier
      let filteredDefaultLists = defaultLists || [];
      if (!isPro) {
        filteredDefaultLists = filteredDefaultLists.filter(
          (list: VocabularyList) => FREE_TIER_LISTS.includes(list.name)
        );
      }

      // Fetch user's custom lists
      const { data: customLists } = await supabase
        .from('user_custom_lists')
        .select('id, name, description')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Combine both lists
      const allLists = [
        ...filteredDefaultLists,
        ...(customLists || []).map(list => ({ ...list, isCustom: true }))
      ];

      setLists(allLists);
      
      // Only select all lists if there are no saved preferences
      if (savedListIds.length === 0) {
        setSelectedLists(allLists.map((list: VocabularyList) => list.id));
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoading(false);
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
      setSelectedLists(lists.map(list => list.id));
    }
  };

  const startQuiz = async () => {
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
        quiz: {
          lastQuizType: quizType,
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
    router.push(`/quiz/${quizType}?duration=${actualDuration}&lists=${listIds}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Start a Normal Quiz</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Choose your quiz type, select lists, and set duration
          </p>

          {/* Quiz Type Selection */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quiz Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setQuizType('mcq')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  quizType === 'mcq'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Multiple Choice
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose the correct meaning from 4 options
                </p>
              </button>

              <button
                onClick={() => setQuizType('flashcard')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  quizType === 'flashcard'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Flashcards
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review words and rate your knowledge
                </p>
              </button>
            </div>
          </div>

          {/* List Selection */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Lists
            </label>
            <button
              type="button"
              onClick={() => setShowListModal(true)}
              className="w-full p-4 sm:p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-1">
                    {selectedLists.length === 0
                      ? 'No lists selected'
                      : `${selectedLists.length} list${selectedLists.length === 1 ? '' : 's'} selected`}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedLists.length === 0
                      ? 'Click to select lists'
                      : lists
                          .filter(list => selectedLists.includes(list.id))
                          .map(list => list.name)
                          .join(', ')}
                  </p>
                </div>
                <List className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
            </button>
          </div>

          {/* Duration Selection */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <Clock className="inline w-5 h-5 mr-2" />
              Quiz Duration (words)
            </label>
            <div className="grid grid-cols-5 gap-3">
              {([5, 10, 15, 20] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`py-3 rounded-lg font-semibold transition-all ${
                    duration === d
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {d}
                </button>
              ))}
              <button
                onClick={() => setDuration('custom')}
                className={`py-3 rounded-lg font-semibold transition-all ${
                  duration === 'custom'
                    ? 'bg-blue-600 text-white shadow-md'
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
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="1"
                  max="100"
                  value={customDuration}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setCustomDuration(1);
                    } else {
                      const num = parseInt(val, 10);
                      if (!isNaN(num)) {
                        setCustomDuration(Math.max(1, Math.min(100, num)));
                      }
                    }
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
                  placeholder="Enter number of words (1-100)"
                />
              </div>
            )}
          </div>

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startQuiz}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Start Quiz
          </motion.button>
        </motion.div>
      </main>

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
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 p-4 sm:p-6"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Select Lists</h3>
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    {selectedLists.length === lists.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto mb-4">
                  <div className="space-y-2">
                    {lists.map((list) => (
                      <label
                        key={list.id}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLists.includes(list.id)}
                          onChange={() => toggleList(list.id)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-0 focus:ring-offset-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-gray-900 dark:text-white">{list.name}</div>
                            {list.isCustom && (
                              <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
                                Custom
                              </span>
                            )}
                          </div>
                          {list.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{list.description}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    {selectedLists.length} of {lists.length} lists selected
                  </p>
                  <button
                    onClick={() => setShowListModal(false)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
