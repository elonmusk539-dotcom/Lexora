'use client';

import { motion } from 'framer-motion';
import { Filter, ArrowLeft, Search, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { WordListItem } from '@/components/WordListItem';
import { WordDetailsCard, type Word } from '@/components/WordDetailsCard';
import { Header } from '@/components/Header';
import { AddCustomWord } from '@/components/AddCustomWord';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCustomWord, setShowAddCustomWord] = useState(false);
  const [showAddVocabWords, setShowAddVocabWords] = useState(false);
  const [availableWords, setAvailableWords] = useState<Word[]>([]);
  const [selectedWordsToAdd, setSelectedWordsToAdd] = useState<string[]>([]);
  const [vocabSearchQuery, setVocabSearchQuery] = useState('');
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
      
      const regularWords = regularWordsData?.map((item: RegularWordItem) => ({
        ...item.vocabulary_words,
        word_type: 'regular'
      })) || [];
      
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
      
      const customWords = customWordsData?.map((item: CustomWordItem) => {
        const word = item.user_custom_words;
        return {
          ...word,
          word: word.kanji, // Map kanji to word field for compatibility
          reading: word.romaji,
          word_type: 'custom',
          // Custom words store examples as JSONB, convert to string array for compatibility
          examples: word.examples ? 
            word.examples.map((ex) => 
              `${ex.kanji}|${ex.furigana}|${ex.romaji}|${ex.translation}`
            ) : []
        };
      }) || [];

      setWords([...regularWords, ...customWords]);

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
      console.error('Full error details:', JSON.stringify(error, null, 2));
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
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

  const fetchAvailableVocabWords = async () => {
    try {
      const { data: allVocabWords } = await supabase
        .from('vocabulary_words')
        .select('*')
        .order('created_at', { ascending: true });

      // Filter out words already in this list
      const wordIds = words.map(w => w.id);
      const available = (allVocabWords || []).filter(w => !wordIds.includes(w.id));
      setAvailableWords(available);
    } catch (error) {
      console.error('Error fetching available words:', error);
    }
  };

  const addVocabWordsToList = async () => {
    try {
      console.log('Adding words to list:', { listId, selectedWordsToAdd });

      const inserts = selectedWordsToAdd.map(wordId => ({
        list_id: listId,
        word_id: wordId
      }));

      console.log('Inserting:', inserts);

      const { data, error } = await supabase
        .from('user_custom_list_words')
        .insert(inserts)
        .select();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      console.log('Insert successful:', data);

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
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{list.name}</h2>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-medium rounded-full">
                  Custom
                </span>
              </div>
              {list.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">{list.description}</p>
              )}
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
          
          {/* Search input */}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search words..."
              className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-[200px]"
            />
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60" onClick={() => setShowAddModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Words</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  fetchAvailableVocabWords();
                  setShowAddVocabWords(true);
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-left flex items-center gap-3"
              >
                <Plus className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Add from Vocabulary</div>
                  <div className="text-sm text-blue-100">Choose from existing words</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowAddCustomWord(true);
                }}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-left flex items-center gap-3"
              >
                <Plus className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Create Custom Word</div>
                  <div className="text-sm text-purple-100">Add your own word</div>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Vocab Words Modal */}
      {showAddVocabWords && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60" onClick={() => setShowAddVocabWords(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add from Vocabulary</h2>
              <button
                onClick={() => setShowAddVocabWords(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={vocabSearchQuery}
                  onChange={(e) => setVocabSearchQuery(e.target.value)}
                  placeholder="Search vocabulary words..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
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
                      className="w-5 h-5 text-blue-600 rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {word.kanji || word.word}
                        {word.furigana && <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({word.furigana})</span>}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{word.meaning}</div>
                    </div>
                  </label>
                ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedWordsToAdd.length} word{selectedWordsToAdd.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddVocabWords(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addVocabWordsToList}
                  disabled={selectedWordsToAdd.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
