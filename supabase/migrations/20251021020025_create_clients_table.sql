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

-- RLS 비활성화
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE clients TO anon;
GRANT ALL ON TABLE client_contacts TO anon;
GRANT ALL ON TABLE clients TO authenticated;
GRANT ALL ON TABLE client_contacts TO authenticated;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts(client_id);
