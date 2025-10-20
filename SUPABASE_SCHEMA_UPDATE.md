# Supabase 스키마 업데이트 가이드

## 🔄 스키마 업데이트 방법

### **0. Supabase CLI 사용 (권장) ⭐**

#### **A. CLI 설정 (최초 1회)**

```bash
# 1. Supabase 프로젝트 초기화
npx supabase init

# 2. Supabase 로그인 (Access Token 필요)
npx supabase login

# 3. 프로젝트 연결
npx supabase link --project-ref YOUR_PROJECT_REF
```

#### **B. 마이그레이션 생성 및 적용**

```bash
# 1. 새 마이그레이션 생성
npx supabase migration new add_new_table

# 2. 생성된 파일에 SQL 작성
# 파일 위치: supabase/migrations/YYYYMMDDHHMMSS_add_new_table.sql

# 3. 로컬에서 테스트 (선택사항)
npx supabase db reset

# 4. 원격 DB에 적용
npx supabase db push

# 5. 마이그레이션 상태 확인
npx supabase migration list
```

**장점:**

- ✅ 버전 관리 가능
- ✅ 자동 롤백 지원
- ✅ 팀 협업 용이
- ✅ 프로덕션 배포 안전

**마이그레이션 파일 예시:**

```sql
-- supabase/migrations/20241018000001_add_categories.sql
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

INSERT INTO categories (id, name, color) VALUES
  ('cat-education', '교육', '#8b5cf6'),
  ('cat-work', '업무', '#06b6d4')
ON CONFLICT (name) DO NOTHING;
```

---

### **1. 안전한 업데이트 (권장)**

#### **A. 기존 데이터 보존하면서 업데이트**

```sql
-- 1. Supabase SQL Editor에서 실행
-- 2. database/supabase-schema.sql 파일 내용 복사/붙여넣기
-- 3. Run 클릭
```

**장점:**

- ✅ 기존 데이터 보존
- ✅ `IF NOT EXISTS`로 안전하게 실행
- ✅ 여러 번 실행 가능

**단점:**

- ❌ 테이블 구조 변경 시 제한적
- ❌ 컬럼 타입 변경 불가

---

### **2. 완전 재생성 (데이터 초기화)**

#### **A. 모든 테이블 삭제 후 재생성**

```sql
-- 1. 기존 테이블 삭제 (CASCADE로 외래키도 함께 삭제)
DROP TABLE IF EXISTS work_periods CASCADE;
DROP TABLE IF EXISTS schedule_workers CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS activities CASCADE;

-- 2. 원본 스키마 실행
-- (database/supabase-schema.sql 내용 복사/붙여넣기)
```

**장점:**

- ✅ 완전히 새로운 구조로 시작
- ✅ 모든 변경사항 적용 가능
- ✅ 깔끔한 상태

**단점:**

- ❌ 기존 데이터 모두 삭제
- ❌ 백업 필요

---

### **3. 단계별 업데이트**

#### **A. 새 컬럼 추가**

```sql
-- 예: workers 테이블에 새 컬럼 추가
ALTER TABLE workers ADD COLUMN IF NOT EXISTS new_field TEXT;
```

#### **B. 컬럼 타입 변경**

```sql
-- 예: hourly_wage를 DECIMAL로 변경
ALTER TABLE workers ALTER COLUMN hourly_wage TYPE DECIMAL(10,2);
```

#### **C. 인덱스 추가**

```sql
-- 예: 새 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_workers_new_field ON workers(new_field);
```

---

## 🛠️ Supabase CLI 고급 사용법

### **A. 마이그레이션 관리**

```bash
# 마이그레이션 상태 확인
npx supabase migration list

# 특정 마이그레이션까지 롤백
npx supabase db reset --db-url "postgresql://..."

# 마이그레이션 히스토리 확인
npx supabase migration list --local
```

### **B. 로컬 개발 환경**

```bash
# 로컬 Supabase 시작
npx supabase start

# 로컬 DB 리셋
npx supabase db reset --local

# 로컬에서 마이그레이션 적용
npx supabase db push --local
```

### **C. 프로덕션 배포**

```bash
# 프로덕션에 마이그레이션 적용
npx supabase db push --project-ref YOUR_PROJECT_REF

# 드라이런 (실제 적용하지 않고 확인만)
npx supabase db push --dry-run

# 모든 마이그레이션 포함 (히스토리 테이블에 없는 것도)
npx supabase db push --include-all
```

