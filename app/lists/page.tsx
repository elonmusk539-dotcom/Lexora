'use client';

import { motion } from 'framer-motion';
import { BookOpen, Lock, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useSubscription } from '@/lib/subscription/useSubscription';
import { FREE_TIER_LISTS, canAccessList } from '@/lib/subscription/config';

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
  const { subscription, isPro, loading: subLoading } = useSubscription();

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

  if (loading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vocabulary Lists</h2>
            </div>
            {!isPro && (
              <Link
                href="/premium"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                <Crown className="w-4 h-4" />
                <span className="text-sm font-semibold">Upgrade to Pro</span>
              </Link>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {isPro 
              ? 'Browse and study all available word collections'
              : `You have access to ${FREE_TIER_LISTS.length} free lists. Upgrade to unlock all lists!`
            }
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
            {lists.map((list, index) => {
              const isLocked = !canAccessList(subscription.tier, list.name);
              
              return (
                <motion.div
                  key={list.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {isLocked ? (
                    <div className="relative block p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 opacity-75">
                      <div className="absolute top-4 right-4">
                        <Lock className="w-5 h-5 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {list.name}
                      </h3>
                      {list.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{list.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {list.word_count} word{list.word_count !== 1 ? 's' : ''}
                        </span>
                        <Link
                          href="/premium"
                          className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                        >
                          <Crown className="w-4 h-4" />
                          Upgrade to unlock
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={`/lists/${list.id}`}
                      className="block p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg transition-all"
                    >
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {list.name}
                      </h3>
                      {list.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{list.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {list.word_count} word{list.word_count !== 1 ? 's' : ''}
                        </span>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          View →
                        </span>
                      </div>
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
