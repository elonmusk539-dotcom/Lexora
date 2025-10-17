-- Add settings column to user_profiles table
-- This column stores user preferences as JSONB

-- First, add the column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Add a comment to describe the column
COMMENT ON COLUMN user_profiles.settings IS 'Stores user preferences including flashcard settings, MCQ settings, quiz preferences, and theme';

-- Example structure of settings JSONB:
-- {
--   "flashcard": {
--     "showFuriganaOnFront": false,
--     "showRomajiOnFront": false
--   },
--   "mcq": {
--     "showFurigana": false,
--     "showRomaji": false
--   },
--   "quiz": {
--     "lastQuizType": "mcq",
--     "lastDuration": 10,
--     "lastSelectedLists": ["uuid1", "uuid2"]
--   },
--   "theme": "light"
-- }