### **D. 문제 해결**

```bash
# 디버그 모드로 실행
npx supabase db push --debug

# 특정 마이그레이션만 적용
npx supabase migration up --target 20241018000001

# 마이그레이션 롤백
npx supabase migration down
```

---

## 🛠️ 실제 업데이트 절차

### **1단계: 현재 상태 확인**

```sql
-- 테이블 목록 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- 특정 테이블 구조 확인
\d workers;
```

### **2단계: 백업 (선택사항)**

```sql
-- 데이터 백업 (필요한 경우)
CREATE TABLE workers_backup AS SELECT * FROM workers;
CREATE TABLE schedules_backup AS SELECT * FROM schedules;
```

### **3단계: 스키마 업데이트**

```sql
-- 방법 1: 안전한 업데이트
-- database/supabase-schema.sql 내용 실행

-- 방법 2: 완전 재생성
DROP TABLE IF EXISTS work_periods CASCADE;
DROP TABLE IF EXISTS schedule_workers CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
-- 그 다음 database/supabase-schema.sql 실행
```

### **4단계: 확인**

```sql
-- 테이블 생성 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- 데이터 확인
SELECT COUNT(*) FROM workers;
SELECT COUNT(*) FROM schedules;
```

---

## ⚠️ 주의사항

### **1. 외래키 제약조건**

- 테이블 삭제 시 `CASCADE` 사용
- 순서대로 삭제: `work_periods` → `schedule_workers` → `schedules` → `workers`

### **2. 데이터 타입 변경**

- 기존 데이터가 있는 경우 타입 변경 시 오류 가능
- `ALTER COLUMN` 사용 시 데이터 호환성 확인

### **3. 인덱스 및 트리거**

- 테이블 재생성 시 인덱스와 트리거도 함께 재생성
- `IF NOT EXISTS`로 중복 생성 방지

---

## 🔧 문제 해결

### **1. "relation already exists" 오류**

```sql
-- 해결: DROP 후 재생성
DROP TABLE IF EXISTS table_name CASCADE;
-- 그 다음 CREATE TABLE 실행
```

### **2. "column does not exist" 오류**

```sql
-- 해결: 컬럼 추가
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TYPE;
```

### **3. 외래키 제약조건 오류**

```sql
-- 해결: CASCADE 사용
DROP TABLE IF EXISTS table_name CASCADE;
```

---

## 📋 체크리스트

### **CLI 사용 시:**

- [ ] Supabase CLI 설치 및 로그인
- [ ] 프로젝트 연결 확인 (`npx supabase status`)
- [ ] 새 마이그레이션 생성 (`npx supabase migration new`)
- [ ] 마이그레이션 파일 작성
- [ ] 로컬 테스트 (`npx supabase db reset --local`)
- [ ] 원격 적용 (`npx supabase db push`)
- [ ] 마이그레이션 상태 확인 (`npx supabase migration list`)

### **수동 업데이트 시:**

- [ ] 현재 데이터 백업 (필요한 경우)
- [ ] 스키마 파일 확인 (`database/supabase-schema.sql`)
- [ ] Supabase SQL Editor에서 실행
- [ ] 테이블 생성 확인
- [ ] 앱에서 연결 테스트
- [ ] 데이터 CRUD 테스트

---

## 🚀 권장 워크플로우

### **개발 단계별 권장 방법:**

1. **초기 설정**: Supabase CLI 설정 및 마이그레이션 구조 구축
2. **개발 중**: CLI 마이그레이션 사용 (`npx supabase migration new`)
3. **로컬 테스트**: `npx supabase db reset --local`로 깔끔하게 시작
4. **스테이징**: `npx supabase db push --dry-run`으로 미리 확인
5. **프로덕션**: `npx supabase db push`로 안전하게 배포

### **팀 협업 시:**

- 마이그레이션 파일을 Git으로 버전 관리
- PR 리뷰 후 마이그레이션 적용
- 롤백 계획 수립 (`npx supabase migration down`)

**결론: CLI 사용을 권장하며, 마이그레이션으로 안전하고 체계적으로 스키마를 관리하세요!** 🎯

---

## 🔗 관련 파일

- **마이그레이션 폴더**: `supabase/migrations/`
- **설정 파일**: `supabase/config.toml`
- **기존 스키마**: `database/supabase-schema.sql`
- **카테고리 스키마**: `database/supabase-categories-schema.sql`
