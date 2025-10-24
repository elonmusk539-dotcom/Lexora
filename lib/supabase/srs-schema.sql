-- Spaced Repetition System (SRS) Schema for Lexora
-- Implements SM-2 algorithm for optimal vocabulary retention

-- Add SRS columns to user_progress table
ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS ease_factor DECIMAL(3,2) DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS interval INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS repetitions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_review_date DATE,
ADD COLUMN IF NOT EXISTS review_type TEXT DEFAULT 'new' CHECK (review_type IN ('new', 'learning', 'review'));

-- Create index for efficient due word queries
CREATE INDEX IF NOT EXISTS idx_user_progress_next_review 
ON user_progress(user_id, next_review_date) 
WHERE next_review_date IS NOT NULL;

-- Function to calculate next review date using SM-2 algorithm
CREATE OR REPLACE FUNCTION calculate_next_review(
  p_ease_factor DECIMAL,
  p_interval INTEGER,
  p_repetitions INTEGER,
  p_quality INTEGER  -- 0-5 rating (0=Again, 1=Hard, 3=Good, 5=Easy)
)
RETURNS TABLE(
  new_ease_factor DECIMAL,
  new_interval INTEGER,
  new_repetitions INTEGER,
  new_review_type TEXT,
  next_review DATE
) AS $$
DECLARE
  v_ease DECIMAL;
  v_interval INTEGER;
  v_reps INTEGER;
  v_type TEXT;
BEGIN
  -- Update ease factor based on quality
  v_ease := GREATEST(1.3, p_ease_factor + (0.1 - (5 - p_quality) * (0.08 + (5 - p_quality) * 0.02)));
  
  -- Calculate interval based on quality
  IF p_quality < 3 THEN
    -- Again or Hard - reset to learning
    v_interval := 1;
    v_reps := 0;
    v_type := 'learning';
  ELSE
    -- Good or Easy
    v_reps := p_repetitions + 1;
    v_type := 'review';
    
    IF v_reps = 1 THEN
      v_interval := 1;
    ELSIF v_reps = 2 THEN
      v_interval := 6;
    ELSE
      v_interval := ROUND(p_interval * v_ease)::INTEGER;
    END IF;
    
    -- Easy button bonus
    IF p_quality = 5 THEN
      v_interval := ROUND(v_interval * 1.3)::INTEGER;
    END IF;
  END IF;
  
  -- Return results
  RETURN QUERY SELECT 
    v_ease,
    v_interval,
    v_reps,
    v_type,
    (CURRENT_DATE + v_interval)::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get due words count for a user
CREATE OR REPLACE FUNCTION get_due_words_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM user_progress
  WHERE user_id = p_user_id
    AND is_mastered = false
    AND (next_review_date IS NULL OR next_review_date <= CURRENT_DATE);
    
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update word progress after SRS review
CREATE OR REPLACE FUNCTION update_srs_progress(
  p_user_id UUID,
  p_word_id UUID,
  p_quality INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_current_progress RECORD;
  v_new_values RECORD;
  v_result JSONB;
BEGIN
  -- Get current progress
  SELECT * INTO v_current_progress
  FROM user_progress
  WHERE user_id = p_user_id AND word_id = p_word_id;
  
  -- If no progress exists, create it
  IF v_current_progress IS NULL THEN
    INSERT INTO user_progress (
      user_id,
      word_id,
      ease_factor,
      interval,
      repetitions,
      review_type,
      next_review_date,
      correct_streak,
      is_mastered,
      last_reviewed
    ) VALUES (
      p_user_id,
      p_word_id,
      2.5,
      0,
      0,
      'new',
      NULL,
      CASE WHEN p_quality >= 3 THEN 1 ELSE 0 END,
      false,
      NOW()
    );
    
    SELECT * INTO v_current_progress
    FROM user_progress
    WHERE user_id = p_user_id AND word_id = p_word_id;
  END IF;
  
  -- Calculate new values using SM-2
  SELECT * INTO v_new_values
  FROM calculate_next_review(
    v_current_progress.ease_factor,
    v_current_progress.interval,
    v_current_progress.repetitions,
    p_quality
  );
  
  -- Update progress
  UPDATE user_progress
  SET
    ease_factor = v_new_values.new_ease_factor,
    interval = v_new_values.new_interval,
    repetitions = v_new_values.new_repetitions,
    review_type = v_new_values.new_review_type,
    next_review_date = v_new_values.next_review,
    correct_streak = CASE 
      WHEN p_quality >= 3 THEN LEAST(correct_streak + 1, 100)
      ELSE GREATEST(correct_streak - 1, 0)
    END,
    is_mastered = CASE
      WHEN v_new_values.new_repetitions >= 7 AND v_new_values.new_ease_factor >= 2.5 THEN true
      ELSE false
    END,
    last_reviewed = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id AND word_id = p_word_id;
  
  -- Return result
  SELECT jsonb_build_object(
    'ease_factor', v_new_values.new_ease_factor,
    'interval', v_new_values.new_interval,
    'repetitions', v_new_values.new_repetitions,
    'review_type', v_new_values.new_review_type,
    'next_review_date', v_new_values.next_review,
    'is_mastered', (v_new_values.new_repetitions >= 7 AND v_new_values.new_ease_factor >= 2.5)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_next_review TO authenticated;
GRANT EXECUTE ON FUNCTION get_due_words_count TO authenticated;
GRANT EXECUTE ON FUNCTION update_srs_progress TO authenticated;

-- Comments
COMMENT ON FUNCTION calculate_next_review IS 'SM-2 spaced repetition algorithm - calculates next review date';
COMMENT ON FUNCTION get_due_words_count IS 'Returns count of words due for review for a user';
COMMENT ON FUNCTION update_srs_progress IS 'Updates word progress after SRS review with quality rating (0-5)';
