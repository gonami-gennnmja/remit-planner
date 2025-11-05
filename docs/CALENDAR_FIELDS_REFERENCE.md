# expo-calendar 지원 필드 전체 목록

## createEventAsync()에서 사용 가능한 모든 필드

expo-calendar의 `createEventAsync()` 함수에서 사용할 수 있는 모든 필드 목록입니다.

## 공통 필드 (iOS & Android 모두 지원)

### 기본 필드

| 필드명      | 타입     | 설명                      | 필수 여부 |
| ----------- | -------- | ------------------------- | --------- |
| `title`     | `string` | 이벤트 제목               | ✅ 필수   |
| `startDate` | `Date`   | 시작 날짜/시간            | ✅ 필수   |
| `endDate`   | `Date`   | 종료 날짜/시간            | ✅ 필수   |
| `notes`     | `string` | 이벤트 메모/설명          | ❌ 선택   |
| `location`  | `string` | 위치 정보                 | ❌ 선택   |
| `timeZone`  | `string` | 시간대 (예: 'Asia/Seoul') | ❌ 선택   |

### 알림 (Alarms)

| 필드명                    | 타입          | 설명                                                          |
| ------------------------- | ------------- | ------------------------------------------------------------- |
| `alarms`                  | `Alarm[]`     | 알림 배열                                                     |
| `alarms[].relativeOffset` | `number`      | 이벤트 시작 시간으로부터의 상대적 오프셋 (분 단위, 음수 가능) |
| `alarms[].absoluteDate`   | `Date`        | 절대 알림 시간 (relativeOffset 대신 사용)                     |
| `alarms[].method`         | `AlarmMethod` | 알림 방법: `ALERT`, `EMAIL`, `SMS`                            |

### 반복 규칙 (Recurrence)

| 필드명                           | 타입                  | 설명                                              |
| -------------------------------- | --------------------- | ------------------------------------------------- |
| `recurrenceRule`                 | `RecurrenceRule`      | 반복 규칙 객체                                    |
| `recurrenceRule.frequency`       | `RecurrenceFrequency` | 반복 주기: `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY` |
| `recurrenceRule.interval`        | `number`              | 반복 간격 (예: 2주마다 = 2)                       |
| `recurrenceRule.endDate`         | `Date`                | 반복 종료 날짜                                    |
| `recurrenceRule.occurrenceCount` | `number`              | 반복 횟수                                         |
| `recurrenceRule.daysOfTheWeek`   | `DaysOfWeek[]`        | 주중 반복 요일 (WEEKLY/MONTHLY용)                 |
| `recurrenceRule.daysOfTheMonth`  | `number[]`            | 월 중 반복 날짜 (MONTHLY용)                       |
| `recurrenceRule.monthsOfTheYear` | `number[]`            | 연중 반복 월 (YEARLY용)                           |
| `recurrenceRule.weeksOfTheYear`  | `number[]`            | 연중 반복 주 (YEARLY용)                           |
| `recurrenceRule.daysOfTheYear`   | `number[]`            | 연중 반복 날짜 (YEARLY용)                         |
| `recurrenceRule.setPositions`    | `number[]`            | 위치 지정 (예: 매월 첫째 주)                      |

### 참석자 (Attendees)

| 필드명               | 타입             | 설명                                                                                                    |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------------------- |
| `attendees`          | `Attendee[]`     | 참석자 배열                                                                                             |
| `attendees[].name`   | `string`         | 참석자 이름                                                                                             |
| `attendees[].email`  | `string`         | 참석자 이메일                                                                                           |
| `attendees[].role`   | `AttendeeRole`   | 역할: `UNKNOWN`, `REQUIRED`, `OPTIONAL`, `CHAIR`, `NON_PARTICIPANT`                                     |
| `attendees[].status` | `AttendeeStatus` | 상태: `UNKNOWN`, `PENDING`, `ACCEPTED`, `DECLINED`, `TENTATIVE`, `DELEGATED`, `COMPLETED`, `IN_PROCESS` |
| `attendees[].type`   | `AttendeeType`   | 타입: `UNKNOWN`, `PERSON`, `ROOM`, `GROUP`, `RESOURCE`                                                  |
| `attendees[].url`    | `string`         | 참석자 URL (일부 플랫폼)                                                                                |

## iOS 전용 필드

| 필드명            | 타입           | 설명                                                                |
| ----------------- | -------------- | ------------------------------------------------------------------- |
| `url`             | `string`       | 이벤트와 연결된 URL                                                 |
| `allDay`          | `boolean`      | 종일 이벤트 여부                                                    |
| `availability`    | `Availability` | 가용성: `NOT_SUPPORTED`, `BUSY`, `FREE`, `TENTATIVE`, `UNAVAILABLE` |
| `organizer`       | `Person`       | 주최자 정보                                                         |
| `organizer.name`  | `string`       | 주최자 이름                                                         |
| `organizer.email` | `string`       | 주최자 이메일                                                       |
| `organizer.phone` | `string`       | 주최자 전화번호                                                     |
| `organizer.url`   | `string`       | 주최자 URL                                                          |

## Android 전용 필드

