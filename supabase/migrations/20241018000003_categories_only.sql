-- Add categories table only
-- This migration only creates the categories table if it doesn't exist

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Insert default categories
INSERT INTO categories (id, name, color) VALUES
  ('cat-education', '교육', '#8b5cf6'),
  ('cat-work', '업무', '#06b6d4'),
  ('cat-event', '이벤트', '#f59e0b'),
  ('cat-personal', '개인', '#ec4899'),
  ('cat-other', '기타', '#6b7280')
ON CONFLICT (name) DO NOTHING;
