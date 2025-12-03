# 하드코딩된 값 정리 요약

## ✅ 수정 완료 항목

### 1. 사용자 ID 하드코딩 ✅

**파일**: `app/clients/index.tsx` (라인 94)

- **수정 전**: `userId: "current-user"`
- **수정 후**: `userId: user.id` (getCurrentSupabaseUser() 사용)
- **상태**: 완료

### 2. 매출 하드코딩 ✅

다음 파일들에서 `500000` 또는 `REVENUE_PER_SCHEDULE = 500000` 제거 완료:

- **`app/dashboard.tsx`** (라인 402, 470) ✅

  - `revenue += schedule.contractAmount || 0` 사용
  - 업무 스케줄만 계산하도록 필터 추가 (`scheduleType === 'business'`)

- **`app/reports/clients.tsx`** (라인 143) ✅

  - `schedule.contractAmount || 0` 사용
  - `revenueStatus` 기반으로 수납 상태 확인
  - 업무 스케줄만 계산하도록 필터 추가

- **`app/reports/performance.tsx`** (라인 216) ✅

  - `schedule.contractAmount || 0` 사용
  - 업무 스케줄만 계산하도록 필터 추가

- **`app/reports/worker-efficiency.tsx`** (라인 153) ✅
  - `schedule.contractAmount || 0` 사용
  - workerMap에 revenue 필드 추가하여 효율성 계산 개선
  - `efficiencyScore = revenue / hours` 계산 방식으로 변경

## ✅ 정상적인 하드코딩 (기본값)

### 1. 기본 시급

- **`components/WorkersScreen.tsx`**: `hourlyWage: "15000"` - 기본값으로 정상
- **`database/schema.ts`**: `hourly_wage INTEGER DEFAULT 15000` - DB 기본값으로 정상

### 2. 기본 근무시간

- **`components/WorkersScreen.tsx`**:
  - `defaultStartTime: "09:00"`
  - `defaultEndTime: "18:00"`
  - 기본값으로 정상

### 3. Supabase 설정

- **`lib/supabase.ts`**: `'YOUR_SUPABASE_URL'`, `'YOUR_SUPABASE_ANON_KEY'`
  - 환경변수로 대체되므로 플레이스홀더로 정상

## 📝 수정 완료 요약

모든 하드코딩된 값이 수정되었습니다:

- ✅ 사용자 ID: 실제 사용자 ID 사용
- ✅ 매출 계산: `contractAmount` 기반으로 변경
- ✅ 업무 스케줄 필터링: `scheduleType === 'business'` 조건 추가
