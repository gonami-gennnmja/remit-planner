-- Drop existing table and recreate with new schema
DROP TABLE IF EXISTS categories CASCADE;

-- Categories table (카테고리 테이블)
-- 시스템 기본 카테고리 + 사용자별 커스텀 카테고리
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL이면 시스템 기본 카테고리
  is_system BOOLEAN DEFAULT FALSE, -- 시스템 기본 카테고리 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- 시스템 카테고리는 name이 unique, 사용자 카테고리는 user_id + name이 unique
  UNIQUE(user_id, name)
);

-- Index for faster lookups
CREATE INDEX idx_categories_user ON categories(user_id);
CREATE INDEX idx_categories_system ON categories(is_system) WHERE is_system = TRUE;

-- Row Level Security (RLS) 활성화
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 시스템 카테고리는 모두가 조회 가능
CREATE POLICY "System categories are viewable by everyone"
  ON categories FOR SELECT
  USING (is_system = TRUE);

-- RLS 정책: 사용자는 자신의 카테고리만 조회 가능
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 카테고리만 생성 가능
CREATE POLICY "Users can create their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system = FALSE);

-- RLS 정책: 사용자는 자신의 카테고리만 수정 가능
CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id AND is_system = FALSE);

-- RLS 정책: 사용자는 자신의 카테고리만 삭제 가능
CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id AND is_system = FALSE);

-- 시스템 기본 카테고리 삽입 (교육, 업무만)
INSERT INTO categories (id, name, color, user_id, is_system) VALUES
  ('cat-education', '교육', '#8b5cf6', NULL, TRUE),
  ('cat-work', '업무', '#06b6d4', NULL, TRUE);

