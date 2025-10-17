-- Create feedback table for collecting user feedback with screenshots

CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature_request', 'improvement', 'other')),
  message TEXT NOT NULL,
  screenshots TEXT[] DEFAULT '{}', -- Array of screenshot URLs
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON user_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON user_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON user_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can update their own pending feedback
CREATE POLICY "Users can update own pending feedback"
  ON user_feedback
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Add comment
COMMENT ON TABLE user_feedback IS 'Stores user feedback submissions with screenshots';
COMMENT ON COLUMN user_feedback.screenshots IS 'Array of URLs to screenshot images stored in Supabase Storage (max 3, each max 2MB)';
