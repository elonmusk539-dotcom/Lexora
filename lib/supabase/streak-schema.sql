-- Streak tracking for Lexora
-- Add streak data to user_profiles table

-- Add streak columns to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE,
ADD COLUMN IF NOT EXISTS streak_freeze_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS streak_freeze_date DATE;

-- Create activity log table for detailed tracking
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('quiz_completed', 'word_studied', 'list_viewed')),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_date ON user_activity_log(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON user_activity_log(user_id);

-- Enable RLS
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own activity"
  ON user_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own activity"
  ON user_activity_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop and recreate function with new return type
DROP FUNCTION IF EXISTS update_user_streak(UUID);

-- Function to update streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get current streak data
  SELECT last_activity_date, COALESCE(current_streak, 0), COALESCE(longest_streak, 0)
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- If no activity recorded yet or streak is 0, set to 1
  IF v_last_activity IS NULL OR v_current_streak = 0 THEN
    UPDATE user_profiles
    SET current_streak = 1,
        longest_streak = GREATEST(COALESCE(longest_streak, 0), 1),
        last_activity_date = v_today
    WHERE user_id = p_user_id;
    RETURN 1;
  END IF;

  -- If last activity was today, return current streak (no change)
  IF v_last_activity = v_today THEN
    RETURN v_current_streak;
  END IF;

  -- If last activity was yesterday, increment streak
  IF v_last_activity = v_today - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
    v_longest_streak := GREATEST(v_longest_streak, v_current_streak);
    
    UPDATE user_profiles
    SET current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_activity_date = v_today
    WHERE user_id = p_user_id;
    RETURN v_current_streak;
  END IF;

  -- If more than 1 day gap, reset streak to 1
  IF v_last_activity < v_today - INTERVAL '1 day' THEN
    UPDATE user_profiles
    SET current_streak = 1,
        last_activity_date = v_today,
        streak_freeze_used = FALSE,
        streak_freeze_date = NULL
    WHERE user_id = p_user_id;
    RETURN 1;
  END IF;
  
  -- Fallback: return current streak
  RETURN v_current_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
