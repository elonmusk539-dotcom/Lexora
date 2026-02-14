'use client';

import { motion } from 'framer-motion';
import { BookOpen, Lock, Crown, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSubscription } from '@/lib/subscription/useSubscription';
import { FREE_TIER_LISTS, canAccessList } from '@/lib/subscription/config';
import { SearchBar } from '@/components/SearchBar';

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
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
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-primary)]"></div>
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
    <div className="min-h-screen bg-mesh">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="mb-6 sm:mb-8 space-y-4">
          {/* Top Row - Title with count and Search */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-600 shadow-glow">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
                  Vocabulary Lists
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-3.5 h-3.5 text-coral-500" />
                  <span className="text-[var(--color-text-muted)]">
                    {filteredLists.length} list{filteredLists.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Search input */}
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search lists..."
              className="flex-1 min-w-[200px] sm:min-w-[250px] max-w-sm"
            />
          </div>

          {/* Info message */}
          <div className="p-3 glass rounded-xl">
            <p className="text-sm text-[var(--color-text-muted)]">
              {isPro
                ? '✨ You have access to all vocabulary lists'
                : `Free plan: Access to ${FREE_TIER_LISTS.length} lists. Upgrade to Pro for all lists!`
              }
            </p>
          </div>
        </div>

        {filteredLists.length === 0 ? (
          <div
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-ocean-500/20 to-ocean-600/20 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[var(--color-text-muted)] text-lg font-medium">
              {searchQuery.trim() ? 'No lists match your search' : 'No vocabulary lists available'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredLists.map((list, index) => {
                const isLocked = !canAccessList(subscription?.tier || 'free', list.name);

                return (
                  <div
                    key={list.id}
                  >
                    {isLocked ? (
                      <div className="relative p-5 sm:p-6 card opacity-75 cursor-not-allowed">
                        <div className="absolute top-4 right-4 p-2 rounded-lg bg-[var(--color-surface-overlay)]">
                          <Lock className="w-4 h-4 text-[var(--color-text-muted)]" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)] mb-2 pr-10">
                          {list.name}
                        </h3>
                        {list.description && (
                          <p className="text-sm text-[var(--color-text-muted)] mb-4 line-clamp-2">{list.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[var(--color-text-muted)]">
                            {list.word_count} word{list.word_count !== 1 ? 's' : ''}
                          </span>
                          <span className="badge badge-pro flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Pro
                          </span>
                        </div>
                      </div>
                    ) : (
                      <Link href={`/lists/${list.id}`}>
                        <div
                          className="p-5 sm:p-6 card cursor-pointer group active:scale-[0.99]"
                        >
                          <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)] mb-2 transition-colors">
                            {list.name}
                          </h3>
                          {list.description && (
                            <p className="text-sm text-[var(--color-text-muted)] mb-4 line-clamp-2">{list.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-muted)]">
                              {list.word_count} word{list.word_count !== 1 ? 's' : ''}
                            </span>
                            <span className="text-sm font-semibold text-[var(--color-accent-primary)] transition-transform">
                              View →
                            </span>
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
