# 반복 스케줄 설계 문서

## 개요

반복 스케줄은 생일, 기념일, 정기 회의 등 주기적으로 반복되는 일정을 관리하는 기능입니다. 업무 스케줄의 경우 근무자 정보까지 반복되는지가 중요한 설계 포인트입니다.

## 현재 구조

### 데이터베이스 스키마

```
schedules (원본 스케줄)
├── is_recurring: 반복 여부
├── recurrence_type: 반복 타입 (daily, weekly, monthly, yearly)
├── recurrence_interval: 반복 간격
├── recurrence_end_type: 종료 조건 (never, date, count)
├── parent_schedule_id: 원본 스케줄 ID (인스턴스인 경우)
└── ...

schedule_workers (스케줄-근무자 관계)
├── schedule_id: 스케줄 ID
├── worker_id: 근무자 ID
├── work_start_date: 근무 시작일
├── work_end_date: 근무 종료일
└── ...

worker_times (근무 시간)
├── schedule_worker_id: schedule_workers ID
├── work_date: 근무 날짜
├── start_time: 시작 시간
└── end_time: 종료 시간
```

## 반복 스케줄 구현 방식

### 방식 1: 템플릿 방식 (권장)

**원리**: 원본 스케줄만 반복 규칙을 가지고, 실제 인스턴스는 필요할 때 동적으로 생성

**장점**:

- 데이터 중복 최소화
- 원본 수정 시 모든 인스턴스에 반영 가능
- 저장 공간 절약

**단점**:

- 쿼리 복잡도 증가
- 개별 인스턴스 수정 시 복잡도 증가

**근무자 정보 처리**:

- 원본 스케줄의 근무자 정보를 참조
- 각 반복 인스턴스에 대해 동일한 근무자 정보 적용
- 근무 시간은 날짜에 맞게 자동 조정

**예시**:

```
원본 스케줄 (매주 월요일 반복)
├── title: "주간 정기 청소"
├── recurrence_type: "weekly"
├── recurrence_days_of_week: [1] (월요일)
└── workers: [김철수, 이영희]

실제 표시 시:
- 2025-01-27 (월): 김철수, 이영희
- 2025-02-03 (월): 김철수, 이영희
- 2025-02-10 (월): 김철수, 이영희
```

### 방식 2: 인스턴스 방식

**원리**: 반복 인스턴스를 미리 모두 생성하고 각각에 근무자 정보 복사

**장점**:

- 쿼리 단순
- 개별 인스턴스 수정 용이

**단점**:

- 데이터 중복
- 원본 수정 시 모든 인스턴스 업데이트 필요
- 저장 공간 증가

**근무자 정보 처리**:

- 각 인스턴스마다 `schedule_workers` 레코드 생성
- 근무 시간은 해당 인스턴스 날짜에 맞게 복사

## 업무 스케줄 반복 범위

### 기본 스케줄 정보 (반복됨)

- ✅ 제목 (title)
- ✅ 설명 (description)
- ✅ 위치 (location, address)
- ✅ 카테고리 (category)
- ✅ 거래처 (client_id)
- ✅ 계약금액 (contract_amount)
- ✅ 메모 (memo)

### 근무자 정보 (반복됨)

- ✅ 근무자 목록 (workers)
- ✅ 근무 시간 (work_start_date, work_end_date)
- ✅ 시급 (hourly_wage)
- ✅ 수당 (fuel_allowance, other_allowance)
- ✅ 급여 계산 옵션 (overtime_enabled, night_shift_enabled, tax_withheld)

### 근무 시간 정보 (날짜에 맞게 조정)

- ✅ 일별 근무 시간 (worker_times)
- ✅ 근무 기간 (work_periods)
- 날짜는 각 반복 인스턴스의 날짜로 자동 조정

### 급여 정보 (반복되지 않음)

- ❌ 급여 지급 여부 (paid, wage_paid)
- ❌ 급여 계산 결과 (payroll_calculations)
- 각 인스턴스마다 독립적으로 관리

### 수급 정보 (반복되지 않음)

- ❌ 수급 상태 (revenue_status)
- ❌ 수급 마감일 (revenue_due_date)
- ❌ 임금 지급 완료 여부 (all_wages_paid)
- 각 인스턴스마다 독립적으로 관리

## 구현 권장사항

### 1. 템플릿 방식 사용 (방식 1)

업무 스케줄의 특성상 근무자 정보가 중요하므로, 템플릿 방식을 권장합니다.

**이유**:

- 매주 같은 근무자들이 반복되는 경우가 많음
- 근무자 변경 시 원본만 수정하면 모든 인스턴스에 반영
- 데이터 일관성 유지 용이

### 2. 근무자 정보 복사 옵션 제공

사용자가 선택할 수 있도록:

- **전체 복사**: 모든 반복 인스턴스에 동일한 근무자 정보 적용
- **개별 설정**: 각 인스턴스마다 근무자 정보를 다르게 설정 가능

### 3. 쿼리 최적화

반복 스케줄을 조회할 때:

```sql
-- 원본 스케줄과 근무자 정보 조회
SELECT s.*, sw.*, w.*
FROM schedules s
LEFT JOIN schedule_workers sw ON sw.schedule_id = s.id
LEFT JOIN workers w ON w.id = sw.worker_id
WHERE s.id = :schedule_id OR s.parent_schedule_id = :schedule_id
```

### 4. 인스턴스 생성 시점

- **Lazy Loading**: 캘린더 표시 시점에 인스턴스 생성
- **Pre-generate**: 특정 범위(예: 1년)까지 미리 생성
- **Hybrid**: 현재 월부터 3개월까지 미리 생성, 그 이후는 필요 시 생성

## 사용 예시

### 시나리오 1: 매주 월요일 정기 청소

```typescript
{
  isRecurring: true,
  recurrenceType: 'weekly',
  recurrenceDaysOfWeek: [1], // 월요일
  recurrenceEndType: 'never',
  title: "주간 정기 청소",
  workers: [
    {
      worker: { id: "worker1", name: "김철수" },
      workStartDate: "2025-01-27", // 첫 반복 날짜
      workEndDate: "2025-01-27",
      periods: [
        { workDate: "2025-01-27", startTime: "09:00", endTime: "18:00" }
      ]
    },
    {
      worker: { id: "worker2", name: "이영희" },
      workStartDate: "2025-01-27",
      workEndDate: "2025-01-27",
      periods: [
        { workDate: "2025-01-27", startTime: "09:00", endTime: "18:00" }
      ]
    }
  ]
}
```

**실제 표시**:

- 2025-01-27 (월): 김철수, 이영희
- 2025-02-03 (월): 김철수, 이영희
- 2025-02-10 (월): 김철수, 이영희
- ...

### 시나리오 2: 매월 15일 급여 지급

```typescript
{
  isRecurring: true,
  recurrenceType: 'monthly',
  recurrenceDayOfMonth: 15,
  recurrenceEndType: 'never',
  title: "월급 지급",
  scheduleType: 'personal',
  workers: [] // 개인 스케줄이므로 근무자 없음
}
```

## 결론

**업무 스케줄이 반복될 때**:

- ✅ **근무자 정보도 함께 반복됩니다**
- ✅ 근무 시간은 각 반복 날짜에 맞게 자동 조정됩니다
- ✅ 급여 지급 여부는 각 인스턴스마다 독립적으로 관리됩니다

이렇게 설계하면 매주 같은 근무자들이 반복되는 정기 작업을 효율적으로 관리할 수 있습니다.
