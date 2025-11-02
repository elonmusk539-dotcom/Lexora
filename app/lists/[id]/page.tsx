'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ArrowLeft, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { WordListItem } from '@/components/WordListItem';
import { WordDetailsCard, type Word } from '@/components/WordDetailsCard';
import { Header } from '@/components/Header';

type FilterType = 'all' | 'started' | 'not-started' | 'mastered';

interface UserProgress {
  word_id: string;
  correct_streak: number;
  is_mastered: boolean;
}

interface VocabularyList {
  id: string;
  name: string;
  description: string | null;
}

export default function ListDetailPage() {
  const params = useParams();
  const listId = params.id as string;
  const [list, setList] = useState<VocabularyList | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkUser();
    fetchListAndWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    }
  };

  const fetchListAndWords = async () => {
    try {
      // Fetch list details
      const { data: listData, error: listError } = await supabase
        .from('vocabulary_lists')
        .select('*')
        .eq('id', listId)
        .single();

      if (listError) throw listError;
      setList(listData);

      // Fetch words for this list
      const { data: wordsData, error: wordsError } = await supabase
        .from('vocabulary_words')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: true });

      if (wordsError) throw wordsError;
      setWords(wordsData || []);

      // Fetch user progress
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
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
      }
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
    
    // Apply filter
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

  if (!list) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">List not found</p>
          <Link href="/lists" className="text-blue-600 dark:text-blue-400 hover:underline">
            Back to Lists
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button and list title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/lists"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Lists
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{list.name}</h2>
          {list.description && (
            <p className="text-gray-600 dark:text-gray-400">{list.description}</p>
          )}
        </motion.div>

        {/* Filter section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 space-y-4"
        >
          {/* Top Row - Filter Toggle, Word Count, and Search */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
                <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </span>
              </button>
              
              <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                {filteredWords.length} word{filteredWords.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Search input - Always visible */}
            <div className="relative flex-1 min-w-[200px] sm:min-w-[250px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search words..."
                className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-full"
              />
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
                <div className="flex gap-2 flex-wrap">
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
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Words grid */}
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

      {/* Word details modal */}
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
