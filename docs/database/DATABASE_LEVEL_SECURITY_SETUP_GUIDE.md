# 🔒 데이터베이스 레벨 보안 설정 가이드

## 📋 **현재 상태**

### ✅ **준비 완료:**

- 마이그레이션 파일 생성됨: `supabase/migrations/20250121040000_add_user_isolation.sql`
- 모든 테이블에 `user_id` 컬럼 추가 및 RLS 정책 정의됨
- 기존 데이터 할당 스크립트 준비됨: `EXECUTE_DATA_ASSIGNMENT.sql`

### ⚠️ **실행 필요:**

- Supabase 데이터베이스에 마이그레이션 적용 필요
- 기존 데이터를 현재 admin 사용자에게 할당 필요

---

## 🚀 **데이터베이스 레벨 보안 설정 방법**

### **방법 1: Supabase Dashboard에서 직접 실행 (권장)**

#### **1단계: 마이그레이션 실행**

1. **Supabase Dashboard** 접속: https://supabase.com/dashboard
2. **프로젝트 선택**
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New query** 클릭
5. 아래 SQL을 복사해서 붙여넣기:

```sql
-- 사용자별 데이터 분리를 위한 마이그레이션
-- 모든 테이블에 user_id 컬럼 추가 및 RLS 정책 설정

-- 1. Workers 테이블에 user_id 추가
ALTER TABLE workers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_workers_user_id ON workers(user_id);

-- 2. Schedules 테이블에 user_id 추가
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);

-- 3. Schedule_workers 테이블에 user_id 추가
ALTER TABLE schedule_workers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_schedule_workers_user_id ON schedule_workers(user_id);

-- 4. Work_periods 테이블에 user_id 추가
ALTER TABLE work_periods ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_work_periods_user_id ON work_periods(user_id);

-- 5. Activities 테이블에 user_id 추가
ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);

-- 6. Clients 테이블에 user_id 추가
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- 7. Client_contacts 테이블에 user_id 추가
ALTER TABLE client_contacts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_client_contacts_user_id ON client_contacts(user_id);

-- Row Level Security (RLS) 정책 설정

-- Workers 테이블 RLS
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own workers" ON workers;
CREATE POLICY "Users can view their own workers" ON workers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own workers" ON workers;
CREATE POLICY "Users can insert their own workers" ON workers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own workers" ON workers;
CREATE POLICY "Users can update their own workers" ON workers
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own workers" ON workers;
CREATE POLICY "Users can delete their own workers" ON workers
  FOR DELETE USING (auth.uid() = user_id);

-- Schedules 테이블 RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own schedules" ON schedules;
CREATE POLICY "Users can view their own schedules" ON schedules
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own schedules" ON schedules;
CREATE POLICY "Users can insert their own schedules" ON schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own schedules" ON schedules;
CREATE POLICY "Users can update their own schedules" ON schedules
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own schedules" ON schedules;
CREATE POLICY "Users can delete their own schedules" ON schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Schedule_workers 테이블 RLS
ALTER TABLE schedule_workers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own schedule_workers" ON schedule_workers;
CREATE POLICY "Users can view their own schedule_workers" ON schedule_workers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own schedule_workers" ON schedule_workers;
CREATE POLICY "Users can insert their own schedule_workers" ON schedule_workers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own schedule_workers" ON schedule_workers;
CREATE POLICY "Users can update their own schedule_workers" ON schedule_workers
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own schedule_workers" ON schedule_workers;
CREATE POLICY "Users can delete their own schedule_workers" ON schedule_workers
  FOR DELETE USING (auth.uid() = user_id);

-- Work_periods 테이블 RLS
ALTER TABLE work_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own work_periods" ON work_periods;
CREATE POLICY "Users can view their own work_periods" ON work_periods
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own work_periods" ON work_periods;
CREATE POLICY "Users can insert their own work_periods" ON work_periods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own work_periods" ON work_periods;
CREATE POLICY "Users can update their own work_periods" ON work_periods
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own work_periods" ON work_periods;
CREATE POLICY "Users can delete their own work_periods" ON work_periods
  FOR DELETE USING (auth.uid() = user_id);

-- Activities 테이블 RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
CREATE POLICY "Users can view their own activities" ON activities
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own activities" ON activities;
CREATE POLICY "Users can insert their own activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own activities" ON activities;
CREATE POLICY "Users can update their own activities" ON activities
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own activities" ON activities;
CREATE POLICY "Users can delete their own activities" ON activities
  FOR DELETE USING (auth.uid() = user_id);

-- Clients 테이블 RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
CREATE POLICY "Users can view their own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
CREATE POLICY "Users can insert their own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
CREATE POLICY "Users can update their own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;
CREATE POLICY "Users can delete their own clients" ON clients
  FOR DELETE USING (auth.uid() = user_id);

-- Client_contacts 테이블 RLS
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own client_contacts" ON client_contacts;
CREATE POLICY "Users can view their own client_contacts" ON client_contacts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own client_contacts" ON client_contacts;
CREATE POLICY "Users can insert their own client_contacts" ON client_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own client_contacts" ON client_contacts;
CREATE POLICY "Users can update their own client_contacts" ON client_contacts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own client_contacts" ON client_contacts;
CREATE POLICY "Users can delete their own client_contacts" ON client_contacts
  FOR DELETE USING (auth.uid() = user_id);
```