| 필드명                  | 타입           | 설명                                                                  |
| ----------------------- | -------------- | --------------------------------------------------------------------- |
| `allDay`                | `boolean`      | 종일 이벤트 여부                                                      |
| `accessLevel`           | `AccessLevel`  | 접근 수준: `CONFIDENTIAL`, `PRIVATE`, `PUBLIC`, `DEFAULT`             |
| `availability`          | `Availability` | 가용성: `BUSY`, `FREE`, `TENTATIVE`                                   |
| `guestsCanModify`       | `boolean`      | 참석자가 수정 가능 여부                                               |
| `guestsCanInviteOthers` | `boolean`      | 참석자가 다른 사람 초대 가능 여부                                     |
| `guestsCanSeeGuests`    | `boolean`      | 참석자가 다른 참석자 목록 볼 수 있는지                                |
| `organizerEmail`        | `string`       | 주최자 이메일                                                         |
| `originalId`            | `string`       | 원본 이벤트 ID (반복 이벤트용)                                        |
| `calendarId`            | `string`       | 캘린더 ID (이미 함수 파라미터로 전달되지만 이벤트 객체에도 포함 가능) |

## 사용 예시

### 기본 이벤트

```typescript
await Calendar.createEventAsync(calendarId, {
  title: "회의",
  startDate: new Date("2025-01-15T10:00:00"),
  endDate: new Date("2025-01-15T11:00:00"),
  notes: "프로젝트 회의",
  location: "서울시 강남구",
  timeZone: "Asia/Seoul",
});
```

### 알림 포함

```typescript
await Calendar.createEventAsync(calendarId, {
  title: "회의",
  startDate: new Date("2025-01-15T10:00:00"),
  endDate: new Date("2025-01-15T11:00:00"),
  alarms: [
    {
      relativeOffset: -30, // 30분 전
      method: Calendar.AlarmMethod.ALERT,
    },
    {
      relativeOffset: -1440, // 하루 전
      method: Calendar.AlarmMethod.EMAIL,
    },
  ],
});
```

### 반복 이벤트

```typescript
await Calendar.createEventAsync(calendarId, {
  title: "주간 회의",
  startDate: new Date("2025-01-15T10:00:00"),
  endDate: new Date("2025-01-15T11:00:00"),
  recurrenceRule: {
    frequency: Calendar.RecurrenceFrequency.WEEKLY,
    interval: 1,
    daysOfTheWeek: [
      { dayOfWeek: Calendar.DayOfWeek.MONDAY },
      { dayOfWeek: Calendar.DayOfWeek.WEDNESDAY },
    ],
    endDate: new Date("2025-12-31"),
  },
});
```

### 참석자 포함

```typescript
await Calendar.createEventAsync(calendarId, {
  title: "회의",
  startDate: new Date("2025-01-15T10:00:00"),
  endDate: new Date("2025-01-15T11:00:00"),
  attendees: [
    {
      name: "홍길동",
      email: "hong@example.com",
      role: Calendar.AttendeeRole.REQUIRED,
      status: Calendar.AttendeeStatus.PENDING,
    },
    {
      name: "김철수",
      email: "kim@example.com",
      role: Calendar.AttendeeRole.OPTIONAL,
      status: Calendar.AttendeeStatus.ACCEPTED,
    },
  ],
});
```

### iOS 전용 필드

```typescript
await Calendar.createEventAsync(calendarId, {
  title: "회의",
  startDate: new Date("2025-01-15T10:00:00"),
  endDate: new Date("2025-01-15T11:00:00"),
  url: "https://meet.google.com/xxx",
  allDay: false,
  availability: Calendar.Availability.BUSY,
  organizer: {
    name: "주최자 이름",
    email: "organizer@example.com",
  },
});
```

### Android 전용 필드

```typescript
await Calendar.createEventAsync(calendarId, {
  title: "회의",
  startDate: new Date("2025-01-15T10:00:00"),
  endDate: new Date("2025-01-15T11:00:00"),
  allDay: false,
  accessLevel: Calendar.AccessLevel.PRIVATE,
  availability: Calendar.Availability.BUSY,
  guestsCanModify: false,
  guestsCanInviteOthers: false,
  guestsCanSeeGuests: true,
  organizerEmail: "organizer@example.com",
});
```

## 주의사항

1. **플랫폼별 지원**: 일부 필드는 iOS 또는 Android에서만 지원됩니다. 플랫폼별로 다른 동작을 할 수 있습니다.

2. **allDay 필드**: iOS와 Android 모두 지원하지만, 종일 이벤트인 경우 `startDate`와 `endDate`는 시간 부분을 무시하고 날짜만 사용됩니다.

3. **시간대**: `timeZone`을 지정하지 않으면 기기의 기본 시간대를 사용합니다.

4. **알림**: iOS와 Android에서 알림 지원 방식이 다를 수 있습니다.

5. **참석자**: 참석자 추가는 대부분의 캘린더 앱에서 지원하지만, 일부 캘린더는 제한적으로 지원할 수 있습니다.

## 참고 자료

- [Expo Calendar 공식 문서](https://docs.expo.dev/versions/latest/sdk/calendar/)
- [iOS EventKit 문서](https://developer.apple.com/documentation/eventkit)
- [Android Calendar Provider 문서](https://developer.android.com/guide/topics/providers/calendar-provider)

