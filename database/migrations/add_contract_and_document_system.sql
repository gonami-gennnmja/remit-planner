-- 계약서 및 서류 분류 시스템 추가 마이그레이션
-- 이 스크립트는 기존 데이터베이스에 새로운 테이블들을 추가합니다.

-- 1. schedules 테이블에 contract_amount 컬럼 추가 (이미 추가된 경우 무시)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'schedules' AND column_name = 'contract_amount') THEN
        ALTER TABLE schedules ADD COLUMN contract_amount INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. 서류 분류 테이블 생성
CREATE TABLE IF NOT EXISTS document_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'document-outline',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. 계약서 관리 테이블 생성
CREATE TABLE IF NOT EXISTS schedule_contracts (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('written', 'verbal', 'text')),
  contract_direction TEXT NOT NULL CHECK (contract_direction IN ('sent', 'received')),
  contract_amount INTEGER NOT NULL,
  contract_content TEXT,
  contract_status TEXT DEFAULT 'draft' CHECK (contract_status IN ('draft', 'sent', 'received', 'approved', 'rejected')),
  sent_date TEXT,
  received_date TEXT,
  approved_date TEXT,
  rejected_date TEXT,
  rejection_reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

-- 4. 계약서 첨부파일 테이블 생성
CREATE TABLE IF NOT EXISTS contract_documents (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  document_type TEXT NOT NULL CHECK (document_type IN ('contract', 'amendment', 'attachment')),
  description TEXT,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES schedule_contracts(id) ON DELETE CASCADE
);

-- 5. 기존 schedule_documents 테이블에 새로운 컬럼들 추가 (이미 존재하는 경우 무시)
DO $$ 
BEGIN
    -- category_id 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'schedule_documents' AND column_name = 'category_id') THEN
        ALTER TABLE schedule_documents ADD COLUMN category_id TEXT;
    END IF;
    
    -- description 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'schedule_documents' AND column_name = 'description') THEN
        ALTER TABLE schedule_documents ADD COLUMN description TEXT;
    END IF;
END $$;

-- 6. 새로운 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_schedules_contract_amount ON schedules(contract_amount);
CREATE INDEX IF NOT EXISTS idx_document_categories_sort_order ON document_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_schedule_contracts_schedule ON schedule_contracts(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_contracts_status ON schedule_contracts(contract_status);
CREATE INDEX IF NOT EXISTS idx_schedule_contracts_type ON schedule_contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_contract_documents_contract ON contract_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_schedule_documents_category ON schedule_documents(category_id);
CREATE INDEX IF NOT EXISTS idx_schedule_documents_type ON schedule_documents(document_type);

-- 7. 기본 서류 분류 데이터 삽입
INSERT INTO document_categories (id, name, description, color, icon, sort_order) VALUES
('cat-contract', '계약서', '계약서 및 계약 관련 서류', '#ef4444', 'document-text-outline', 1),
('cat-guidance', '안내사항', '작업 안내 및 지침서', '#3b82f6', 'information-circle-outline', 2),
('cat-safety', '안전관리', '안전 관련 서류 및 교육자료', '#10b981', 'shield-checkmark-outline', 3),
('cat-equipment', '장비/도구', '장비 사용법 및 관리 서류', '#f59e0b', 'construct-outline', 4),
('cat-report', '보고서', '작업 보고서 및 결과물', '#8b5cf6', 'bar-chart-outline', 5),
('cat-other', '기타', '기타 서류', '#6b7280', 'folder-outline', 6)
ON CONFLICT (id) DO NOTHING;

-- 8. 기존 schedule_documents의 document_type을 'other'로 설정 (기본값)
UPDATE schedule_documents SET document_type = 'other' WHERE document_type IS NULL;
