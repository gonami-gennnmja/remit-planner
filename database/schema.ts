// Database schema definition
export const CREATE_TABLES = `
  -- Workers table
  CREATE TABLE IF NOT EXISTS workers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    bank_account TEXT NOT NULL,
    hourly_wage INTEGER NOT NULL,
    tax_withheld INTEGER DEFAULT 0,
    memo TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Schedules table
  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT,
    address TEXT,
    memo TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Schedule workers (many-to-many relationship)
  CREATE TABLE IF NOT EXISTS schedule_workers (
    id TEXT PRIMARY KEY,
    schedule_id TEXT NOT NULL,
    worker_id TEXT NOT NULL,
    paid INTEGER DEFAULT 0,
    work_hours REAL,
    full_period INTEGER DEFAULT 1,
    work_start_date TEXT,
    work_end_date TEXT,
    hourly_wage INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
  );

  -- Work periods table
  CREATE TABLE IF NOT EXISTS work_periods (
    id TEXT PRIMARY KEY,
    schedule_worker_id TEXT NOT NULL,
    work_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_worker_id) REFERENCES schedule_workers(id) ON DELETE CASCADE
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
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Clients table (거래처)
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    business_number TEXT,
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

  -- Indexes for better query performance
  CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
  CREATE INDEX IF NOT EXISTS idx_schedule_workers_schedule ON schedule_workers(schedule_id);
  CREATE INDEX IF NOT EXISTS idx_schedule_workers_worker ON schedule_workers(worker_id);
  CREATE INDEX IF NOT EXISTS idx_work_periods_schedule_worker ON work_periods(schedule_worker_id);
  CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
  CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts(client_id);
`;

