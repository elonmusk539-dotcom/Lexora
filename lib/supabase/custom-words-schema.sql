-- Custom Words Feature Schema
-- Allows users to create and add their own custom vocabulary words with images

-- Table for user-created custom words
CREATE TABLE IF NOT EXISTS user_custom_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Word details
  kanji TEXT NOT NULL, -- Main reading including kanji
  furigana TEXT, -- Hiragana reading above kanji
  romaji TEXT, -- Romanized reading
  meaning TEXT NOT NULL, -- English translation/meaning
  
  -- Image (stored on Cloudinary)
  image_url TEXT, -- Cloudinary URL for the word image (max 1MB)
  
  -- Pronunciation audio (stored on Cloudinary)
  pronunciation_url TEXT, -- Cloudinary URL for pronunciation audio (max 5MB)
  
  -- Examples (stored as JSONB array)
  examples JSONB DEFAULT '[]'::jsonb, -- Array of example objects
  -- Each example has: { kanji, furigana, romaji, translation }
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_examples_structure CHECK (
    jsonb_typeof(examples) = 'array' AND
    jsonb_array_length(examples) <= 5
  )
);

-- Junction table linking custom words to custom lists
CREATE TABLE IF NOT EXISTS user_custom_list_custom_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES user_custom_lists(id) ON DELETE CASCADE,
  custom_word_id UUID NOT NULL REFERENCES user_custom_words(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_list_custom_word UNIQUE (list_id, custom_word_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_words_user_id ON user_custom_words(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_words_created_at ON user_custom_words(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_list_custom_words_list_id ON user_custom_list_custom_words(list_id);
CREATE INDEX IF NOT EXISTS idx_custom_list_custom_words_word_id ON user_custom_list_custom_words(custom_word_id);

-- Enable full text search on custom words
CREATE INDEX IF NOT EXISTS idx_custom_words_search ON user_custom_words 
  USING gin(to_tsvector('english', coalesce(kanji, '') || ' ' || coalesce(meaning, '') || ' ' || coalesce(romaji, '')));

-- RLS Policies for user_custom_words
ALTER TABLE user_custom_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom words"
  ON user_custom_words
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom words"
  ON user_custom_words
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom words"
  ON user_custom_words
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom words"
  ON user_custom_words
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_custom_list_custom_words
ALTER TABLE user_custom_list_custom_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view custom words in their lists"
  ON user_custom_list_custom_words
  FOR SELECT
  USING (
    list_id IN (
      SELECT id FROM user_custom_lists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add custom words to their lists"
  ON user_custom_list_custom_words
  FOR INSERT
  WITH CHECK (
    list_id IN (
      SELECT id FROM user_custom_lists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove custom words from their lists"
  ON user_custom_list_custom_words
  FOR DELETE
  USING (
    list_id IN (
      SELECT id FROM user_custom_lists WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_word_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_custom_word_timestamp
  BEFORE UPDATE ON user_custom_words
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_word_timestamp();

-- Sample query to fetch custom words with their examples
-- SELECT 
--   id, kanji, furigana, romaji, meaning, image_url,
--   examples
-- FROM user_custom_words
-- WHERE user_id = 'user-uuid-here'
-- ORDER BY created_at DESC;

-- Sample query to get all words (both regular and custom) in a list
-- SELECT 
--   'regular' as word_type, 
--   vw.id, vw.kanji, vw.furigana, vw.romaji, vw.meaning, vw.image_url
-- FROM user_custom_list_words uclw
-- JOIN vocabulary_words vw ON uclw.word_id = vw.id
-- WHERE uclw.list_id = 'list-uuid-here'
-- UNION ALL
-- SELECT 
--   'custom' as word_type,
--   ucw.id, ucw.kanji, ucw.furigana, ucw.romaji, ucw.meaning, ucw.image_url
-- FROM user_custom_list_custom_words uclcw
-- JOIN user_custom_words ucw ON uclcw.custom_word_id = ucw.id
-- WHERE uclcw.list_id = 'list-uuid-here'
-- ORDER BY word_type, kanji;
