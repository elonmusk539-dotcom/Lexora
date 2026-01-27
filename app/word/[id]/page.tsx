'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { WordDetailsCard, type Word } from '@/components/WordDetailsCard';

export default function WordSharePage() {
  const params = useParams();
  const router = useRouter();
  const wordId = params.id as string;

  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordId]);

  const fetchWord = async () => {
    try {
      const { data, error } = await supabase
        .from('vocabulary_words')
        .select('*')
        .eq('id', wordId)
        .single();

      if (error) throw error;

      setWord(data);
    } catch (error) {
      console.error('Error fetching word:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate OG image URL if word exists - for future meta tag usage
  // const getOgImageUrl = () => {
  //   if (!word) return '';
  //   const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  //   const params = new URLSearchParams({
  //     word: word.kanji || word.word,
  //     reading: word.romaji || word.reading || '',
  //     meaning: word.meaning,
  //     image: word.image_url,
  //   });
  //   return `${baseUrl}/api/og?${params.toString()}`;
  // };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-primary)]"></div>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-mesh">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">Word not found</h1>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 btn-primary"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <WordDetailsCard
          word={word}
          isOpen={true}
          onClose={() => router.push('/')}
        />
      </div>
    </div>
  );
}
