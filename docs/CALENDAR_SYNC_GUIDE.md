# 네이티브 달력 연동 가이드

## 개요

이 앱은 iOS의 **Apple Calendar**와 Android의 **Google Calendar**와 연동하여 스케줄을 네이티브 달력 앱에 추가할 수 있습니다.

## 중요 사항

⚠️ **Expo Go에서는 테스트할 수 없습니다!**

`expo-calendar`는 네이티브 기능을 사용하므로:

- **Expo Go**: ❌ 사용 불가
- **개발 빌드 (Expo Dev Client)**: ✅ 사용 가능
- **프로덕션 빌드**: ✅ 사용 가능

## 설정 완료 사항

✅ `expo-calendar` 패키지 설치 완료
✅ `app.json`에 권한 설정 추가 완료
✅ 네이티브 달력 연동 유틸리티 함수 작성 완료

## 사용 방법

### 1. 기본 사용법

```typescript
import { syncScheduleToCalendar } from "@/utils/calendarSync";
import { Schedule } from "@/models/types";

// 스케줄을 캘린더에 추가
const schedule: Schedule = {
  id: "schedule-1",
  title: "공사 일정",
  startDate: "2025-01-15",
  endDate: "2025-01-20",
  // ... 기타 필드
};

const result = await syncScheduleToCalendar(schedule);

if (result.success) {
  console.log(result.message); // "캘린더에 1개의 이벤트가 추가되었습니다."
} else {
  console.error(result.message);
}
```

### 2. 특정 캘린더 선택

```typescript
import {
  getAvailableCalendars,
  syncScheduleToCalendar,
} from "@/utils/calendarSync";

// 사용 가능한 캘린더 목록 가져오기
const calendars = await getAvailableCalendars();

// 특정 캘린더에 추가
const result = await syncScheduleToCalendar(schedule, {
  calendarId: calendars[0].id, // 첫 번째 캘린더 사용
});
```

### 3. 고급 사용법

```typescript
import {
  requestCalendarPermissions,
  getDefaultCalendar,
  addScheduleToCalendar,
} from "@/utils/calendarSync";

// 1. 권한 확인
const hasPermission = await requestCalendarPermissions();

if (hasPermission) {
  // 2. 기본 캘린더 가져오기
  const calendar = await getDefaultCalendar();

  if (calendar) {
    // 3. 스케줄 추가
    const result = await addScheduleToCalendar(schedule, {
      calendarId: calendar.id,
    });

    if (result.success && result.eventIds) {
      console.log("생성된 이벤트 ID:", result.eventIds);

      // 나중에 이벤트 삭제할 때 사용
      // await removeEventsFromCalendar(result.eventIds);
    }
  }
}
```

## 컴포넌트에 통합하기

### PlannerCalendar 컴포넌트에 추가 예시

```typescript
import { syncScheduleToCalendar } from "@/utils/calendarSync";
import { Alert } from "react-native";

// 스케줄 상세 모달에서 캘린더 연동 버튼 추가
const handleSyncToCalendar = async (schedule: Schedule) => {
  const result = await syncScheduleToCalendar(schedule);

  if (result.success) {
    Alert.alert("성공", result.message);
  } else {
    Alert.alert("실패", result.message);
  }
};
```

### ScheduleAddModal에 자동 연동 추가

스케줄 생성 시 자동으로 캘린더에 추가하는 옵션:

```typescript
const [autoSyncToCalendar, setAutoSyncToCalendar] = useState(false);

const handleSaveSchedule = async (scheduleData: Schedule) => {
  // 스케줄 저장
  const savedSchedule = await db.saveSchedule(scheduleData);

  // 자동 연동 옵션이 켜져 있으면
  if (autoSyncToCalendar) {
    await syncScheduleToCalendar(savedSchedule);
  }
};
```

## 이벤트 정보

캘린더에 추가되는 이벤트는 **하나의 스케줄당 하나의 이벤트**로 생성됩니다. 근로자는 이름 목록으로 메모(notes)에 포함됩니다.

### iOS (Apple Calendar) 필드 매핑

| expo-calendar 필드 | iOS EventKit 필드 | 설명                      |
| ------------------ | ----------------- | ------------------------- |
| `title`            | `title`           | 이벤트 제목 (스케줄 제목) |
| `startDate`        | `startDate`       | 시작 날짜/시간            |
| `endDate`          | `endDate`         | 종료 날짜/시간            |
| `notes`            | `notes`           | 이벤트 메모/설명          |
| `location`         | `location`        | 위치 정보 (주소)          |
| `timeZone`         | `timeZone`        | 시간대                    |
| `alarms`           | `alarms`          | 알림 설정                 |

**iOS에서 보이는 내용:**

- 제목: 스케줄 제목
- 날짜/시간: 스케줄 시작일/종료일 (근무 시간이 있으면 포함)
- 위치: 주소 또는 위치 정보
- 메모 (Notes):

  ```
  [스케줄 설명]

  근로자: 홍길동, 김철수, 이영희

  일정: 2025년 01월 15일 ~ 2025년 01월 20일
  근무시간: 09:00 ~ 18:00

  메모: [메모 내용]
  ```

