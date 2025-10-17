'use client';

import { motion } from 'framer-motion';
import { Filter, ArrowLeft } from 'lucide-react';
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

interface CustomList {
  id: string;
  name: string;
  description: string | null;
}

export default function CustomListDetailPage() {
  const params = useParams();
  const listId = params.id as string;
  const [list, setList] = useState<CustomList | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch custom list details
      const { data: listData, error: listError } = await supabase
        .from('user_custom_lists')
        .select('*')
        .eq('id', listId)
        .eq('user_id', session.user.id)
        .single();

      if (listError) throw listError;
      setList(listData);

      // Fetch words for this custom list from user_custom_list_words
      const { data: wordsData, error: wordsError } = await supabase
        .from('user_custom_list_words')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: true });

      if (wordsError) throw wordsError;
      setWords(wordsData || []);

      // Fetch user progress for these custom words
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
    
    switch (filter) {
      case 'started':
        return wordProgress && wordProgress.correct_streak > 0 && !wordProgress.is_mastered;
      case 'not-started':
        return !wordProgress || wordProgress.correct_streak === 0;
      case 'mastered':
        return wordProgress && wordProgress.is_mastered;
      case 'all':
      default:
        return true;
    }
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
          <p className="text-gray-600 dark:text-gray-400 mb-4">Custom list not found</p>
          <Link href="/my-lists" className="text-blue-600 dark:text-blue-400 hover:underline">
            Back to My Lists
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button and list title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/my-lists"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Lists
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{list.name}</h2>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-medium rounded-full">
              Custom
            </span>
          </div>
          {list.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">{list.description}</p>
          )}
        </motion.div>

        {/* Filter section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4 flex-wrap"
        >
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filter:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'started', 'not-started', 'mastered'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {f === 'all' && 'All Words'}
                {f === 'started' && 'In Progress'}
                {f === 'not-started' && 'Not Started'}
                {f === 'mastered' && 'Mastered'}
              </button>
            ))}
          </div>
          <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
            {filteredWords.length} word{filteredWords.length !== 1 ? 's' : ''}
          </div>
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
