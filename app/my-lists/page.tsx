'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, X, BookOpen, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { WordListItem } from '@/components/WordListItem';
import { AddCustomWord } from '@/components/AddCustomWord';
import type { Word } from '@/components/WordDetailsCard';
import { useSubscription } from '@/lib/subscription/useSubscription';
import { canAccessList, canCreateCustomList } from '@/lib/subscription/config';

interface CustomList {
  id: string;
  name: string;
  description: string | null;
  word_count: number;
  created_at: string;
}

export default function MyListsPage() {
  const router = useRouter();
  const { subscription, isPro } = useSubscription();
  const [lists, setLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(true);
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [editingList, setEditingList] = useState<CustomList | null>(null);
  const [showWordsModal, setShowWordsModal] = useState(false);
  const [selectedList, setSelectedList] = useState<CustomList | null>(null);
  const [listWords, setListWords] = useState<Word[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Word[]>([]);
  const [showAddCustomWord, setShowAddCustomWord] = useState(false);
  const [allAvailableWords, setAllAvailableWords] = useState<Word[]>([]);
  const [filterByList, setFilterByList] = useState<string>('all');
  const [allLists, setAllLists] = useState<{ id: string, name: string, isCustom?: boolean }[]>([]);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: lists, error } = await supabase
        .from('user_custom_lists')
        .select(`
          id,
          name,
          description,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get word count for each list (both regular and custom words)
      const listsWithCounts = await Promise.all(
        (lists || []).map(async (list) => {
          const { count: regularCount } = await supabase
            .from('user_custom_list_words')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id);

          const { count: customCount } = await supabase
            .from('user_custom_list_custom_words')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id);

          return {
            ...list,
            word_count: (regularCount || 0) + (customCount || 0)
          };
        })
      );

      setLists(listsWithCounts);
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createList = async () => {
    if (!newListName.trim()) return;

    // Input length validation
    if (newListName.trim().length > 100) {
      alert('List name must be 100 characters or less.');
      return;
    }
    if (newListDescription.trim().length > 500) {
      alert('Description must be 500 characters or less.');
      return;
    }

    // Check if user can create more lists
    if (!canCreateCustomList(subscription?.tier || 'free', lists.length)) {
      alert(`Free users can only create 2 custom lists. Upgrade to Pro for unlimited custom lists!`);
      setShowCreateModal(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_custom_lists')
        .insert({
          user_id: user.id,
          name: newListName.trim(),
          description: newListDescription.trim() || null,
        });

      if (error) throw error;

      setNewListName('');
      setNewListDescription('');
      setShowCreateModal(false);
      fetchLists();
    } catch (error: unknown) {
      console.error('Error creating list:', error);
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        alert('You already have a list with this name!');
      }
    }
  };

  const updateList = async () => {
    if (!editingList || !newListName.trim()) return;

    // Input length validation
    if (newListName.trim().length > 100) {
      alert('List name must be 100 characters or less.');
      return;
    }
    if (newListDescription.trim().length > 500) {
      alert('Description must be 500 characters or less.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_custom_lists')
        .update({
          name: newListName.trim(),
          description: newListDescription.trim() || null,
        })
        .eq('id', editingList.id)
        .eq('user_id', user.id); // Ownership verification

      if (error) throw error;

      setEditingList(null);
      setNewListName('');
      setNewListDescription('');
      fetchLists();
    } catch (error) {
      console.error('Error updating list:', error);
    }
  };

  const deleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_custom_lists')
        .delete()
        .eq('id', listId)
        .eq('user_id', user.id); // Ownership verification

      if (error) throw error;

      fetchLists();
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const viewListWords = async (list: CustomList) => {
    setSelectedList(list);
    setShowWordsModal(true);
    setSearchQuery('');
    setFilterByList('all');

    // Fetch all available lists for filtering
    await fetchAllListsForFilter();

    // Fetch words currently in this list
    await fetchCurrentListWords(list);

    // Fetch all available words to add
    await fetchAllAvailableWords(list.id);
  };

  const fetchAllListsForFilter = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch default vocabulary lists
      const { data: defaultLists } = await supabase
        .from('vocabulary_lists')
        .select('id, name')
        .order('name', { ascending: true });

      // Fetch user's custom lists
      const { data: customLists } = await supabase
        .from('user_custom_lists')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      const combinedLists = [
        ...(defaultLists || []),
        ...(customLists || []).map(list => ({ ...list, isCustom: true }))
      ];

      setAllLists(combinedLists);
    } catch (error) {
      console.error('Error fetching lists for filter:', error);
    }
  };

  const fetchCurrentListWords = async (list: CustomList) => {
    try {
      // Fetch regular vocabulary words
      const { data: regularWordsData, error: regularError } = await supabase
        .from('user_custom_list_words')
        .select(`
          word_id,
          vocabulary_words (*)
        `)
        .eq('list_id', list.id);

      if (regularError) throw regularError;

      // Fetch custom words
      const { data: customWordsData, error: customError } = await supabase
        .from('user_custom_list_custom_words')
        .select(`
          custom_word_id,
          user_custom_words (*)
        `)
        .eq('list_id', list.id);

      if (customError) throw customError;

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
          word: word.kanji,
          reading: word.romaji,
          word_type: 'custom' as const,
          examples: word.examples
            ? word.examples.map((ex) => `${ex.kanji}|${ex.furigana}|${ex.romaji}|${ex.translation}`)
            : [],
        };
      });

      setListWords([...regularWords, ...customWords]);
    } catch (error) {
      console.error('Error fetching list words:', error);
    }
  };

  const fetchAllAvailableWords = async (currentListId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const { data: allVocabWords, error: vocabError } = await supabase
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

      if (vocabError) throw vocabError;

      type WordWithList = Word & {
        list_id?: string;
        vocabulary_lists?: { id?: string; name?: string | null } | null;
      };

      const vocabWords = (allVocabWords ?? []) as unknown as WordWithList[];

      const { data: existingWords, error: existingError } = await supabase
        .from('user_custom_list_words')
        .select('word_id')
        .eq('list_id', currentListId);

      if (existingError) throw existingError;

      const existingWordIds = new Set((existingWords ?? []).map((item) => item.word_id));
      const userTier = subscription?.tier ?? 'free';

      const filtered = vocabWords
        .filter((word) => !existingWordIds.has(word.id))
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

      setAllAvailableWords(filtered);
      setSearchResults(filtered);
    } catch (error) {
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('Error fetching all words:', message);
      setAllAvailableWords([]);
      setSearchResults([]);
    }
  };

  const searchWords = async (query: string) => {
    if (!selectedList) return;

    try {
      let filteredWords = [...allAvailableWords];

      // Apply list filter
      if (filterByList !== 'all') {
        const { data: wordsInList } = await supabase
          .from('vocabulary_words')
          .select('id')
          .eq('list_id', filterByList);

        const wordIdsInList = wordsInList?.map(w => w.id) || [];
        filteredWords = filteredWords.filter(word => wordIdsInList.includes(word.id));
      }

      // Apply search query
      if (query.trim()) {
        const searchLower = query.toLowerCase();
        filteredWords = filteredWords.filter(word =>
          word.kanji?.toLowerCase().includes(searchLower) ||
          word.word?.toLowerCase().includes(searchLower) ||
          word.furigana?.toLowerCase().includes(searchLower) ||
          word.romaji?.toLowerCase().includes(searchLower) ||
          word.meaning?.toLowerCase().includes(searchLower)
        );
      }

      setSearchResults(filteredWords);
    } catch (error) {
      console.error('Error searching words:', error);
    }
  };

  const addWordToList = async (wordId: string) => {
    if (!selectedList) return;

    try {
      const { error } = await supabase
        .from('user_custom_list_words')
        .insert({
          list_id: selectedList.id,
          word_id: wordId,
        });

      if (error) {
        if (error.code === '23505') {
          alert('This word is already in the list!');
        }
        throw error;
      }

      viewListWords(selectedList);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding word to list:', error);
    }
  };

  const removeWordFromList = async (wordId: string) => {
    if (!selectedList) return;

    try {
      // Try to remove from regular words first
      const { error: regularError } = await supabase
        .from('user_custom_list_words')
        .delete()
        .eq('list_id', selectedList.id)
        .eq('word_id', wordId);

      // If not found in regular words, try custom words
      if (regularError) {
        const { error: customError } = await supabase
          .from('user_custom_list_custom_words')
          .delete()
          .eq('list_id', selectedList.id)
          .eq('custom_word_id', wordId);

        if (customError) throw customError;
      }

      viewListWords(selectedList);
      fetchLists(); // Update word count
    } catch (error) {
      console.error('Error removing word from list:', error);
    }
  };

  const filteredLists = lists.filter((list) => {
    if (listSearchQuery.trim()) {
      const query = listSearchQuery.toLowerCase();
      return (
        list.name.toLowerCase().includes(query) ||
        list.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-mesh">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 space-y-4"
        >
          {/* Top Row - Title with count and Search */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-600 shadow-glow">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">My Word Lists</h1>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
                  {filteredLists.length} list{filteredLists.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Search input */}
            <div className="relative flex-1 min-w-[200px] sm:min-w-[250px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={listSearchQuery}
                onChange={(e) => setListSearchQuery(e.target.value)}
                placeholder="Search your lists..."
                className="input input-search w-full py-2 text-sm"
              />
            </div>
          </div>

          {/* Info and Create button row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-[var(--color-text-muted)]">
              {isPro
                ? 'Create and manage unlimited custom vocabulary collections'
                : `${lists.length}/2 custom lists used. Upgrade to Pro for unlimited!`
              }
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!canCreateCustomList(subscription?.tier || 'free', lists.length)) {
                  if (confirm('You have reached the limit of 2 custom lists on the free plan. Upgrade to Pro for unlimited custom lists?')) {
                    router.push('/premium');
                  }
                  return;
                }
                setShowCreateModal(true);
              }}
              disabled={!canCreateCustomList(subscription?.tier || 'free', lists.length) && !isPro}
              className="px-4 sm:px-6 py-2 sm:py-3 btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Create New List
            </motion.button>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-primary)] mx-auto"></div>
          </div>
        ) : filteredLists.length === 0 ? (
          <div className="text-center py-12 card rounded-xl">
            <BookOpen className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              {listSearchQuery.trim() ? 'No lists match your search' : 'No custom lists yet'}
            </h3>
            <p className="text-[var(--color-text-muted)] mb-6">
              {listSearchQuery.trim() ? 'Try a different search term' : 'Create your first custom word list to get started!'}
            </p>
            {!listSearchQuery.trim() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary px-6 py-3"
              >
                Create Your First List
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLists.map((list) => (
                <motion.div
                  key={list.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => router.push(`/my-lists/${list.id}`)}
                  className="card cursor-pointer hover:border-[var(--color-accent-primary)] transition-all p-4 sm:p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">{list.name}</h3>
                      {list.description && (
                        <p className="text-sm text-[var(--color-text-muted)]">{list.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingList(list);
                          setNewListName(list.name);
                          setNewListDescription(list.description || '');
                        }}
                        className="p-2 text-[var(--color-accent-primary)] hover:bg-ocean-500/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteList(list.id);
                        }}
                        className="p-2 text-coral-500 hover:bg-coral-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                    <span className="text-sm text-[var(--color-text-muted)]">
                      {list.word_count} {list.word_count === 1 ? 'word' : 'words'}
                    </span>
                    <span className="text-sm text-[var(--color-accent-primary)] font-medium">
                      Click to view →
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {(showCreateModal || editingList) && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingList(null);
                  setNewListName('');
                  setNewListDescription('');
                }}
                className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md card-elevated z-[60] p-4 sm:p-6"
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {editingList ? 'Edit List' : 'Create New List'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingList(null);
                      setNewListName('');
                      setNewListDescription('');
                    }}
                    className="p-2 rounded-full hover:bg-[var(--color-surface-overlay)] transition-colors"
                  >
                    <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      List Name*
                    </label>
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="e.g., JLPT N5 Vocabulary"
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newListDescription}
                      onChange={(e) => setNewListDescription(e.target.value)}
                      placeholder="Brief description of your list..."
                      rows={3}
                      className="input w-full resize-none"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={editingList ? updateList : createList}
                    disabled={!newListName.trim()}
                    className="w-full py-3 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingList ? 'Update List' : 'Create List'}
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Words Modal */}
        <AnimatePresence>
          {showWordsModal && selectedList && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowWordsModal(false);
                  setSelectedList(null);
                  setListWords([]);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-[60] p-4 sm:p-6 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedList.name}</h3>
                  <button
                    onClick={() => {
                      setShowWordsModal(false);
                      setSelectedList(null);
                      setListWords([]);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Add Word Search */}
                <div className="mb-6">
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setShowAddCustomWord(true)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Custom Word
                    </button>
                  </div>

                  {/* Filter by List */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Filter by List
                    </label>
                    <select
                      value={filterByList}
                      onChange={(e) => {
                        setFilterByList(e.target.value);
                        searchWords(searchQuery);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Lists</option>
                      {allLists.map(list => (
                        <option key={list.id} value={list.id}>
                          {list.name} {list.isCustom ? '(Custom)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchWords(e.target.value);
                      }}
                      placeholder="Search by kanji, furigana, romaji, or meaning..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
                      {searchResults.map((word) => (
                        <div
                          key={word.id}
                          className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => addWordToList(word.id)}
                        >
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {word.kanji || word.word}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400 ml-2">- {word.meaning}</span>
                          </div>
                          <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* List Words */}
                {listWords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No words in this list yet. Search and add some words!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {listWords.map((word) => (
                      <div key={word.id} className="relative">
                        <WordListItem
                          word={word}
                          progress={0}
                          isMastered={false}
                          onClick={() => undefined}
                        />
                        <button
                          onClick={() => removeWordFromList(word.id)}
                          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Add Custom Word Modal */}
        <AddCustomWord
          isOpen={showAddCustomWord}
          onClose={() => setShowAddCustomWord(false)}
          onSuccess={() => {
            if (selectedList) {
              viewListWords(selectedList);
            }
          }}
          initialListId={selectedList?.id}
        />
      </div>
    </div>
  );
}
