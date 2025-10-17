-- Custom Word Lists Schema

-- Table for user's custom lists
CREATE TABLE IF NOT EXISTS user_custom_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  language TEXT DEFAULT 'japanese',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_list_name UNIQUE (user_id, name)
);

-- Table for words in custom lists
CREATE TABLE IF NOT EXISTS user_custom_list_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES user_custom_lists(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES vocabulary_words(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_list_word UNIQUE (list_id, word_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_lists_user_id ON user_custom_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_list_words_list_id ON user_custom_list_words(list_id);
CREATE INDEX IF NOT EXISTS idx_custom_list_words_word_id ON user_custom_list_words(word_id);

-- RLS Policies for user_custom_lists
ALTER TABLE user_custom_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom lists"
  ON user_custom_lists
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom lists"
  ON user_custom_lists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom lists"
  ON user_custom_lists
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom lists"
  ON user_custom_lists
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_custom_list_words
ALTER TABLE user_custom_list_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view words in their lists"
  ON user_custom_list_words
  FOR SELECT
  USING (
    list_id IN (
      SELECT id FROM user_custom_lists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add words to their lists"
  ON user_custom_list_words
  FOR INSERT
  WITH CHECK (
    list_id IN (
      SELECT id FROM user_custom_lists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove words from their lists"
  ON user_custom_list_words
  FOR DELETE
  USING (
    list_id IN (
      SELECT id FROM user_custom_lists WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_list_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_custom_list_timestamp
  BEFORE UPDATE ON user_custom_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_list_timestamp();
