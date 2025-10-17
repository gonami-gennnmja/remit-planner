-- Supabase 데이터베이스 스키마
-- 이 파일을 여러 번 실행해도 안전합니다 (IF NOT EXISTS 사용)

-- 기존 테이블이 있다면 정리 (선택사항)
-- DROP TABLE IF EXISTS work_periods CASCADE;
-- DROP TABLE IF EXISTS schedule_workers CASCADE;
-- DROP TABLE IF EXISTS schedules CASCADE;
-- DROP TABLE IF EXISTS workers CASCADE;
-- DROP TABLE IF EXISTS activities CASCADE;

-- 근로자 테이블
CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  bank_account TEXT,
  hourly_wage INTEGER DEFAULT 0,
  tax_withheld BOOLEAN DEFAULT false,
  memo TEXT,
  work_start_date TEXT,
  work_end_date TEXT,
  work_hours INTEGER DEFAULT 0,
  work_minutes INTEGER DEFAULT 0,
  is_full_period_work BOOLEAN DEFAULT true,
  is_same_work_hours_daily BOOLEAN DEFAULT true,
  daily_work_times JSONB DEFAULT '[]',
  default_start_time TEXT DEFAULT '09:00',
  default_end_time TEXT DEFAULT '18:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 스케줄 테이블
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  description TEXT,
  category TEXT,
  address TEXT,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 스케줄-근로자 관계 테이블
CREATE TABLE IF NOT EXISTS schedule_workers (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  worker_id TEXT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  paid BOOLEAN DEFAULT false,
  work_hours DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(schedule_id, worker_id)
);

-- 근무 기간 테이블
CREATE TABLE IF NOT EXISTS work_periods (
  id TEXT PRIMARY KEY,
  schedule_worker_id TEXT NOT NULL REFERENCES schedule_workers(id) ON DELETE CASCADE,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 활동 로그 테이블
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  related_id TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_workers_name ON workers(name);
CREATE INDEX IF NOT EXISTS idx_workers_phone ON workers(phone);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(start_date);
CREATE INDEX IF NOT EXISTS idx_schedule_workers_schedule_id ON schedule_workers(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_workers_worker_id ON schedule_workers(worker_id);
CREATE INDEX IF NOT EXISTS idx_work_periods_schedule_worker_id ON work_periods(schedule_worker_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_workers_updated_at BEFORE UPDATE ON schedule_workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_periods_updated_at BEFORE UPDATE ON work_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
