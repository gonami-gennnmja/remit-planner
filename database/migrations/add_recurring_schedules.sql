-- 반복 스케줄 기능 추가 마이그레이션
-- 이 스크립트는 기존 데이터베이스에 반복 스케줄 관련 컬럼들을 추가합니다.

-- 1. schedules 테이블에 반복 스케줄 관련 컬럼 추가
-- SQLite에서는 IF NOT EXISTS를 직접 지원하지 않으므로, 컬럼이 없을 경우에만 추가
-- PostgreSQL/Supabase에서는 DO $$ 블록 사용

-- SQLite용 (간단한 방식 - 컬럼이 이미 있으면 에러 무시)
ALTER TABLE schedules ADD COLUMN is_recurring INTEGER DEFAULT 0;
ALTER TABLE schedules ADD COLUMN recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly'));
ALTER TABLE schedules ADD COLUMN recurrence_interval INTEGER DEFAULT 1;
ALTER TABLE schedules ADD COLUMN recurrence_end_type TEXT CHECK (recurrence_end_type IN ('never', 'date', 'count'));
ALTER TABLE schedules ADD COLUMN recurrence_end_date TEXT;
ALTER TABLE schedules ADD COLUMN recurrence_count INTEGER;
ALTER TABLE schedules ADD COLUMN recurrence_days_of_week TEXT DEFAULT '[]';
ALTER TABLE schedules ADD COLUMN recurrence_day_of_month INTEGER;
ALTER TABLE schedules ADD COLUMN recurrence_month_of_year INTEGER;
ALTER TABLE schedules ADD COLUMN parent_schedule_id TEXT;
ALTER TABLE schedules ADD COLUMN recurrence_exceptions TEXT DEFAULT '[]';

-- 2. 외래 키 추가 (parent_schedule_id)
-- SQLite는 외래 키를 별도로 추가할 수 없으므로, 재생성해야 함
-- 하지만 기존 데이터를 보존하기 위해 이 부분은 제외
-- 실제 운영 환경에서는 스키마 재생성을 고려해야 함

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_schedules_is_recurring ON schedules(is_recurring);
CREATE INDEX IF NOT EXISTS idx_schedules_parent_schedule_id ON schedules(parent_schedule_id);

-- 4. 기존 데이터는 반복 스케줄이 아니므로 is_recurring = 0 (기본값)으로 유지

