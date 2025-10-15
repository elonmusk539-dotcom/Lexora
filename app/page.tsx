'use client';

import { motion } from 'framer-motion';
import { Filter, LogOut, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WordListItem } from '@/components/WordListItem';
import { WordDetailsCard, type Word } from '@/components/WordDetailsCard';

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
      const { data: wordsData, error: wordsError } = await supabase
        .from('vocabulary_words')
        .select('*')
        .order('created_at', { ascending: true });

      if (wordsError) throw wordsError;
      setWords(wordsData || []);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Lexora</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/lists"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">Lists</span>
              </Link>
              <Link
                href="/quiz"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Quiz
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-700 hover:text-red-600 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4 flex-wrap"
        >
          <div className="flex items-center gap-2 text-gray-700">
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
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {f === 'all' && 'All Words'}
                {f === 'started' && 'In Progress'}
                {f === 'not-started' && 'Not Started'}
                {f === 'mastered' && 'Mastered'}
              </button>
            ))}
          </div>
          <div className="ml-auto text-sm text-gray-600">
            {filteredWords.length} word{filteredWords.length !== 1 ? 's' : ''}
          </div>
        </motion.div>

        {filteredWords.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-gray-600 text-lg">
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
