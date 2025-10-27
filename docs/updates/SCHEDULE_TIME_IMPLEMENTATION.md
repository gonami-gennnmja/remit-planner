# Schedule Time 구현 로직 설명

## 개요

새 일정 추가 시 일별 시간 정보를 저장하는 `schedule_times` 테이블 CRUD 구현

## 데이터베이스 스키마

### `schedule_times` 테이블

```sql
CREATE TABLE schedule_times (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  schedule_id UUID NOT NULL REFERENCES schedules(id),
  work_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 구현된 메서드

### 1. createScheduleTime

**위치**: `database/supabaseRepository.ts:15-37`

**목적**: 일별 시간 정보를 DB에 저장

**로직**:

```typescript
async createScheduleTime(scheduleTime: ScheduleTime): Promise<string> {
  // 1. 현재 로그인한 사용자 확인
  const user = await this.getCurrentUser()

  // 2. Supabase storage에 insert
  const { data, error } = await supabase
    .from('schedule_times')
    .insert([{
      id: scheduleTime.id,              // 시간 ID
      user_id: user.id,                 // 사용자 ID
      schedule_id: scheduleTime.scheduleId,  // 스케줄 ID
      work_date: scheduleTime.workDate,      // 근무 일자
      start_time: scheduleTime.startTime,   // 시작 시간
      end_time: scheduleTime.endTime,       // 종료 시간
      break_duration: scheduleTime.breakDuration || 0, // 휴게 시간
    }])
    .select()

  // 3. 에러 처리
  if (error) {
    console.error('Error creating schedule time:', error)
    throw error
  }

  // 4. 생성된 ID 반환
  return data[0].id
}
```

**사용 예시**:

```typescript
// 한 일정이 여러 날에 걸칠 때
// 2024-01-01 09:00~18:00
await db.createScheduleTime({
  id: "time-001",
  scheduleId: "schedule-001",
  workDate: "2024-01-01",
  startTime: "09:00",
  endTime: "18:00",
  breakDuration: 0,
});

// 2024-01-02 09:00~18:00
await db.createScheduleTime({
  id: "time-002",
  scheduleId: "schedule-001",
  workDate: "2024-01-02",
  startTime: "09:00",
  endTime: "18:00",
  breakDuration: 0,
});
```

### 2. getScheduleTimes

**위치**: `database/supabaseRepository.ts:39-61`

**목적**: 특정 스케줄의 모든 일별 시간 정보 조회

**로직**:

```typescript
async getScheduleTimes(scheduleId: string): Promise<ScheduleTime[]> {
  // 1. 현재 로그인한 사용자 확인
  const user = await this.getCurrentUser()

  // 2. 스케줄 ID와 사용자 ID로 필터링
  const { data, error } = await supabase
    .from('schedule_times')
    .select('*')
    .eq('schedule_id', scheduleId)
    .eq('user_id', user.id)

  // 3. 에러 처리
  if (error) {
    console.error('Error getting schedule times:', error)
    throw error
  }

  // 4. DB 컬럼명을 TypeScript 필드명으로 매핑
  return data.map((row: any) => ({
    id: row.id,
    scheduleId: row.schedule_id,
    workDate: row.work_date,
    startTime: row.start_time,
    endTime: row.end_time,
    breakDuration: row.break_duration || 0,
  }))
}
```

**반환 데이터**:

```typescript
[
  {
    id: "time-001",
    scheduleId: "schedule-001",
    workDate: "2024-01-01",
    startTime: "09:00",
    endTime: "18:00",
    breakDuration: 0,
  },
  {
    id: "time-002",
    scheduleId: "schedule-001",
    workDate: "2024-01-02",
    startTime: "09:00",
    endTime: "18:00",
    breakDuration: 0,
  },
];
```

### 3. updateScheduleTime

**위치**: `database/supabaseRepository.ts:63-82`

**목적**: 일별 시간 정보 수정

**로직**:

```typescript
async updateScheduleTime(id: string, scheduleTime: Partial<ScheduleTime>): Promise<void> {
  // 1. 현재 로그인한 사용자 확인
  const user = await this.getCurrentUser()

  // 2. 변경된 필드만 update 객체에 추가
  const updateData: any = {}
  if (scheduleTime.workDate !== undefined) updateData.work_date = scheduleTime.workDate
  if (scheduleTime.startTime !== undefined) updateData.start_time = scheduleTime.startTime
  if (scheduleTime.endTime !== undefined) updateData.end_time = scheduleTime.endTime
  if (scheduleTime.breakDuration !== undefined) updateData.break_duration = scheduleTime.breakDuration

  // 3. Supabase에서 update
  const { error } = await supabase
    .from('schedule_times')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)

  // 4. 에러 처리
  if (error) {
    console.error('Error updating schedule time:', error)
    throw error
  }
}
```

**사용 예시**:

```typescript
// 종료 시간만 변경
await db.updateScheduleTime("time-001", {
  endTime: "19:00",
});

