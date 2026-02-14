'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Clock, List, Brain, Layers, Sparkles } from 'lucide-react';
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUserId(user.id);

    // Load saved preferences
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('settings')
      .eq('user_id', user.id)
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
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-600 shadow-glow">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">Start a Quiz</h2>
          </div>
          <p className="text-[var(--color-text-muted)] mb-8">
            Choose your quiz type, select lists, and set duration
          </p>

          {/* Quiz Type Selection */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              <Layers className="w-5 h-5 text-[var(--color-accent-primary)]" />
              Quiz Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setQuizType('mcq')}
                className={`p-5 sm:p-6 rounded-xl border-2 transition-all ${quizType === 'mcq'
                  ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                  : 'border-[var(--color-border)] glass hover:border-[var(--color-border-focus)]'
                  }`}
              >
                <h3 className="text-base sm:text-xl font-bold text-[var(--color-text-primary)] mb-2">
                  Multiple Choice
                </h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Choose the correct meaning from 4 options
                </p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setQuizType('flashcard')}
                className={`p-5 sm:p-6 rounded-xl border-2 transition-all ${quizType === 'flashcard'
                  ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                  : 'border-[var(--color-border)] glass hover:border-[var(--color-border-focus)]'
                  }`}
              >
                <h3 className="text-base sm:text-xl font-bold text-[var(--color-text-primary)] mb-2">
                  Flashcards
                </h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Review words and rate your knowledge
                </p>
              </motion.button>
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
              Quiz Duration (words)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([5, 10, 15] as const).map((d) => (
                <motion.button
                  key={d}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDuration(d)}
                  className={`py-3 rounded-xl font-semibold transition-all ${duration === d
                    ? 'bg-gradient-to-r from-ocean-600 to-ocean-500 text-white shadow-glow'
                    : 'glass text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]'
                    }`}
                >
                  {d}
                </motion.button>
              ))}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDuration('custom')}
                className={`py-3 rounded-xl font-semibold transition-all ${duration === 'custom'
                  ? 'bg-gradient-to-r from-ocean-600 to-ocean-500 text-white shadow-glow'
                  : 'glass text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]'
                  }`}
              >
                Custom
              </motion.button>
            </div>
            {duration === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4"
              >
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
                  className="input w-full py-3"
                  placeholder="Enter number of words (1-100)"
                />
              </motion.div>
            )}
          </div>

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startQuiz}
            className="w-full py-4 bg-gradient-to-r from-coral-500 to-coral-400 text-white rounded-xl font-bold text-lg shadow-glow-coral transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
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
