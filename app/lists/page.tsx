'use client';

import { motion } from 'framer-motion';
import { BookOpen, Lock, Crown, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredLists = lists.filter((list) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        list.name.toLowerCase().includes(query) ||
        list.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 space-y-4"
        >
          {/* Top Row - Title with count and Search */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Vocabulary Lists
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {filteredLists.length} list{filteredLists.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Search input */}
            <div className="relative flex-1 min-w-[200px] sm:min-w-[250px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lists..."
                className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-full"
              />
            </div>
          </div>

          {/* Info message */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isPro
              ? 'Browse and study all available word collections'
              : `You have access to ${FREE_TIER_LISTS.length} free lists. Unlock all lists with Pro!`
            }
          </p>
        </motion.div>

        {filteredLists.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-gray-600 text-lg">
              {searchQuery.trim() ? 'No lists match your search.' : 'No vocabulary lists available yet.'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredLists.map((list, index) => {
                const isLocked = !canAccessList(subscription?.tier || 'free', list.name);

                return (
                  <motion.div
                    key={list.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {isLocked ? (
                      <div className="relative block p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 opacity-75">
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
                          <span className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            <Crown className="w-4 h-4" />
                            Pro Only
                          </span>
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={`/lists/${list.id}`}
                        className="block p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg transition-all"
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
          </div>
        )}
      </main>
    </div>
  );
}