// 근무 일자와 시간 모두 변경
await db.updateScheduleTime("time-001", {
  workDate: "2024-01-03",
  startTime: "10:00",
  endTime: "19:00",
});
```

### 4. deleteScheduleTime

**위치**: `database/supabaseRepository.ts:84-97`

**목적**: 일별 시간 정보 삭제

**로직**:

```typescript
async deleteScheduleTime(id: string): Promise<void> {
  // 1. 현재 로그인한 사용자 확인
  const user = await this.getCurrentUser()

  // 2. Supabase에서 삭제 (사용자 ID도 함께 확인하여 보안 강화)
  const { error } = await supabase
    .from('schedule_times')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  // 3. 에러 처리
  if (error) {
    console.error('Error deleting schedule time:', error)
    throw error
  }
}
```

## 실제 사용 흐름

### 새 일정 추가 시 (`components/ScheduleAddModal.tsx`)

1. **UI에서 시간 입력**

   - 시작일/종료일 선택
   - 각 날짜별 시작/종료 시간 입력

2. **스케줄 저장 시 로직**:

```typescript
// ScheduleAddModal.tsx의 handleSave
const handleSave = async () => {
  // 1. 스케줄 생성
  const scheduleId = await db.createSchedule({
    id: generateUUID(),
    ...formData,
  });

  // 2. 일별 시간 정보 생성
  const scheduleTimes = generateScheduleTimes(formData);

  // 3. 각 일별 시간 정보를 DB에 저장
  for (const time of scheduleTimes) {
    await db.createScheduleTime({
      id: generateUUID(),
      scheduleId: scheduleId,
      workDate: time.workDate,
      startTime: time.startTime,
      endTime: time.endTime,
      breakDuration: 0,
    });
  }
};
```

3. **특수 케이스 처리**:
   - **하루 종일**: `startTime: '00:00'`, `endTime: '23:59'`
   - **밤샘 일정**:
     - 첫째 날: `startTime: '22:00'`, `endTime: '23:59'`
     - 둘째 날: `startTime: '00:00'`, `endTime: '01:00'`
   - **매일 시간 동일**: 모든 날짜에 동일한 시간 저장

## 데이터 예시

### 예시 1: 3일 일정 (매일 시간 동일)

```
schedules 테이블:
- id: 'schedule-001'
- start_date: '2024-01-01'
- end_date: '2024-01-03'
- uniform_time: true

schedule_times 테이블:
- id: 'time-001', work_date: '2024-01-01', start_time: '09:00', end_time: '18:00'
- id: 'time-002', work_date: '2024-01-02', start_time: '09:00', end_time: '18:00'
- id: 'time-003', work_date: '2024-01-03', start_time: '09:00', end_time: '18:00'
```

### 예시 2: 밤샘 일정 (23:00 ~ 01:00)

```
schedules 테이블:
- id: 'schedule-002'
- start_date: '2024-01-01'
- end_date: '2024-01-02'
- uniform_time: false

schedule_times 테이블:
- id: 'time-004', work_date: '2024-01-01', start_time: '23:00', end_time: '23:59'
- id: 'time-005', work_date: '2024-01-02', start_time: '00:00', end_time: '01:00'
```

## 주요 개선 사항

1. **종료 시간이 24시를 넘는 경우 자동 처리**

   - 날짜를 다음 날로 자동 변경
   - 시간은 그대로 유지 (예: 01:00)
   - `DatePicker`의 `value`에서 `2000-01-02` 형식 사용

2. **빈 시간 값 처리**

   - 종료 시간이 없으면 기본값 `18:00` 사용
   - DB 저장 시 안전하게 처리

3. **RLS (Row Level Security)**
   - 모든 메서드에서 `user_id` 확인
   - 사용자는 자신의 데이터만 접근 가능

## 관련 파일

- `database/supabaseRepository.ts`: ScheduleTime CRUD 구현
- `components/ScheduleAddModal.tsx`: UI 및 저장 로직
- `components/DatePicker.tsx`: 날짜/시간 선택 UI
- `models/types.ts`: `ScheduleTime` 타입 정의
