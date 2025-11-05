-- 반복 스케줄 기능 추가 마이그레이션
-- 날짜: 2025-01-22
-- 설명: schedules 테이블에 반복 스케줄 관련 컬럼들을 추가합니다.

-- 1. schedules 테이블에 반복 스케줄 관련 컬럼 추가
DO $$
BEGIN
    -- is_recurring
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'schedules' AND column_name = 'is_recurring') THEN
        ALTER TABLE schedules ADD COLUMN is_recurring BOOLEAN DEFAULT false;
    END IF;
    
    -- recurrence_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'schedules' AND column_name = 'recurrence_type') THEN
        ALTER TABLE schedules ADD COLUMN recurrence_type TEXT 
            CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly'));
    END IF;
    
    -- recurrence_interval
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'schedules' AND column_name = 'recurrence_interval') THEN
        ALTER TABLE schedules ADD COLUMN recurrence_interval INTEGER DEFAULT 1;
    END IF;
    
    -- recurrence_end_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'schedules' AND column_name = 'recurrence_end_type') THEN
        ALTER TABLE schedules ADD COLUMN recurrence_end_type TEXT 
            CHECK (recurrence_end_type IN ('never', 'date', 'count'));
    END IF;
    
    -- recurrence_end_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'schedules' AND column_name = 'recurrence_end_date') THEN
        ALTER TABLE schedules ADD COLUMN recurrence_end_date DATE;
    END IF;
    
    -- recurrence_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'schedules' AND column_name = 'recurrence_count') THEN
        ALTER TABLE schedules ADD COLUMN recurrence_count INTEGER;
    END IF;
    
    -- recurrence_days_of_week
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'schedules' AND column_name = 'recurrence_days_of_week') THEN
        ALTER TABLE schedules ADD COLUMN recurrence_days_of_week TEXT DEFAULT '[]';
    END IF;
    
    -- recurrence_day_of_month
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'schedules' AND column_name = 'recurrence_day_of_month') THEN
        ALTER TABLE schedules ADD COLUMN recurrence_day_of_month INTEGER;
    END IF;
    
    -- recurrence_month_of_year
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'schedules' AND column_name = 'recurrence_month_of_year') THEN
        ALTER TABLE schedules ADD COLUMN recurrence_month_of_year INTEGER;
    END IF;
    
    -- parent_schedule_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'schedules' AND column_name = 'parent_schedule_id') THEN
        ALTER TABLE schedules ADD COLUMN parent_schedule_id TEXT;
    END IF;
    
    -- recurrence_exceptions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'schedules' AND column_name = 'recurrence_exceptions') THEN
        ALTER TABLE schedules ADD COLUMN recurrence_exceptions TEXT DEFAULT '[]';
    END IF;
END $$;

-- 2. 외래 키 추가 (parent_schedule_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'schedules_parent_schedule_id_fkey'
    ) THEN
        ALTER TABLE schedules 
        ADD CONSTRAINT schedules_parent_schedule_id_fkey 
        FOREIGN KEY (parent_schedule_id) 
        REFERENCES schedules(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_schedules_is_recurring ON schedules(is_recurring);
CREATE INDEX IF NOT EXISTS idx_schedules_parent_schedule_id ON schedules(parent_schedule_id);

-- 4. 기존 데이터는 반복 스케줄이 아니므로 is_recurring = false (기본값)로 유지