6. **Run** 버튼 클릭하여 실행
7. 성공 메시지 확인

---

#### **2단계: 기존 데이터 할당**

**이미 열려있는 `EXECUTE_DATA_ASSIGNMENT.sql` 파일의 내용을 Supabase SQL Editor에서 실행하세요.**

1. **Supabase Dashboard > SQL Editor**
2. **New query** 클릭
3. `EXECUTE_DATA_ASSIGNMENT.sql` 파일 내용 복사 & 붙여넣기
4. **Run** 버튼 클릭
5. 성공 메시지 확인

---

### **방법 2: Supabase CLI 사용**

```bash
# Supabase에 로그인
npx supabase login

# 마이그레이션 적용
npx supabase db push

# 기존 데이터 할당 스크립트 실행
npx supabase db execute EXECUTE_DATA_ASSIGNMENT.sql
```

---

## ✅ **설정 확인 방법**

### **1. RLS 정책 확인**

Supabase Dashboard에서:

1. **Database** > **Tables** 선택
2. `workers` 테이블 클릭
3. **Policies** 탭 클릭
4. 다음 정책들이 있는지 확인:
   - ✅ Users can view their own workers
   - ✅ Users can insert their own workers
   - ✅ Users can update their own workers
   - ✅ Users can delete their own workers

### **2. user_id 컬럼 확인**

SQL Editor에서 실행:

```sql
-- 모든 테이블의 user_id 컬럼 확인
SELECT column_name, table_name
FROM information_schema.columns
WHERE column_name = 'user_id'
  AND table_schema = 'public';
```

### **3. 데이터 할당 확인**

SQL Editor에서 실행:

```sql
-- 각 테이블의 데이터가 user_id를 가지고 있는지 확인
SELECT 'workers' as table_name, COUNT(*) as total, COUNT(user_id) as with_user_id FROM workers
UNION ALL
SELECT 'schedules', COUNT(*), COUNT(user_id) FROM schedules
UNION ALL
SELECT 'clients', COUNT(*), COUNT(user_id) FROM clients
UNION ALL
SELECT 'activities', COUNT(*), COUNT(user_id) FROM activities;
```

---

## 🛡️ **보안 레벨 완성 후 효과**

### **✅ 데이터베이스 레벨에서 차단:**

- 사용자 A가 사용자 B의 데이터를 조회하려고 하면 → **빈 결과 반환**
- 사용자 A가 사용자 B의 데이터를 수정하려고 하면 → **에러 발생**
- 사용자 A가 사용자 B의 데이터를 삭제하려고 하면 → **에러 발생**

### **✅ 애플리케이션 레벨과 이중 보안:**

- 애플리케이션 코드에서 `user_id` 필터링 적용 (1차 방어)
- 데이터베이스에서 RLS 정책으로 차단 (2차 방어)
- **이중 보안 체계로 완벽한 데이터 격리!**

---

## ⚠️ **주의사항**

1. **기존 데이터 백업**: 마이그레이션 실행 전에 반드시 백업하세요.
2. **Admin 계정 확인**: `admin@remit-planner.com` 계정이 존재하는지 확인하세요.
3. **테스트**: 마이그레이션 후 앱에서 데이터 조회/생성/수정/삭제가 정상 작동하는지 테스트하세요.

---

## 🎉 **완료 후**

데이터베이스 레벨 보안이 설정되면:

- ✅ 3단계 보안 체계 완성 (DB 레벨 + 앱 레벨 + 인증 레벨)
- ✅ 완벽한 사용자별 데이터 분리
- ✅ 다중 사용자 환경 준비 완료
