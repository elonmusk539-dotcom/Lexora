'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { WordListItem } from '@/components/WordListItem';
import { WordDetailsCard, type Word } from '@/components/WordDetailsCard';
import { Header } from '@/components/Header';
import { FREE_TIER_LISTS, type SubscriptionTier } from '@/lib/subscription/config';

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
        .order('created_at', { ascending: true});

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 space-y-4"
        >
          {/* Filter Toggle Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
              <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </span>
            </button>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {filteredWords.length} word{filteredWords.length !== 1 ? 's' : ''}
            </div>
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
                <div className="flex items-start sm:items-center gap-2 sm:gap-4 flex-col sm:flex-row">
                  <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                    {(['all', 'started', 'not-started', 'mastered'] as FilterType[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${
                          filter === f
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        {f === 'all' && 'All'}
                        {f === 'started' && 'In Progress'}
                        {f === 'not-started' && 'Not Started'}
                        {f === 'mastered' && 'Mastered'}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Custom Words Toggle and Search */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                  {/* Custom Words Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full sm:w-auto">
                    <input
                      type="checkbox"
                      checked={showCustomWords}
                      onChange={(e) => setShowCustomWords(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show Custom Words
                    </span>
                  </label>
                  
                  {/* Search input */}
                  <div className="relative sm:ml-auto w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search words..."
                      className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-full sm:min-w-[200px]"
                    />
                  </div>
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
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No words found. Try adjusting your filters.
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredWords.map((word, index) => {
              const { progress: wordProgress, isMastered } = getProgress(word.id);
              return (
                <motion.div
                  key={word.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
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
