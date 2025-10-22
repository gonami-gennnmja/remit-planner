-- 마이그레이션: 근로자, 스케줄, 파일 관리 스키마 업데이트
-- 날짜: 2025-01-21
-- 설명: 근로자 관리, 스케줄별 시간 설정, 파일 업로드 기능을 위한 스키마 업데이트

-- 1. 기존 테이블들 삭제 (데이터 백업 필요)
DROP TABLE IF EXISTS work_periods CASCADE;
DROP TABLE IF EXISTS schedule_workers CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS workers CASCADE;

-- 2. Workers 테이블 생성
CREATE TABLE workers (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  resident_number TEXT, -- 급여 지급 시에만 필수 (NULL 허용)
  bank_account TEXT, -- 급여 지급 시에만 필수 (NULL 허용)
  hourly_wage INTEGER NOT NULL, -- 기본 시급
  fuel_allowance INTEGER DEFAULT 0, -- 유류비 (월 고정)
  other_allowance INTEGER DEFAULT 0, -- 기타비용
  -- 파일 관련 컬럼들
  id_card_image_url TEXT, -- 신분증 사진 URL (Supabase Storage)
  id_card_image_path TEXT, -- 신분증 사진 경로 (bucket/workers/{worker_id}/)
  memo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Schedules 테이블 생성
CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL, -- 스케줄 시작일
  end_date DATE NOT NULL, -- 스케줄 종료일
  category TEXT NOT NULL,
  location TEXT,
  address TEXT,
  uniform_time BOOLEAN DEFAULT true, -- 일정 시간이 동일한지 여부
  -- 파일 관련 컬럼들
  documents_folder_path TEXT, -- 문서 폴더 경로
  has_attachments BOOLEAN DEFAULT false, -- 첨부파일 여부
  memo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Schedule_Times 테이블 생성 (스케줄별 일일 시간)
CREATE TABLE schedule_times (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id TEXT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  work_date DATE NOT NULL, -- 해당 일자
  start_time TIME NOT NULL, -- 근무 시작 시간
  end_time TIME NOT NULL, -- 근무 종료 시간
  break_duration INTEGER DEFAULT 0, -- 휴게시간 (분)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(schedule_id, work_date)
);

-- 5. Schedule_Workers 테이블 생성 (스케줄-근로자 관계)
CREATE TABLE schedule_workers (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id TEXT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  worker_id TEXT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  work_start_date DATE NOT NULL, -- 이 근로자의 근무 시작일
  work_end_date DATE NOT NULL, -- 이 근로자의 근무 종료일
  uniform_time BOOLEAN DEFAULT true, -- 근무 시간이 동일한지 여부
  hourly_wage INTEGER, -- 이 스케줄에서의 시급 (기본 시급과 다를 수 있음)
  fuel_allowance INTEGER DEFAULT 0, -- 이 스케줄에서의 유류비
  other_allowance INTEGER DEFAULT 0, -- 이 스케줄에서의 기타비용
  -- 급여 계산 옵션들
  overtime_enabled BOOLEAN DEFAULT true, -- 연장근무 수당 적용 여부
  night_shift_enabled BOOLEAN DEFAULT true, -- 야간수당 적용 여부
  tax_withheld BOOLEAN DEFAULT true, -- 3.3% 세금 공제 여부
  -- 지급 여부 체크
  wage_paid BOOLEAN DEFAULT false, -- 급여 지급 여부
  fuel_paid BOOLEAN DEFAULT false, -- 유류비 지급 여부
  other_paid BOOLEAN DEFAULT false, -- 기타비용 지급 여부
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(schedule_id, worker_id)
);

-- 6. Worker_Times 테이블 생성 (근로자별 일일 근무 시간)
CREATE TABLE worker_times (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_worker_id TEXT NOT NULL REFERENCES schedule_workers(id) ON DELETE CASCADE,
  work_date DATE NOT NULL, -- 근무일
  start_time TIME NOT NULL, -- 근무 시작 시간
  end_time TIME NOT NULL, -- 근무 종료 시간
  break_duration INTEGER DEFAULT 0, -- 휴게시간 (분)
  overtime_hours DECIMAL(4,2) DEFAULT 0, -- 연장근무 시간
  memo TEXT, -- 특이사항
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(schedule_worker_id, work_date)
);

-- 7. Work_Periods 테이블 생성 (일별 근무 시간)
CREATE TABLE work_periods (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_worker_id TEXT NOT NULL REFERENCES schedule_workers(id) ON DELETE CASCADE,
  work_date DATE NOT NULL, -- 근무일
  start_time TIME NOT NULL, -- 근무 시작 시간
  end_time TIME NOT NULL, -- 근무 종료 시간
  break_duration INTEGER DEFAULT 0, -- 휴게시간 (분)
  overtime_hours DECIMAL(4,2) DEFAULT 0, -- 연장근무 시간
  daily_wage INTEGER, -- 해당일 급여
  memo TEXT, -- 특이사항
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Payroll_Calculations 테이블 생성 (급여 계산)
CREATE TABLE payroll_calculations (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_worker_id TEXT NOT NULL REFERENCES schedule_workers(id) ON DELETE CASCADE,
  total_hours DECIMAL(6,2) NOT NULL, -- 총 근무시간
  regular_hours DECIMAL(6,2) NOT NULL, -- 일반 근무시간
  overtime_hours DECIMAL(6,2) DEFAULT 0, -- 연장근무 시간
  night_hours DECIMAL(6,2) DEFAULT 0, -- 야간근무 시간 (22시~06시)
  regular_pay INTEGER NOT NULL, -- 일반 급여
  overtime_pay INTEGER DEFAULT 0, -- 연장근무 수당
  night_shift_pay INTEGER DEFAULT 0, -- 야간수당 (22시~06시)
  fuel_allowance INTEGER DEFAULT 0, -- 유류비
  other_allowance INTEGER DEFAULT 0, -- 기타비용
  total_gross_pay INTEGER NOT NULL, -- 총 지급액
  tax_amount INTEGER DEFAULT 0, -- 세금 (3.3%)
  net_pay INTEGER NOT NULL, -- 실지급액
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Clients 테이블 생성 (거래처)
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT, -- 담당자명
  phone TEXT,
  email TEXT,
  address TEXT,
  -- 파일 관련 컬럼들
  documents_folder_path TEXT, -- 문서 폴더 경로 (bucket/clients/{client_id}/)
  memo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Client_Documents 테이블 생성 (거래처 문서)
CREATE TABLE client_documents (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL, -- 원본 파일명
  file_url TEXT NOT NULL, -- 파일 URL (Supabase Storage)
  file_path TEXT NOT NULL, -- 파일 경로 (bucket/clients/{client_id}/documents/{filename})
  file_type TEXT NOT NULL, -- 파일 타입 (image/jpeg, application/pdf 등)
  file_size INTEGER, -- 파일 크기 (bytes)
  description TEXT, -- 파일 설명
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Schedule_Documents 테이블 생성 (스케줄 문서)
CREATE TABLE schedule_documents (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id TEXT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL, -- 원본 파일명
  file_url TEXT NOT NULL, -- 파일 URL (Supabase Storage)
  file_path TEXT NOT NULL, -- 파일 경로 (bucket/schedules/{schedule_id}/documents/{filename})
  file_type TEXT NOT NULL, -- 파일 타입 (image/jpeg, application/pdf 등)
  file_size INTEGER, -- 파일 크기 (bytes)
  document_type TEXT NOT NULL, -- 문서 타입 (manual, guide, photo, report 등)
  description TEXT, -- 파일 설명
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Users 테이블에 사업체 정보 및 파일 관련 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name TEXT; -- 사업체명
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_number TEXT; -- 사업자등록번호
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_address TEXT; -- 사업장 주소
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_phone TEXT; -- 사업장 전화번호
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_email TEXT; -- 사업장 이메일
-- 파일 관련 컬럼들
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_card_image_url TEXT; -- 명함 사진 URL
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_card_image_path TEXT; -- 명함 사진 경로
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_license_image_url TEXT; -- 사업자등록증 사진 URL
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_license_image_path TEXT; -- 사업자등록증 사진 경로

-- 13. RLS 정책 설정
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_documents ENABLE ROW LEVEL SECURITY;

-- 14. RLS 정책 생성 (사용자별 데이터 격리)
CREATE POLICY "Users can only access their own workers" ON workers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own schedules" ON schedules
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own schedule_times" ON schedule_times
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own schedule_workers" ON schedule_workers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own worker_times" ON worker_times
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own work_periods" ON work_periods
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own payroll_calculations" ON payroll_calculations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own clients" ON clients
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own client_documents" ON client_documents
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own schedule_documents" ON schedule_documents
  FOR ALL USING (auth.uid() = user_id);

-- 15. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_workers_user_id ON workers(user_id);
CREATE INDEX idx_schedules_user_id ON schedules(user_id);
CREATE INDEX idx_schedules_dates ON schedules(start_date, end_date);
CREATE INDEX idx_schedule_times_schedule_id ON schedule_times(schedule_id);
CREATE INDEX idx_schedule_workers_schedule_id ON schedule_workers(schedule_id);
CREATE INDEX idx_schedule_workers_worker_id ON schedule_workers(worker_id);
CREATE INDEX idx_worker_times_schedule_worker_id ON worker_times(schedule_worker_id);
CREATE INDEX idx_work_periods_schedule_worker_id ON work_periods(schedule_worker_id);
CREATE INDEX idx_payroll_calculations_schedule_worker_id ON payroll_calculations(schedule_worker_id);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_client_documents_client_id ON client_documents(client_id);
CREATE INDEX idx_schedule_documents_schedule_id ON schedule_documents(schedule_id);

-- 16. 트리거 함수 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 17. 트리거 생성
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_times_updated_at BEFORE UPDATE ON schedule_times
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_workers_updated_at BEFORE UPDATE ON schedule_workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_times_updated_at BEFORE UPDATE ON worker_times
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_periods_updated_at BEFORE UPDATE ON work_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 18. 코멘트 추가
COMMENT ON TABLE workers IS '근로자 정보 및 급여 설정';
COMMENT ON TABLE schedules IS '스케줄 정보 및 시간 설정';
COMMENT ON TABLE schedule_times IS '스케줄별 일일 근무 시간';
COMMENT ON TABLE schedule_workers IS '스케줄-근로자 관계 및 급여 옵션';
COMMENT ON TABLE worker_times IS '근로자별 일일 근무 시간';
COMMENT ON TABLE work_periods IS '일별 근무 시간 상세';
COMMENT ON TABLE payroll_calculations IS '급여 계산 결과';
COMMENT ON TABLE clients IS '거래처 정보';
COMMENT ON TABLE client_documents IS '거래처 관련 문서';
COMMENT ON TABLE schedule_documents IS '스케줄 관련 문서';
