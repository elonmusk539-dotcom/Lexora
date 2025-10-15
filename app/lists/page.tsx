'use client';

import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';

interface VocabularyList {
  id: string;
  name: string;
  description: string | null;
  language: string;
  word_count?: number;
}

export default function ListsPage() {
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
    fetchLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    }
  };

  const fetchLists = async () => {
    try {
      const { data: listsData, error } = await supabase
        .from('vocabulary_lists')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get word count for each list
      const listsWithCount = await Promise.all(
        (listsData || []).map(async (list: VocabularyList) => {
          const { count } = await supabase
            .from('vocabulary_words')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id);

          return {
            ...list,
            word_count: count || 0,
          };
        })
      );

      setLists(listsWithCount);
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Vocabulary Lists</h2>
          </div>
          <p className="text-gray-600">
            Browse and study different word collections
          </p>
        </motion.div>

        {lists.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-gray-600 text-lg">
              No vocabulary lists available yet.
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list, index) => (
              <motion.div
                key={list.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={`/lists/${list.id}`}
                  className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {list.name}
                  </h3>
                  {list.description && (
                    <p className="text-gray-600 mb-4">{list.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {list.word_count} word{list.word_count !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm font-medium text-blue-600">
                      View →
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
