'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Image as ImageIcon, Mic } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useSubscription } from '@/lib/subscription/useSubscription';
import { canAddCustomWord } from '@/lib/subscription/config';
import Link from 'next/link';
import Image from 'next/image';

interface Example {
  kanji: string;
  furigana: string;
  romaji: string;
  translation: string;
}

interface AddCustomWordProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  onWordAdded: () => void;
}

export function AddCustomWord({ isOpen, onClose, listId, onWordAdded }: AddCustomWordProps) {
  const { subscription, isPro } = useSubscription();
  const [totalCustomWords, setTotalCustomWords] = useState(0);
  const [kanji, setKanji] = useState('');
  const [furigana, setFurigana] = useState('');
  const [romaji, setRomaji] = useState('');
  const [meaning, setMeaning] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [examples, setExamples] = useState<Example[]>([
    { kanji: '', furigana: '', romaji: '', translation: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const CLOUDINARY_CLOUD_NAME = 'dkdmhcm6c';
  const CLOUDINARY_UPLOAD_PRESET = 'Lexora user word image upload preset';
  const MAX_FILE_SIZE = 1024 * 1024; // 1MB
  const MAX_AUDIO_SIZE = 1024 * 1024; // 1MB for audio

  // Fetch total custom words count
  useEffect(() => {
    const fetchCustomWordsCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('user_custom_words')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setTotalCustomWords(count || 0);
    };

    if (isOpen) {
      fetchCustomWordsCount();
    }
  }, [isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be less than 1MB');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_AUDIO_SIZE) {
      setError('Audio must be less than 1MB');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!file.type.startsWith('audio/')) {
      setError('Please select an audio file');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setAudio(file);
    const url = URL.createObjectURL(file);
    setAudioPreview(url);
  };

  const removeAudio = () => {
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview);
    }
    setAudio(null);
    setAudioPreview(null);
  };

  const addExample = () => {
    if (examples.length < 5) {
      setExamples([...examples, { kanji: '', furigana: '', romaji: '', translation: '' }]);
    }
  };

  const removeExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index));
  };

  const updateExample = (index: number, field: keyof Example, value: string) => {
    const updated = [...examples];
    updated[index][field] = value;
    setExamples(updated);
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'lexora/custom-words');

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
      xhr.send(formData);
    });
  };

  const uploadAudioToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'lexora/pronunciations');
    formData.append('resource_type', 'video');

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error('Audio upload failed'));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Audio upload failed')));

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`);
      xhr.send(formData);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!kanji.trim() || !meaning.trim()) {
      setError('Please fill in the main reading and meaning');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!canAddCustomWord(subscription.tier, totalCustomWords)) {
      setError('Free users can only add 10 custom words. Upgrade to Pro for unlimited!');
      setTimeout(() => setError(''), 5000);
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImageToCloudinary(image);
      }

      let pronunciationUrl = null;
      if (audio) {
        pronunciationUrl = await uploadAudioToCloudinary(audio);
      }

      const validExamples = examples.filter(
        ex => ex.kanji.trim() || ex.translation.trim()
      ).map(ex => ({
        kanji: ex.kanji.trim(),
        furigana: ex.furigana.trim(),
        romaji: ex.romaji.trim(),
        translation: ex.translation.trim()
      }));

      const { data: customWord, error: wordError } = await supabase
        .from('user_custom_words')
        .insert({
          user_id: user.id,
          kanji: kanji.trim(),
          furigana: furigana.trim() || null,
          romaji: romaji.trim() || null,
          meaning: meaning.trim(),
          image_url: imageUrl,
          pronunciation_url: pronunciationUrl,
          examples: validExamples
        })
        .select()
        .single();

      if (wordError) throw wordError;

      const { error: linkError } = await supabase
        .from('user_custom_list_custom_words')
        .insert({
          list_id: listId,
          custom_word_id: customWord.id
        });

      if (linkError) throw linkError;

      // Reset form
      setKanji('');
      setFurigana('');
      setRomaji('');
      setMeaning('');
      setImage(null);
      setImagePreview(null);
      setAudio(null);
      if (audioPreview) {
        URL.revokeObjectURL(audioPreview);
      }
      setAudioPreview(null);
      setExamples([{ kanji: '', furigana: '', romaji: '', translation: '' }]);

      onWordAdded();
      onClose();
    } catch (err) {
      console.error('Error adding custom word:', err);
      setError(err instanceof Error ? err.message : 'Failed to add word');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-night-400/70 z-[60] backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 -translate-x-1/2 top-4 bottom-4 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 w-[calc(100%-2rem)] max-w-3xl sm:max-h-[90vh] glass-strong rounded-2xl shadow-xl z-[70] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 glass-strong border-b border-[var(--color-border)] px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">
                    Add Custom Word
                  </h3>
                  {!isPro && (
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                      {totalCustomWords}/10 custom words used.
                      <Link href="/premium" className="text-[var(--color-accent-primary)] hover:underline ml-1">
                        Upgrade to Pro
                      </Link> for unlimited!
                    </p>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-xl glass hover:bg-[var(--color-surface-overlay)] transition-all"
                >
                  <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-5rem)] scrollbar-hide">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-4 bg-coral-500/10 border border-coral-500/30 rounded-xl text-coral-500 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Image (Optional, Max 1MB)
                </label>
                {imagePreview ? (
                  <div className="relative w-full h-48 glass rounded-xl overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      unoptimized
                      className="object-contain"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-2 bg-coral-500 text-white rounded-xl shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                ) : (
                  <label className="block w-full h-48 border-2 border-dashed border-[var(--color-border)] rounded-xl hover:border-[var(--color-accent-primary)] transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)]">
                      <ImageIcon className="w-12 h-12 mb-2" />
                      <span className="text-sm">Click to upload image</span>
                      <span className="text-xs mt-1">PNG, JPG up to 1MB</span>
                    </div>
                  </label>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="w-full bg-[var(--color-border)] rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-ocean-600 to-ocean-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1 text-center">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>

              {/* Audio Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Pronunciation (Optional, Max 1MB)
                </label>
                {audioPreview ? (
                  <div className="relative w-full p-4 glass rounded-xl">
                    <div className="flex items-center gap-3">
                      <Mic className="w-8 h-8 text-[var(--color-accent-primary)]" />
                      <div className="flex-1">
                        <audio
                          controls
                          src={audioPreview}
                          className="w-full"
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={removeAudio}
                        className="p-2 bg-coral-500 text-white rounded-xl shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <label className="block w-full p-4 sm:p-6 border-2 border-dashed border-[var(--color-border)] rounded-xl hover:border-[var(--color-accent-primary)] transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center text-[var(--color-text-muted)]">
                      <Mic className="w-12 h-12 mb-2" />
                      <span className="text-sm">Click to upload pronunciation</span>
                      <span className="text-xs mt-1">MP3, WAV, OGG up to 1MB</span>
                    </div>
                  </label>
                )}
              </div>

              {/* Main Word Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Main Reading (Kanji) *
                  </label>
                  <input
                    type="text"
                    value={kanji}
                    onChange={(e) => setKanji(e.target.value)}
                    placeholder="食べる"
                    required
                    className="input w-full py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Furigana
                  </label>
                  <input
                    type="text"
                    value={furigana}
                    onChange={(e) => setFurigana(e.target.value)}
                    placeholder="たべる"
                    className="input w-full py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Romaji
                  </label>
                  <input
                    type="text"
                    value={romaji}
                    onChange={(e) => setRomaji(e.target.value)}
                    placeholder="taberu"
                    className="input w-full py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Meaning *
                  </label>
                  <input
                    type="text"
                    value={meaning}
                    onChange={(e) => setMeaning(e.target.value)}
                    placeholder="to eat"
                    required
                    className="input w-full py-3"
                  />
                </div>
              </div>

              {/* Examples Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                    Examples (Optional, Max 5)
                  </label>
                  {examples.length < 5 && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={addExample}
                      className="px-3 py-1.5 btn-primary text-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Example
                    </motion.button>
                  )}
                </div>

                <div className="space-y-4">
                  {examples.map((example, index) => (
                    <div
                      key={index}
                      className="p-4 glass rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                          Example {index + 1}
                        </span>
                        {examples.length > 1 && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => removeExample(index)}
                            className="p-1 text-coral-500 hover:bg-coral-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={example.kanji}
                          onChange={(e) => updateExample(index, 'kanji', e.target.value)}
                          placeholder="Main reading (kanji)"
                          className="input py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={example.furigana}
                          onChange={(e) => updateExample(index, 'furigana', e.target.value)}
                          placeholder="Furigana"
                          className="input py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={example.romaji}
                          onChange={(e) => updateExample(index, 'romaji', e.target.value)}
                          placeholder="Romaji"
                          className="input py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={example.translation}
                          onChange={(e) => updateExample(index, 'translation', e.target.value)}
                          placeholder="Translation"
                          className="input py-2 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 py-3 btn-ghost"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 btn-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add Word
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
