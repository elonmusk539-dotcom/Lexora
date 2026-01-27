'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Sparkles, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/Pagination';
import { WordListItem } from '@/components/WordListItem';
import { WordDetailsCard, type Word } from '@/components/WordDetailsCard';
import { FREE_TIER_LISTS, type SubscriptionTier } from '@/lib/subscription/config';
import { SearchBar } from '@/components/SearchBar';

type FilterType = 'all' | 'started' | 'not-started' | 'mastered';

interface UserProgress {
  word_id: string;
  correct_streak: number;
  is_mastered: boolean;
}

export default function Home() {
  const [words, setWords] = useState<Word[]>([]);
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomWords, setShowCustomWords] = useState(true);
  const [userTier, setUserTier] = useState<SubscriptionTier>('free');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const router = useRouter();

  useEffect(() => {
    checkUser();
    fetchWordsAndProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    }
  };

  const fetchWordsAndProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch user's subscription status
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', session.user.id)
        .single();

      const isPro = subscription?.status === 'active' &&
        new Date(subscription.current_period_end) > new Date();
      setUserTier(isPro ? 'pro' : 'free');

      // Fetch regular vocabulary words
      const { data: regularWords, error: wordsError } = await supabase
        .from('vocabulary_words')
        .select(`
          *,
          vocabulary_lists!inner(name)
        `)
        .order('created_at', { ascending: true });

      if (wordsError) throw wordsError;

      // Fetch user's custom words
      const { data: customWords, error: customError } = await supabase
        .from('user_custom_words')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (customError) throw customError;

      // Combine both types of words
      interface CustomWord {
        id: string;
        kanji: string;
        furigana: string | null;
        romaji: string | null;
        meaning: string;
        pronunciation_url: string;
        image_url: string;
        examples: Array<{ kanji: string; furigana: string; romaji: string; translation: string }> | null;
        [key: string]: unknown;
      }

      interface VocabularyWord {
        id: string;
        word: string;
        reading: string | null;
        meaning: string;
        pronunciation_url: string;
        image_url: string;
        examples: string[];
        vocabulary_lists: { name: string };
        [key: string]: unknown;
      }

      const allWords = [
        ...(regularWords || []).map((w: VocabularyWord) => ({
          ...w,
          list_name: w.vocabulary_lists.name,
        } as Word & { list_name: string })),
        ...(customWords || []).map((w: CustomWord) => ({
          ...w,
          word: w.kanji, // Map kanji to word for consistency
          reading: w.romaji,
          word_type: 'custom',
          // Convert JSONB examples to string array format for WordDetailsCard
          examples: w.examples ?
            w.examples.map((ex) =>
              `${ex.kanji}|${ex.furigana}|${ex.romaji}|${ex.translation}`
            ) : []
        } as Word))
      ];

      setWords(allWords);

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', session.user.id);

      if (progressError) throw progressError;

      const progressMap: Record<string, UserProgress> = {};
      (progressData || []).forEach((p: { word_id: string; correct_streak: number; is_mastered: boolean }) => {
        progressMap[p.word_id] = {
          word_id: p.word_id,
          correct_streak: p.correct_streak,
          is_mastered: p.is_mastered,
        };
      });
      setProgress(progressMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (wordId: string) => {
    const wordProgress = progress[wordId];
    if (!wordProgress) return { progress: 0, isMastered: false };

    const progressPercent = (wordProgress.correct_streak / 7) * 100;
    return {
      progress: Math.min(progressPercent, 100),
      isMastered: wordProgress.is_mastered,
    };
  };

  const filteredWords = words.filter((word) => {
    const wordProgress = progress[word.id];

    // Filter by subscription tier - free users only see words from free lists
    if (userTier === 'free') {
      const wordWithList = word as Word & { list_name?: string };
      if (wordWithList.list_name && !FREE_TIER_LISTS.includes(wordWithList.list_name)) {
        return false;
      }
    }

    // Apply status filter
    let matchesFilter = false;
    switch (filter) {
      case 'started':
        matchesFilter = wordProgress && wordProgress.correct_streak > 0 && !wordProgress.is_mastered;
        break;
      case 'not-started':
        matchesFilter = !wordProgress || wordProgress.correct_streak === 0;
        break;
      case 'mastered':
        matchesFilter = wordProgress && wordProgress.is_mastered;
        break;
      case 'all':
      default:
        matchesFilter = true;
    }

    if (!matchesFilter) return false;

    // Apply custom words filter
    if (!showCustomWords && 'word_type' in word && word.word_type === 'custom') {
      return false;
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        (word.kanji?.toLowerCase().includes(query)) ||
        (word.word?.toLowerCase().includes(query)) ||
        (word.furigana?.toLowerCase().includes(query)) ||
        (word.romaji?.toLowerCase().includes(query)) ||
        (word.meaning?.toLowerCase().includes(query));

      return matchesSearch;
    }

    return true;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, showCustomWords]);

  const paginatedWords = filteredWords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 space-y-4"
        >
          {/* Top Row - Filter Toggle and Search */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 glass rounded-xl transition-all ${showFilters ? 'ring-2 ring-[var(--color-accent-primary)]' : ''}`}
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-accent-primary)]" />
                <span className="text-sm sm:text-base font-medium text-[var(--color-text-secondary)]">
                  {showFilters ? 'Hide Filters' : 'Filters'}
                </span>
              </motion.button>

              <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg">
                <Sparkles className="w-4 h-4 text-coral-500" />
                <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  {filteredWords.length}
                </span>
                <span className="text-sm text-[var(--color-text-muted)]">
                  word{filteredWords.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Search input - Always visible */}
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search words..."
              className="flex-1 min-w-[200px] sm:min-w-[250px] max-w-sm"
            />
          </div>

          {/* Collapsible Filter Section */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Filter Buttons */}
                <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-col sm:flex-row">
                  <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                    {(['all', 'started', 'not-started', 'mastered'] as FilterType[]).map((f) => (
                      <motion.button
                        key={f}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${filter === f
                          ? 'bg-gradient-to-r from-ocean-600 to-ocean-500 text-white'
                          : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]'
                          }`}
                      >
                        {f === 'all' && 'All'}
                        {f === 'started' && 'In Progress'}
                        {f === 'not-started' && 'Not Started'}
                        {f === 'mastered' && 'Mastered'}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Custom Words Toggle */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                  <label className="flex items-center gap-3 cursor-pointer px-4 py-2.5 glass rounded-xl hover:bg-[var(--color-surface-overlay)] transition-all w-full sm:w-auto">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={showCustomWords}
                        onChange={(e) => setShowCustomWords(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-[var(--color-border)] rounded-full peer-checked:bg-gradient-to-r peer-checked:from-ocean-600 peer-checked:to-ocean-500 transition-all"></div>
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md peer-checked:translate-x-4 transition-transform"></div>
                    </div>
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                      Show Custom Words
                    </span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {filteredWords.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-ocean-500/20 to-ocean-600/20 flex items-center justify-center">
              <Search className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[var(--color-text-muted)] text-lg font-medium">
              No words found
            </p>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">
              Try adjusting your filters or search query
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:gap-4">
              {paginatedWords.map((word, index) => {
                const { progress: wordProgress, isMastered } = getProgress(word.id);
                return (
                  <motion.div
                    key={word.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <WordListItem
                      word={word}
                      progress={wordProgress}
                      isMastered={isMastered}
                      onClick={() => setSelectedWord(word)}
                    />
                  </motion.div>
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredWords.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={filteredWords.length}
            />
          </div>
        )}
      </main>

      {selectedWord && (
        <WordDetailsCard
          word={selectedWord}
          isOpen={!!selectedWord}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}
