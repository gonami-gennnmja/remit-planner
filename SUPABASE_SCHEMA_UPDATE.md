# Supabase 스키마 업데이트 가이드

## 🔄 스키마 업데이트 방법

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

- [ ] 현재 데이터 백업 (필요한 경우)
- [ ] 스키마 파일 확인 (`database/supabase-schema.sql`)
- [ ] Supabase SQL Editor에서 실행
- [ ] 테이블 생성 확인
- [ ] 앱에서 연결 테스트
- [ ] 데이터 CRUD 테스트

---

## 🚀 권장 워크플로우

1. **개발 중**: 안전한 업데이트 사용
2. **테스트**: 완전 재생성으로 깔끔하게 시작
3. **프로덕션**: 단계별 업데이트로 데이터 보존

**결론: 스키마를 여러 번 업데이트할 수 있지만, 데이터 보존 여부에 따라 방법을 선택하세요!** 🎯
