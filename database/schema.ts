// Database schema definition
export const CREATE_TABLES = `
  -- Workers table
  CREATE TABLE IF NOT EXISTS workers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    resident_number TEXT,
    bank_account TEXT,
    hourly_wage INTEGER DEFAULT 15000,
    fuel_allowance INTEGER DEFAULT 0,
    other_allowance INTEGER DEFAULT 0,
    id_card_image_url TEXT,
    id_card_image_path TEXT,
    memo TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT,
  address TEXT,
  uniform_time BOOLEAN DEFAULT true,
  schedule_times TEXT DEFAULT '[]',
  documents_folder_path TEXT,
  has_attachments BOOLEAN DEFAULT false,
  schedule_type TEXT DEFAULT 'business' CHECK (schedule_type IN ('personal', 'business')),
  all_wages_paid BOOLEAN DEFAULT false,
  revenue_status TEXT DEFAULT 'pending' CHECK (revenue_status IN ('received', 'pending', 'overdue')),
  revenue_due_date TEXT,
  contract_amount INTEGER DEFAULT 0,
  client_id TEXT,
  memo TEXT,
  -- 반복 스케줄 관련 필드
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_end_type TEXT CHECK (recurrence_end_type IN ('never', 'date', 'count')),
  recurrence_end_date TEXT,
  recurrence_count INTEGER,
  recurrence_days_of_week TEXT DEFAULT '[]', -- JSON 배열 (weekly용, 0=일요일, 6=토요일)
  recurrence_day_of_month INTEGER, -- 월의 날짜 (monthly용, 1-31)
  recurrence_month_of_year INTEGER, -- 월 (yearly용, 1-12)
  parent_schedule_id TEXT, -- 원본 스케줄 ID (반복 인스턴스인 경우)
  recurrence_exceptions TEXT DEFAULT '[]', -- JSON 배열 (예외 날짜들, YYYY-MM-DD 형식)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

  -- Schedule times table (일별 시간 설정)
  CREATE TABLE IF NOT EXISTS schedule_times (
    id TEXT PRIMARY KEY,
    schedule_id TEXT NOT NULL,
    work_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    break_duration INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
  );

  -- Schedule workers (many-to-many relationship)
  CREATE TABLE IF NOT EXISTS schedule_workers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    schedule_id TEXT NOT NULL,
    worker_id TEXT NOT NULL,
    work_start_date TEXT NOT NULL,
    work_end_date TEXT NOT NULL,
    uniform_time BOOLEAN DEFAULT true,
    hourly_wage INTEGER,
    fuel_allowance INTEGER DEFAULT 0,
    other_allowance INTEGER DEFAULT 0,
    overtime_enabled BOOLEAN DEFAULT true,
    night_shift_enabled BOOLEAN DEFAULT true,
    tax_withheld BOOLEAN DEFAULT true,
    paid BOOLEAN DEFAULT false,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
  );

  -- Worker times table (근로자별 시간 설정)
  CREATE TABLE IF NOT EXISTS worker_times (
    id TEXT PRIMARY KEY,
    schedule_worker_id TEXT NOT NULL,
    work_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    break_duration INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_worker_id) REFERENCES schedule_workers(id) ON DELETE CASCADE
  );

  -- Work periods table
  CREATE TABLE IF NOT EXISTS work_periods (
    id TEXT PRIMARY KEY,
    schedule_worker_id TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    break_duration INTEGER DEFAULT 0,
    overtime_hours REAL DEFAULT 0,
    daily_wage INTEGER DEFAULT 0,
    memo TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_worker_id) REFERENCES schedule_workers(id) ON DELETE CASCADE
  );

  -- Payroll calculations table
  CREATE TABLE IF NOT EXISTS payroll_calculations (
    id TEXT PRIMARY KEY,
    schedule_worker_id TEXT NOT NULL,
    base_pay INTEGER NOT NULL,
    overtime_pay INTEGER DEFAULT 0,
    night_shift_pay INTEGER DEFAULT 0,
    fuel_allowance INTEGER DEFAULT 0,
    other_allowance INTEGER DEFAULT 0,
    total_pay INTEGER NOT NULL,
    tax_withheld INTEGER DEFAULT 0,
    net_pay INTEGER NOT NULL,
    calculated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_worker_id) REFERENCES schedule_workers(id) ON DELETE CASCADE
  );

  -- Clients table (거래처)
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    business_number TEXT,
    contact_person TEXT,
    documents_folder_path TEXT,
    memo TEXT,
    total_revenue INTEGER DEFAULT 0,
    unpaid_amount INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Client contacts table (거래처 담당자)
  CREATE TABLE IF NOT EXISTS client_contacts (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    name TEXT NOT NULL,
    position TEXT,
    phone TEXT NOT NULL,
    memo TEXT,
    is_primary INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );

  -- Client documents table
  CREATE TABLE IF NOT EXISTS client_documents (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );

  -- Document categories table (서류 분류)
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

  -- Schedule contracts table (계약서 관리)
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

  -- Contract documents table (계약서 첨부파일)
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

  -- Schedule documents table (기존 테이블 개선)
  CREATE TABLE IF NOT EXISTS schedule_documents (
    id TEXT PRIMARY KEY,
    schedule_id TEXT NOT NULL,
    category_id TEXT,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    document_type TEXT NOT NULL CHECK (document_type IN ('contract', 'guidance', 'safety', 'equipment', 'other')),
    description TEXT,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES document_categories(id) ON DELETE SET NULL
  );

  -- User profiles table
  CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    business_name TEXT,
    business_number TEXT,
    business_address TEXT,
    business_phone TEXT,
    business_email TEXT,
    business_card_image_url TEXT,
    business_card_image_path TEXT,
    business_license_image_url TEXT,
    business_license_image_path TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Activities table (for tracking recent activities)
  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    related_id TEXT,
    icon TEXT,
    color TEXT,
    is_read BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Indexes for better query performance
  CREATE INDEX IF NOT EXISTS idx_workers_user_id ON workers(user_id);
  CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
  CREATE INDEX IF NOT EXISTS idx_schedules_start_date ON schedules(start_date);
  CREATE INDEX IF NOT EXISTS idx_schedules_contract_amount ON schedules(contract_amount);
  CREATE INDEX IF NOT EXISTS idx_schedules_schedule_type ON schedules(schedule_type);
  CREATE INDEX IF NOT EXISTS idx_schedules_is_recurring ON schedules(is_recurring);
  CREATE INDEX IF NOT EXISTS idx_schedules_parent_schedule_id ON schedules(parent_schedule_id);
  CREATE INDEX IF NOT EXISTS idx_schedule_times_schedule_id ON schedule_times(schedule_id);
  CREATE INDEX IF NOT EXISTS idx_schedule_workers_user_id ON schedule_workers(user_id);
  CREATE INDEX IF NOT EXISTS idx_schedule_workers_schedule ON schedule_workers(schedule_id);
  CREATE INDEX IF NOT EXISTS idx_schedule_workers_worker ON schedule_workers(worker_id);
  CREATE INDEX IF NOT EXISTS idx_worker_times_schedule_worker ON worker_times(schedule_worker_id);
  CREATE INDEX IF NOT EXISTS idx_work_periods_schedule_worker ON work_periods(schedule_worker_id);
  CREATE INDEX IF NOT EXISTS idx_payroll_calculations_schedule_worker ON payroll_calculations(schedule_worker_id);
  CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
  CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts(client_id);
  CREATE INDEX IF NOT EXISTS idx_client_documents_client ON client_documents(client_id);
  CREATE INDEX IF NOT EXISTS idx_document_categories_sort_order ON document_categories(sort_order);
  CREATE INDEX IF NOT EXISTS idx_schedule_contracts_schedule ON schedule_contracts(schedule_id);
  CREATE INDEX IF NOT EXISTS idx_schedule_contracts_status ON schedule_contracts(contract_status);
  CREATE INDEX IF NOT EXISTS idx_schedule_contracts_type ON schedule_contracts(contract_type);
  CREATE INDEX IF NOT EXISTS idx_contract_documents_contract ON contract_documents(contract_id);
  CREATE INDEX IF NOT EXISTS idx_schedule_documents_schedule ON schedule_documents(schedule_id);
  CREATE INDEX IF NOT EXISTS idx_schedule_documents_category ON schedule_documents(category_id);
  CREATE INDEX IF NOT EXISTS idx_schedule_documents_type ON schedule_documents(document_type);
  CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
  CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
`;

