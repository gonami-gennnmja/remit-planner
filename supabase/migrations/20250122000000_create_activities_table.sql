-- Add new columns to existing activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add user_id column for proper user isolation (if not exists)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_is_deleted ON activities(is_deleted);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);

-- Enable RLS (Row Level Security) if not already enabled
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create or update policy for user isolation
DROP POLICY IF EXISTS "Users can only access their own activities" ON activities;
CREATE POLICY "Users can only access their own activities" ON activities
  FOR ALL USING (auth.uid() = user_id);

-- Update existing activities to have default values for new columns
UPDATE activities 
SET is_read = false, is_deleted = false 
WHERE is_read IS NULL OR is_deleted IS NULL;
