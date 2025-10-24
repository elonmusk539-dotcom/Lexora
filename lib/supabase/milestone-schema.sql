-- Add milestone tracking columns to user_profiles

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS last_shown_streak_milestone INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_shown_words_milestone INTEGER DEFAULT 0;

-- Add comment
COMMENT ON COLUMN user_profiles.last_shown_streak_milestone IS 'Last streak milestone shown to user (7, 14, 21, 30, 60, 90)';
COMMENT ON COLUMN user_profiles.last_shown_words_milestone IS 'Last words mastered milestone shown to user (50, 100, 250, 500, 1000)';
