# 🔒 사용자별 데이터 분리 테스트 가이드

## ✅ **구현 완료 사항**

### **1. 데이터베이스 스키마 업데이트**

- ✅ 모든 테이블에 `user_id` 컬럼 추가
- ✅ Row Level Security (RLS) 정책 설정
- ✅ 인덱스 추가로 성능 최적화

### **2. 코드 업데이트**

- ✅ `SupabaseRepository`에 사용자 인증 헬퍼 함수 추가
- ✅ 모든 주요 메서드에 `user_id` 필터링 추가:
  - `createWorker`, `getAllWorkers`
  - `createSchedule`, `getAllSchedules`
  - `createClient`, `getAllClients`
  - `createActivity`, `getRecentActivities`

## 🧪 **테스트 방법**

### **1. 기본 기능 테스트**

1. **로그인**: `admin@remit-planner.com` / `123456`
2. **근로자 추가**: 근로자 관리에서 새 근로자 추가
3. **일정 추가**: 일정 관리에서 새 일정 추가
4. **거래처 추가**: 거래처 관리에서 새 거래처 추가

### **2. 사용자별 데이터 분리 테스트**

#### **A. 같은 사용자 (admin)**

- ✅ 로그인 후 추가한 데이터가 정상적으로 표시되는지 확인
- ✅ 메인 화면의 "오늘 일정"에 새 일정이 표시되는지 확인
- ✅ 최근 활동에 새 활동이 표시되는지 확인

#### **B. 다른 사용자 (새 계정)**

1. **회원가입**: 새로운 이메일로 회원가입
2. **로그인**: 새 계정으로 로그인
3. **데이터 확인**:
   - ✅ admin의 데이터가 보이지 않는지 확인
   - ✅ 빈 화면이 표시되는지 확인
4. **새 데이터 추가**: 새 계정으로 데이터 추가
5. **데이터 분리 확인**:
   - ✅ admin 계정으로 다시 로그인
   - ✅ 새 계정의 데이터가 보이지 않는지 확인

### **3. 보안 테스트**

#### **A. 직접 데이터베이스 접근 테스트**

```sql
-- Supabase SQL Editor에서 실행
-- 다른 사용자의 데이터에 접근할 수 없는지 확인

-- 1. admin 계정으로 로그인된 상태에서
SELECT * FROM workers;
-- 결과: admin의 근로자만 표시되어야 함

-- 2. 새 계정으로 로그인된 상태에서
SELECT * FROM workers;
-- 결과: 새 계정의 근로자만 표시되어야 함 (또는 빈 결과)
```

#### **B. RLS 정책 테스트**

```sql
-- RLS가 비활성화된 상태에서 테스트 (임시로)
ALTER TABLE workers DISABLE ROW LEVEL SECURITY;
SELECT * FROM workers;
-- 결과: 모든 사용자의 데이터가 표시됨

-- RLS 다시 활성화
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
SELECT * FROM workers;
-- 결과: 현재 사용자의 데이터만 표시됨
```

## 🚨 **예상 결과**

### **✅ 정상 동작**

- 각 사용자는 자신의 데이터만 볼 수 있음
- 다른 사용자의 데이터에 접근할 수 없음
- 새 데이터 생성 시 자동으로 현재 사용자에게 할당됨

### **❌ 문제 발생 시**

- **모든 데이터가 보임**: RLS 정책이 제대로 설정되지 않음
- **데이터가 보이지 않음**: `user_id` 할당이 제대로 되지 않음
- **오류 발생**: 사용자 인증이 제대로 되지 않음

## 🔧 **문제 해결**

### **1. RLS 정책 확인**

```sql
-- RLS가 활성화되어 있는지 확인
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 정책이 설정되어 있는지 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### **2. 사용자 인증 확인**

```sql
-- 현재 인증된 사용자 확인
SELECT auth.uid();
```

### **3. 데이터 확인**

```sql
-- 각 테이블의 user_id 분포 확인
SELECT user_id, COUNT(*)
FROM workers
GROUP BY user_id;

SELECT user_id, COUNT(*)
FROM schedules
GROUP BY user_id;
```

## 📊 **성능 최적화**

### **인덱스 확인**

```sql
-- user_id 인덱스가 생성되어 있는지 확인
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('workers', 'schedules', 'clients', 'activities');
```

## 🎯 **테스트 체크리스트**

- [ ] admin 계정으로 로그인 및 기본 기능 테스트
- [ ] 새 계정 생성 및 로그인 테스트
- [ ] 사용자별 데이터 분리 확인
- [ ] RLS 정책 동작 확인
- [ ] 성능 테스트 (대량 데이터)
- [ ] 오류 처리 테스트

## 🚀 **다음 단계**

테스트 완료 후:

1. ✅ 프로덕션 환경 배포
2. ✅ 사용자 교육 자료 준비
3. ✅ 모니터링 및 로그 설정
4. ✅ 백업 및 복구 계획 수립

---

**중요**: 이 테스트는 보안상 매우 중요하므로 모든 단계를 철저히 검증해야 합니다!
