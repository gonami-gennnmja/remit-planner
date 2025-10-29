-- 스케줄 타입 구분 추가 마이그레이션
-- 이 스크립트는 기존 데이터베이스에 schedule_type 컬럼을 추가합니다.

-- 1. schedules 테이블에 schedule_type 컬럼 추가 (이미 추가된 경우 무시)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'schedules' AND column_name = 'schedule_type') THEN
        ALTER TABLE schedules ADD COLUMN schedule_type TEXT DEFAULT 'business' CHECK (schedule_type IN ('personal', 'business'));
    END IF;
END $$;

-- 2. 새로운 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_schedules_schedule_type ON schedules(schedule_type);

-- 3. 기존 데이터를 업무 스케줄로 설정 (기본값)
UPDATE schedules SET schedule_type = 'business' WHERE schedule_type IS NULL;