- 알림: 이벤트 30분 전

### Android (Google Calendar) 필드 매핑

| expo-calendar 필드 | Android CalendarContract 필드 | 설명                      |
| ------------------ | ----------------------------- | ------------------------- |
| `title`            | `TITLE`                       | 이벤트 제목 (스케줄 제목) |
| `startDate`        | `DTSTART`                     | 시작 날짜/시간 (밀리초)   |
| `endDate`          | `DTEND`                       | 종료 날짜/시간 (밀리초)   |
| `notes`            | `DESCRIPTION`                 | 이벤트 설명               |
| `location`         | `EVENT_LOCATION`              | 위치 정보                 |
| `timeZone`         | `TIMEZONE`                    | 시간대                    |
| `alarms`           | `ALARMS`                      | 알림 설정                 |

**Android에서 보이는 내용:**

- 제목: 스케줄 제목
- 날짜/시간: 스케줄 시작일/종료일 (근무 시간이 있으면 포함)
- 위치: 주소 또는 위치 정보
- 설명 (Description):

  ```
  [스케줄 설명]

  근로자: 홍길동, 김철수, 이영희

  일정: 2025년 01월 15일 ~ 2025년 01월 20일
  근무시간: 09:00 ~ 18:00

  메모: [메모 내용]
  ```

- 알림: 이벤트 30분 전

### 주요 특징

✅ **하나의 스케줄 = 하나의 이벤트**: 근로자별로 개별 이벤트를 생성하지 않고, 전체 스케줄을 하나의 이벤트로 관리합니다.

✅ **근로자 정보는 메모에 포함**: 근로자 이름은 목록 형태로 메모(notes/description) 필드에만 포함됩니다.

✅ **날짜/시간 계산**:

- 근무 시간 정보가 있으면: 첫 번째 근로자의 첫 근무일 시간을 시작 시간으로 사용
- 근무 시간 정보가 없으면: 기본값 09:00 ~ 18:00 사용

## 권한 관리

### iOS (Info.plist)

다음 권한 설명이 자동으로 추가됩니다:

- `NSCalendarsUsageDescription`: "일정을 기기의 캘린더 앱에 추가하기 위해 접근 권한이 필요합니다."
- `NSRemindersUsageDescription`: "일정을 리마인더에 추가하기 위해 접근 권한이 필요합니다."

### Android (AndroidManifest.xml)

다음 권한이 자동으로 추가됩니다:

- `android.permission.READ_CALENDAR`
- `android.permission.WRITE_CALENDAR`

## 테스트 방법

### 1. 개발 빌드 생성

```bash
# Android 개발 빌드
eas build --platform android --profile development

# iOS 개발 빌드
eas build --platform ios --profile development
```

### 2. 개발 빌드 설치 후 실행

```bash
expo start --dev-client
```

### 3. 테스트 시나리오

1. **권한 요청 테스트**

   - 앱에서 캘린더 연동 버튼 클릭
   - 권한 요청 다이얼로그 확인
   - 권한 허용/거부 테스트

2. **이벤트 생성 테스트**

   - 스케줄 생성 후 캘린더 연동
   - 네이티브 캘린더 앱에서 이벤트 확인
   - 이벤트 정보 정확성 확인

3. **이벤트 내용 확인**
   - 여러 근로자가 있는 스케줄 생성
   - 캘린더에 하나의 이벤트만 생성되는지 확인
   - 근로자 이름 목록이 메모에 포함되는지 확인

## 주의사항

1. **Expo Go 미지원**: 개발 빌드 또는 프로덕션 빌드에서만 동작합니다.

2. **권한 필요**: 사용자가 달력 접근 권한을 허용해야 합니다.

3. **캘린더 동기화**: 네이티브 캘린더 앱의 동기화 설정에 따라 이벤트가 다른 기기로 동기화될 수 있습니다.

4. **이벤트 삭제**: 앱에서 이벤트를 삭제하려면 이벤트 ID를 저장해두어야 합니다.

5. **시간대**: 기본적으로 'Asia/Seoul' 시간대를 사용합니다. 필요시 수정 가능합니다.

## 문제 해결

### 권한이 거부됨

- 설정 앱에서 수동으로 권한을 허용하도록 안내
- `requestCalendarPermissionWithAlert()` 함수를 사용하여 사용자에게 권한 요청

### 캘린더를 찾을 수 없음

- 기기에 캘린더 앱이 설치되어 있고 계정이 설정되어 있는지 확인
- `getAvailableCalendars()` 함수로 사용 가능한 캘린더 확인

### 이벤트가 생성되지 않음

- 권한이 올바르게 설정되었는지 확인
- 캘린더가 수정 가능한 상태인지 확인 (`allowsModifications` 속성)
- 에러 로그 확인

## 참고 자료

- [Expo Calendar 문서](https://docs.expo.dev/versions/latest/sdk/calendar/)
- [iOS EventKit](https://developer.apple.com/documentation/eventkit)
- [Android Calendar Provider](https://developer.android.com/guide/topics/providers/calendar-provider)
