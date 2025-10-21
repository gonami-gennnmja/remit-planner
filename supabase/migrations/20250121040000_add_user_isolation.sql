-- 사용자별 데이터 분리를 위한 마이그레이션
-- 모든 테이블에 user_id 컬럼 추가 및 RLS 정책 설정

-- 1. Workers 테이블에 user_id 추가
ALTER TABLE workers ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_workers_user_id ON workers(user_id);

-- 2. Schedules 테이블에 user_id 추가
ALTER TABLE schedules ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_schedules_user_id ON schedules(user_id);

-- 3. Schedule_workers 테이블에 user_id 추가
ALTER TABLE schedule_workers ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_schedule_workers_user_id ON schedule_workers(user_id);

-- 4. Work_periods 테이블에 user_id 추가
ALTER TABLE work_periods ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_work_periods_user_id ON work_periods(user_id);

-- 5. Activities 테이블에 user_id 추가
ALTER TABLE activities ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_activities_user_id ON activities(user_id);

-- 6. Clients 테이블에 user_id 추가
ALTER TABLE clients ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_clients_user_id ON clients(user_id);

-- 7. Client_contacts 테이블에 user_id 추가
ALTER TABLE client_contacts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_client_contacts_user_id ON client_contacts(user_id);

-- 8. Categories 테이블에 user_id 추가 (만약 존재한다면)
ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- Row Level Security (RLS) 정책 설정

-- Workers 테이블 RLS
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workers" ON workers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workers" ON workers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workers" ON workers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workers" ON workers
  FOR DELETE USING (auth.uid() = user_id);

-- Schedules 테이블 RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schedules" ON schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedules" ON schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules" ON schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules" ON schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Schedule_workers 테이블 RLS
ALTER TABLE schedule_workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schedule_workers" ON schedule_workers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedule_workers" ON schedule_workers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule_workers" ON schedule_workers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule_workers" ON schedule_workers
  FOR DELETE USING (auth.uid() = user_id);

-- Work_periods 테이블 RLS
ALTER TABLE work_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own work_periods" ON work_periods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own work_periods" ON work_periods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work_periods" ON work_periods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work_periods" ON work_periods
  FOR DELETE USING (auth.uid() = user_id);

-- Activities 테이블 RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities" ON activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON activities
  FOR DELETE USING (auth.uid() = user_id);

-- Clients 테이블 RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" ON clients
  FOR DELETE USING (auth.uid() = user_id);

-- Client_contacts 테이블 RLS
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own client_contacts" ON client_contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own client_contacts" ON client_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own client_contacts" ON client_contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own client_contacts" ON client_contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Categories 테이블 RLS (만약 존재한다면)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- 기존 데이터 정리 (모든 기존 데이터를 admin 사용자에게 할당)
-- 주의: 이 작업은 기존 데이터를 admin 사용자에게 할당합니다
-- 다른 사용자에게 할당하려면 user_id를 변경하세요

-- Admin 사용자 ID 확인 (실제 admin 사용자 ID로 변경 필요)
-- UPDATE workers SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@remit-planner.com' LIMIT 1);
-- UPDATE schedules SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@remit-planner.com' LIMIT 1);
-- UPDATE schedule_workers SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@remit-planner.com' LIMIT 1);
-- UPDATE work_periods SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@remit-planner.com' LIMIT 1);
-- UPDATE activities SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@remit-planner.com' LIMIT 1);
-- UPDATE clients SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@remit-planner.com' LIMIT 1);
-- UPDATE client_contacts SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@remit-planner.com' LIMIT 1);
-- UPDATE categories SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@remit-planner.com' LIMIT 1);

-- user_id가 NULL인 데이터 삭제 (보안상 중요)
DELETE FROM workers WHERE user_id IS NULL;
DELETE FROM schedules WHERE user_id IS NULL;
DELETE FROM schedule_workers WHERE user_id IS NULL;
DELETE FROM work_periods WHERE user_id IS NULL;
DELETE FROM activities WHERE user_id IS NULL;
DELETE FROM clients WHERE user_id IS NULL;
DELETE FROM client_contacts WHERE user_id IS NULL;
DELETE FROM categories WHERE user_id IS NULL;

-- user_id 컬럼을 NOT NULL로 변경
ALTER TABLE workers ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE schedules ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE schedule_workers ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE work_periods ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE activities ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE client_contacts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;
