'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, X, BookOpen, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { WordListItem } from '@/components/WordListItem';

interface CustomList {
  id: string;
  name: string;
  description: string | null;
  word_count: number;
  created_at: string;
}

interface Word {
  id: string;
  kanji?: string | null;
  furigana?: string | null;
  romaji?: string | null;
  word: string;
  reading?: string | null;
  meaning: string;
  image_url: string;
  pronunciation_url: string;
  examples: string[];
}

export default function MyListsPage() {
  const [lists, setLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [editingList, setEditingList] = useState<CustomList | null>(null);
  const [showWordsModal, setShowWordsModal] = useState(false);
  const [selectedList, setSelectedList] = useState<CustomList | null>(null);
  const [listWords, setListWords] = useState<Word[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Word[]>([]);

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

      // Get word count for each list
      const listsWithCounts = await Promise.all(
        (lists || []).map(async (list) => {
          const { count } = await supabase
            .from('user_custom_list_words')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id);

          return { ...list, word_count: count || 0 };
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_custom_lists')
        .insert({
          user_id: user.id,
          name: newListName,
          description: newListDescription || null,
        });

      if (error) throw error;

      setNewListName('');
      setNewListDescription('');
      setShowCreateModal(false);
      fetchLists();
    } catch (error: any) {
      console.error('Error creating list:', error);
      if (error.code === '23505') {
        alert('You already have a list with this name!');
      }
    }
  };

  const updateList = async () => {
    if (!editingList || !newListName.trim()) return;

    try {
      const { error } = await supabase
        .from('user_custom_lists')
        .update({
          name: newListName,
          description: newListDescription || null,
        })
        .eq('id', editingList.id);

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
      const { error } = await supabase
        .from('user_custom_lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;

      fetchLists();
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const viewListWords = async (list: CustomList) => {
    setSelectedList(list);
    setShowWordsModal(true);

    try {
      const { data, error } = await supabase
        .from('user_custom_list_words')
        .select(`
          word_id,
          vocabulary_words (*)
        `)
        .eq('list_id', list.id);

      if (error) throw error;

      const words = data?.map((item: any) => item.vocabulary_words) || [];
      setListWords(words);
    } catch (error) {
      console.error('Error fetching list words:', error);
    }
  };

  const searchWords = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vocabulary_words')
        .select('*')
        .or(`word.ilike.%${query}%,meaning.ilike.%${query}%,kanji.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      setSearchResults(data || []);
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
      const { error } = await supabase
        .from('user_custom_list_words')
        .delete()
        .eq('list_id', selectedList.id)
        .eq('word_id', wordId);

      if (error) throw error;

      viewListWords(selectedList);
    } catch (error) {
      console.error('Error removing word from list:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">My Word Lists</h1>
            <p className="text-gray-600 dark:text-gray-400">Create and manage your custom vocabulary collections</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New List
          </motion.button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No custom lists yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first custom word list to get started!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              Create Your First List
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <motion.div
                key={list.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{list.name}</h3>
                    {list.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{list.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingList(list);
                        setNewListName(list.name);
                        setNewListDescription(list.description || '');
                      }}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteList(list.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {list.word_count} {list.word_count === 1 ? 'word' : 'words'}
                  </span>
                  <button
                    onClick={() => viewListWords(list)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Words
                  </button>
                </div>
              </motion.div>
            ))}
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
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-[60] p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {editingList ? 'Edit List' : 'Create New List'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingList(null);
                      setNewListName('');
                      setNewListDescription('');
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      List Name*
                    </label>
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="e.g., JLPT N5 Vocabulary"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newListDescription}
                      onChange={(e) => setNewListDescription(e.target.value)}
                      placeholder="Brief description of your list..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={editingList ? updateList : createList}
                    disabled={!newListName.trim()}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-[60] p-6 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
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
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchWords(e.target.value);
                      }}
                      placeholder="Search words to add..."
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
                        <WordListItem word={word} />
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
      </div>
    </div>
  );
}
