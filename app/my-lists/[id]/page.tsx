'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ArrowLeft, Search, Plus, Trash2, X, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Pagination } from '@/components/Pagination';
import { WordListItem } from '@/components/WordListItem';
import { WordDetailsCard, type Word } from '@/components/WordDetailsCard';
import { AddCustomWord } from '@/components/AddCustomWord';
import { useSubscription } from '@/lib/subscription/useSubscription';
import { canAccessList } from '@/lib/subscription/config';

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
  const { subscription, isPro } = useSubscription();
  const [showFilters, setShowFilters] = useState(false);
  const [list, setList] = useState<CustomList | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCustomWord, setShowAddCustomWord] = useState(false);
  const [showAddVocabWords, setShowAddVocabWords] = useState(false);
  const [availableWords, setAvailableWords] = useState<Word[]>([]);
  const [selectedWordsToAdd, setSelectedWordsToAdd] = useState<string[]>([]);
  const [vocabSearchQuery, setVocabSearchQuery] = useState('');
  const router = useRouter();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Reset page when filter or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  useEffect(() => {
    checkUser();
    fetchListAndWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const fetchListAndWords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch custom list details
      const { data: listData, error: listError } = await supabase
        .from('user_custom_lists')
        .select('*')
        .eq('id', listId)
        .eq('user_id', user.id)
        .single();

      if (listError) throw listError;
      setList(listData);

      // Fetch words for this custom list - both regular and custom words
      // Regular vocabulary words
      const { data: regularWordsData, error: regularWordsError } = await supabase
        .from('user_custom_list_words')
        .select(`
          word_id,
          vocabulary_words (*),
          added_at
        `)
        .eq('list_id', listId)
        .order('added_at', { ascending: true });

      if (regularWordsError) throw regularWordsError;

      // Custom user-created words
      const { data: customWordsData, error: customWordsError } = await supabase
        .from('user_custom_list_custom_words')
        .select(`
          custom_word_id,
          user_custom_words (*),
          added_at
        `)
        .eq('list_id', listId)
        .order('added_at', { ascending: true });

      if (customWordsError) throw customWordsError;

      // Combine both types of words
      interface RegularWordItem {
        word_id: string;
        vocabulary_words: Word;
      }

      const regularWordItems = (regularWordsData ?? []) as unknown as RegularWordItem[];
      const regularWords: Word[] = regularWordItems.map((item) => ({
        ...item.vocabulary_words,
        word_type: 'regular' as const,
      }));

      interface CustomWordItem {
        custom_word_id: string;
        user_custom_words: {
          id: string;
          kanji: string;
          furigana: string | null;
          romaji: string | null;
          meaning: string;
          pronunciation_url: string;
          image_url: string;
          examples: Array<{ kanji: string; furigana: string; romaji: string; translation: string }> | null;
          [key: string]: unknown;
        };
      }

      const customWordItems = (customWordsData ?? []) as unknown as CustomWordItem[];
      const customWords: Word[] = customWordItems.map((item) => {
        const word = item.user_custom_words;
        return {
          ...word,
          word: word.kanji, // Map kanji to word field for compatibility
          reading: word.romaji,
          word_type: 'custom' as const,
          // Custom words store examples as JSONB, convert to string array for compatibility
          examples: word.examples ?
            word.examples.map((ex) =>
              `${ex.kanji}|${ex.furigana}|${ex.romaji}|${ex.translation}`
            ) : []
        };
      });

      setWords([...regularWords, ...customWords]);

      // Fetch user progress for these custom words
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

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
      console.error('Error fetching data:', error instanceof Error ? error.message : 'Unknown error');
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

  const paginatedWords = filteredWords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const fetchAvailableVocabWords = async () => {
    try {
      const { data: vocabWords, error } = await supabase
        .from('vocabulary_words')
        .select(`
          id,
          kanji,
          furigana,
          romaji,
          meaning,
          image_url,
          pronunciation_url,
          list_id,
          vocabulary_lists (
            id,
            name
          )
        `)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      type WordWithList = Word & {
        list_id?: string;
        vocabulary_lists?: { id?: string; name?: string | null } | null;
      };

      const existingIds = new Set(words.map((word) => word.id));
      const userTier = subscription?.tier ?? 'free';

      const available = ((vocabWords ?? []) as unknown as WordWithList[])
        .filter((word) => !existingIds.has(word.id))
        .filter((word) => {
          if (isPro) return true;
          const listName = word.vocabulary_lists?.name ?? '';
          if (!listName) {
            return false;
          }
          return canAccessList(userTier, listName);
        })
        .map((word) => ({
          ...word,
          word: word.kanji || '', // Map kanji to word field (word column doesn't exist in DB)
          examples: [], // Examples are in separate table, provide empty array
          word_type: 'regular' as const,
        }));

      setAvailableWords(available);
    } catch (error) {
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('Error fetching available words:', message);
      setAvailableWords([]);
    }
  };

  const addVocabWordsToList = async () => {
    try {
      const inserts = selectedWordsToAdd.map(wordId => ({
        list_id: listId,
        word_id: wordId
      }));

      const { error } = await supabase
        .from('user_custom_list_words')
        .insert(inserts)
        .select();

      if (error) {
        throw error;
      }

      setShowAddVocabWords(false);
      setSelectedWordsToAdd([]);
      await fetchListAndWords();
    } catch (error) {
      console.error('Error adding words:', error);
      alert('Failed to add words: ' + (error as Error).message);
    }
  };

  const removeWord = async (wordId: string, isCustom: boolean) => {
    try {
      if (isCustom) {
        await supabase
          .from('user_custom_list_custom_words')
          .delete()
          .eq('list_id', listId)
          .eq('custom_word_id', wordId);
      } else {
        await supabase
          .from('user_custom_list_words')
          .delete()
          .eq('list_id', listId)
          .eq('word_id', wordId);
      }

      fetchListAndWords();
    } catch (error) {
      console.error('Error removing word:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-primary)]"></div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="text-center">
          <p className="text-[var(--color-text-muted)] mb-4">Custom list not found</p>
          <Link href="/my-lists" className="text-[var(--color-accent-primary)] hover:underline">
            Back to My Lists
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button and list title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/my-lists"
            className="inline-flex items-center gap-2 text-[var(--color-accent-primary)] hover:opacity-80 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Lists
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">{list.name}</h2>
                <span className="px-3 py-1 bg-ocean-500/10 text-[var(--color-accent-primary)] text-sm font-medium rounded-full">
                  Custom
                </span>
              </div>
              {list.description && (
                <p className="text-[var(--color-text-muted)] mt-2">{list.description}</p>
              )}
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 btn-primary"
            >
              <Plus className="w-5 h-5" />
              Add Words
            </button>
          </div>
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
            <div className="relative flex-1 min-w-[200px] sm:min-w-[250px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search words..."
                className="input input-search w-full py-2 text-sm"
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
          <div className="space-y-6">
            <div className="grid gap-4">
              {paginatedWords.map((word, index) => {
                const { progress: wordProgress, isMastered } = getProgress(word.id);
                return (
                  <motion.div
                    key={word.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative group"
                  >
                    <WordListItem
                      word={word}
                      progress={wordProgress}
                      isMastered={isMastered}
                      onClick={() => setSelectedWord(word)}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeWord(word.id, 'word_type' in word && word.word_type === 'custom');
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove from list"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

      {/* Word details modal */}
      {selectedWord && (
        <WordDetailsCard
          word={selectedWord}
          isOpen={!!selectedWord}
          onClose={() => setSelectedWord(null)}
        />
      )}

      {/* Add Words Choice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-60" onClick={() => setShowAddModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="card-elevated p-4 sm:p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Add Words</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-[var(--color-surface-overlay)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  fetchAvailableVocabWords();
                  setShowAddVocabWords(true);
                }}
                className="w-full px-4 py-3 btn-primary text-left flex items-center gap-3"
              >
                <Plus className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Add from Vocabulary</div>
                  <div className="text-sm opacity-80">Choose from existing words</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowAddCustomWord(true);
                }}
                className="w-full px-4 py-3 btn-accent text-left flex items-center gap-3"
              >
                <Plus className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Create Custom Word</div>
                  <div className="text-sm opacity-80">Add your own word</div>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Vocab Words Modal */}
      {showAddVocabWords && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-60" onClick={() => setShowAddVocabWords(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="card-elevated p-4 sm:p-6 max-w-4xl w-full max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Add from Vocabulary</h2>
              <button
                onClick={() => setShowAddVocabWords(false)}
                className="p-2 hover:bg-[var(--color-surface-overlay)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={vocabSearchQuery}
                  onChange={(e) => setVocabSearchQuery(e.target.value)}
                  placeholder="Search vocabulary words..."
                  className="input input-search w-full py-2"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              {availableWords
                .filter(w => {
                  if (!vocabSearchQuery.trim()) return true;
                  const query = vocabSearchQuery.toLowerCase();
                  return (
                    w.kanji?.toLowerCase().includes(query) ||
                    w.word?.toLowerCase().includes(query) ||
                    w.meaning?.toLowerCase().includes(query) ||
                    w.furigana?.toLowerCase().includes(query) ||
                    w.romaji?.toLowerCase().includes(query)
                  );
                })
                .map((word) => (
                  <label
                    key={word.id}
                    className="flex items-center gap-3 p-3 glass rounded-lg cursor-pointer hover:bg-[var(--color-surface-overlay)] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedWordsToAdd.includes(word.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedWordsToAdd([...selectedWordsToAdd, word.id]);
                        } else {
                          setSelectedWordsToAdd(selectedWordsToAdd.filter(id => id !== word.id));
                        }
                      }}
                      className="w-5 h-5 text-[var(--color-accent-primary)] rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-[var(--color-text-primary)]">
                        {word.kanji || word.word}
                        {word.furigana && <span className="ml-2 text-sm text-[var(--color-text-muted)]">({word.furigana})</span>}
                      </div>
                      <div className="text-sm text-[var(--color-text-secondary)]">{word.meaning}</div>
                    </div>
                  </label>
                ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--color-text-muted)]">
                {selectedWordsToAdd.length} word{selectedWordsToAdd.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddVocabWords(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={addVocabWordsToList}
                  disabled={selectedWordsToAdd.length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Selected
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Custom Word Modal */}
      {showAddCustomWord && (
        <AddCustomWord
          isOpen={showAddCustomWord}
          onClose={() => setShowAddCustomWord(false)}
          onWordAdded={() => fetchListAndWords()}
          listId={listId}
        />
      )}
    </div>
  );
}
