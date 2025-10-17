-- =====================================================
-- Word Flags/Reports Table
-- =====================================================
-- This table stores user reports about incorrect or problematic word data

CREATE TABLE IF NOT EXISTS word_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word_id UUID NOT NULL REFERENCES vocabulary_words(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Report details
  issue_type TEXT NOT NULL,           -- e.g., "incorrect_meaning", "wrong_image", "bad_audio", "other"
  description TEXT NOT NULL,          -- User's explanation of the issue
  status TEXT DEFAULT 'pending',      -- 'pending', 'reviewed', 'resolved'
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_word_flags_word_id ON word_flags(word_id);
CREATE INDEX IF NOT EXISTS idx_word_flags_user_id ON word_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_word_flags_status ON word_flags(status);

-- Enable Row Level Security
ALTER TABLE word_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own flags"
  ON word_flags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert flags"
  ON word_flags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flags"
  ON word_flags FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin policy (optional - for viewing all flags)
-- CREATE POLICY "Admins can view all flags"
--   ON word_flags FOR SELECT
--   TO authenticated
--   USING (auth.jwt()->>'role' = 'admin');

COMMENT ON TABLE word_flags IS 'Stores user-reported issues with vocabulary word data';
COMMENT ON COLUMN word_flags.issue_type IS 'Type of issue: incorrect_meaning, wrong_image, bad_audio, incorrect_reading, other';
COMMENT ON COLUMN word_flags.status IS 'Status: pending (default), reviewed, resolved';

SELECT 'Word flags table created successfully!' AS status;
