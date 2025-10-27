# 성능 문제 분석

## 🔍 현재 문제

### 로그인 후 메인 화면 로딩

**현재 구조:**

1. **초기 로딩** (useEffect)

   - 데이터베이스 초기화
   - 사용자 정보 로드
   - 전체 스케줄 로드 (`getAllSchedules()`)
   - 최근 활동 20개 로드

2. **화면 포커스** (useFocusEffect)

   - 전체 스케줄 다시 로드
   - 최근 활동 다시 로드
   - 사용자 정보 다시 로드

3. **오늘 일정 표시**
   - 모든 스케줄을 클라이언트에서 필터링
   - 데이터가 많을수록 느림

### 문제점

```typescript
// MainScreen.tsx:407-416
const loadSchedules = async () => {
  try {
    const db = getDatabase();
    const allSchedules = await db.getAllSchedules(); // ⚠️ 모든 스케줄 로드
    setSchedules(allSchedules);
  } catch (error) {
    console.error("Failed to load schedules:", error);
    setSchedules([]);
  }
};

// MainScreen.tsx:632-641
const getTodaySchedules = () => {
  return schedules.filter((schedule) => {
    // ⚠️ 클라이언트 필터링
    const scheduleStart = dayjs(schedule.startDate);
    const scheduleEnd = dayjs(schedule.endDate);
    const today = dayjs(selectedDate);
    return (
      today.isSameOrAfter(scheduleStart) && today.isSameOrBefore(scheduleEnd)
    );
  });
};
```

**성능 문제:**

- 모든 스케줄을 DB에서 가져옴
- 클라이언트에서 필터링 (비효율적)
- 데이터가 많을수록 느려짐
- 불필요한 데이터 전송

## 💡 해결 방안

### 1. DB 쿼리 최적화

DB에 "오늘 일정만 가져오기" 쿼리 추가:

```typescript
// database/interface.ts에 추가
async getTodaySchedules(date?: string): Promise<Schedule[]>;
```

```sql
-- Supabase
SELECT * FROM schedules
WHERE start_date <= '2024-01-01'
  AND end_date >= '2024-01-01';
```

### 2. 인덱스 추가

데이터베이스 인덱스 추가로 쿼리 성능 향상:

```sql
-- startDate, endDate에 인덱스 추가
CREATE INDEX idx_schedules_date ON schedules(start_date, end_date);
```

### 3. 페이지네이션 적용

전체 데이터가 아닌 필요한 만큼만 로드:

```typescript
async getSchedules(limit?: number, offset?: number): Promise<Schedule[]>;
```

### 4. 캐싱 전략

- 로컬 캐시 활용
- 필요할 때만 새로고침

### 5. 지연 로딩

- 중요 데이터 먼저 로드
- 나머지는 백그라운드에서 로드

## 📊 예상 성능 개선

**현재:**

- 전체 스케줄 로드: ~500ms (100개 기준)
- 클라이언트 필터링: ~50ms
- 총 로딩 시간: ~550ms

**개선 후:**

- 오늘 일정만 로드: ~100ms (5개 기준)
- 클라이언트 처리: ~10ms
- 총 로딩 시간: ~110ms

**예상 성능 향상: 5배 이상**

## 🎯 우선순위

1. **높음**: DB 쿼리 최적화 (오늘 일정만 가져오기)
2. **중간**: 인덱스 추가
3. **낮음**: 페이지네이션/캐싱

## 📝 구현 방법

### 1단계: DB 인터페이스 확장

```typescript
// database/interface.ts
export interface Database {
  // ... 기존 코드

  // 오늘 일정만 가져오기
  getTodaySchedules(date: string): Promise<Schedule[]>;
}
```

### 2단계: Supabase Repository 구현

```typescript
// database/supabaseRepository.ts
async getTodaySchedules(date: string): Promise<Schedule[]> {
  const startDate = format(new Date(date), 'yyyy-MM-dd');
  const endDate = startDate;

  const { data, error } = await this.supabase
    .from('schedules')
    .select('*, workers(*), clients(*)')
    .lte('start_date', endDate)
    .gte('end_date', startDate)
    .eq('user_id', this.userId);

  if (error) throw error;
  return data || [];
}
```

### 3단계: MainScreen 수정

```typescript
const loadTodaySchedules = async () => {
  try {
    const db = getDatabase();
    const today = dayjs().format("YYYY-MM-DD");
    const todaySchedules = await db.getTodaySchedules(today);
    setSchedules(todaySchedules);
  } catch (error) {
    console.error("Failed to load today's schedules:", error);
    setSchedules([]);
  }
};
```

## 🧪 테스트 방법

1. **성능 측정**

   - 로딩 시간 측정
   - 네트워크 트래픽 확인

2. **부하 테스트**

   - 다양한 데이터량으로 테스트
   - 수십~수천 개의 스케줄로 테스트

3. **사용자 경험 테스트**
   - 체감 속도 확인
   - 로딩 스피너 추가

## 📌 참고사항

- 현재 모든 스케줄을 로드하는 이유: 다른 화면에서도 사용
- 최적화 시 다른 화면도 영향받을 수 있음
- 점진적 개선 권장
