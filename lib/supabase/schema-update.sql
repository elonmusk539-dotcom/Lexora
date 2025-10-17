-- =====================================================
-- Lexora Database Schema Update for Japanese Words
-- =====================================================
-- This file contains the schema updates to support proper Japanese word structure
-- Run this in your Supabase SQL editor AFTER backing up your existing data

-- =====================================================
-- 1. Update vocabulary_words table
-- =====================================================

-- Add new columns for Japanese word structure
ALTER TABLE vocabulary_words 
ADD COLUMN IF NOT EXISTS kanji TEXT,           -- Main reading with kanji (e.g., "食べる")
ADD COLUMN IF NOT EXISTS furigana TEXT,        -- Hiragana reading above kanji (e.g., "たべる")
ADD COLUMN IF NOT EXISTS romaji TEXT;          -- Romanized reading (e.g., "taberu")

-- Update the word column comment to clarify its purpose
COMMENT ON COLUMN vocabulary_words.word IS 'Deprecated: Use kanji field instead. Kept for backwards compatibility.';
COMMENT ON COLUMN vocabulary_words.reading IS 'Deprecated: Use romaji field instead. Kept for backwards compatibility.';

-- Add comments to new columns
COMMENT ON COLUMN vocabulary_words.kanji IS 'Main Japanese reading including kanji characters';
COMMENT ON COLUMN vocabulary_words.furigana IS 'Hiragana reading for kanji (reading aid)';
COMMENT ON COLUMN vocabulary_words.romaji IS 'Romanized reading of the Japanese word';

-- =====================================================
-- 2. Create examples table (replace JSON array)
-- =====================================================

-- Create a dedicated table for examples with proper Japanese structure
CREATE TABLE IF NOT EXISTS vocabulary_examples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word_id UUID NOT NULL REFERENCES vocabulary_words(id) ON DELETE CASCADE,
  
  -- Japanese sentence structure
  kanji TEXT NOT NULL,                -- Example sentence with kanji (e.g., "私は寿司を食べる")
  furigana TEXT,                      -- Furigana for the sentence (e.g., "わたしはすしをたべる")
  romaji TEXT,                        -- Romanized sentence (e.g., "Watashi wa sushi wo taberu")
  translation TEXT NOT NULL,          -- English translation (e.g., "I eat sushi")
  
  -- Metadata
  order_index INTEGER DEFAULT 0,      -- Order of examples for a word
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_examples_word_id ON vocabulary_examples(word_id);
CREATE INDEX IF NOT EXISTS idx_examples_order ON vocabulary_examples(word_id, order_index);

-- Enable Row Level Security
ALTER TABLE vocabulary_examples ENABLE ROW LEVEL SECURITY;

-- RLS Policies for examples (same as words - public read)
CREATE POLICY "Examples are viewable by everyone"
  ON vocabulary_examples FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert examples"
  ON vocabulary_examples FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update examples"
  ON vocabulary_examples FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete examples"
  ON vocabulary_examples FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- 3. Migration helper function (optional)
-- =====================================================

-- Function to help migrate existing data from old structure to new structure
-- You can run this after adding columns to populate data programmatically
-- Note: This is a template - customize based on your actual data

COMMENT ON TABLE vocabulary_examples IS 
'Stores example sentences for vocabulary words with full Japanese structure (kanji, furigana, romaji, translation)';

-- =====================================================
-- 4. Sample data structure
-- =====================================================

-- Example of inserting a word with new structure:
/*
INSERT INTO vocabulary_words (
  list_id,
  kanji,
  furigana,
  romaji,
  meaning,
  image_url,
  pronunciation_url
) VALUES (
  'your-list-id',
  '食べる',
  'たべる',
  'taberu',
  'to eat',
  'https://res.cloudinary.com/your-cloud/image.jpg',
  'https://res.cloudinary.com/your-cloud/audio.mp3'
);

-- Then add examples:
INSERT INTO vocabulary_examples (
  word_id,
  kanji,
  furigana,
  romaji,
  translation,
  order_index
) VALUES (
  'word-id',
  '私は寿司を食べる',
  'わたしはすしをたべる',
  'Watashi wa sushi wo taberu',
  'I eat sushi',
  1
), (
  'word-id',
  '毎日朝ごはんを食べます',
  'まいにちあさごはんをたべます',
  'Mainichi asagohan wo tabemasu',
  'I eat breakfast every day',
  2
);
*/

-- =====================================================
-- 5. Update triggers for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vocabulary_examples_updated_at
BEFORE UPDATE ON vocabulary_examples
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 
-- 1. The old 'word' and 'reading' columns are kept for backwards compatibility
--    but you should gradually migrate to using kanji, furigana, romaji
--
-- 2. The 'examples' JSON array column can be deprecated in favor of the
--    vocabulary_examples table for better structure and querying
--
-- 3. Update your application code to:
--    - Insert using: kanji, furigana, romaji instead of word, reading
--    - Query examples from vocabulary_examples table joined with words
--    - Display furigana above kanji using <ruby> HTML tags
--
-- 4. Migration strategy:
--    - Add new columns (done above)
--    - Update app to write to both old and new columns
--    - Gradually migrate existing data
--    - Update app to read from new columns
--    - Eventually drop old columns (word, reading, examples)
--
-- =====================================================

SELECT 'Schema update completed successfully!' AS status;
