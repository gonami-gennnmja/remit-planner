# Remit Planner 프로젝트 구조

## 📁 전체 디렉토리 구조

```
remit-planner/
├── app/                    # 앱 화면 (Expo Router 기반)
├── components/            # 재사용 가능한 컴포넌트
├── contexts/              # React 컨텍스트 (테마, 로컬라이제이션)
├── database/              # 데이터베이스 관련 파일
├── models/                # 데이터 모델 및 타입
├── utils/                 # 유틸리티 함수들
├── store/                 # 상태 관리
├── constants/             # 상수 정의
├── hooks/                 # 커스텀 훅
├── assets/                # 이미지, 폰트 등 리소스
└── supabase/              # Supabase 설정
```

---

## 📱 app/ 디렉토리 구조

### 인증 및 설정

- `index.tsx` - 로그인 화면
- `signup.tsx` - 회원가입 화면
- `forgot-password.tsx` - 비밀번호 찾기
- `reset-password.tsx` - 비밀번호 재설정
- `privacy-policy.tsx` - 개인정보 처리방침
- `terms-of-service.tsx` - 이용약관

### 메인 화면

- `main.tsx` - 메인 대시보드
- `dashboard.tsx` - 상세 대시보드
- `settings.tsx` - 설정 화면

### 스케줄 관리

- `schedule.tsx` - 스케줄 목록/캘린더
- `schedule-list.tsx` - 스케줄 리스트
- `schedule/[id].tsx` - 스케줄 상세 화면
- `schedule-reports.tsx` - 스케줄 리포트

### 거래처 관리

- `clients.tsx` - 거래처 목록
- `client/[id].tsx` - 거래처 상세

### 근로자 관리

- `workers.tsx` - 근로자 목록
- `worker-reports.tsx` - 근로자 리포트

### 급여 관리

- `payroll.tsx` - 급여 관리 화면

### 리포트

- `reports.tsx` - 통합 리포트
- `revenue-reports.tsx` - 수익 리포트
- `performance-analysis.tsx` - 성과 분석

### 미수금 관리

- `uncollected.tsx` - 미수금 목록
- `unpaid-details.tsx` - 미수금 상세

### 파일 관리

- `files.tsx` - 파일 관리 화면

### 기타

- `modal.tsx` - 모달 화면
- `_layout.tsx` - 라우트 레이아웃 설정
- `(tabs)/` - 탭 네비게이션
  - `(tabs)/index.tsx` - 캘린더 탭
  - `(tabs)/two.tsx` - 두 번째 탭

---

## 🧩 components/ 디렉토리 구조

### 화면 컴포넌트

- `LoginScreen.tsx` - 로그인 화면
- `MainScreen.tsx` - 메인 화면
- `WorkersScreen.tsx` - 근로자 관리 화면
- `CommonHeader.tsx` - 공통 헤더
- `HamburgerMenu.tsx` - 햄버거 메뉴

### 모달 컴포넌트

- `FormModal.tsx` - 폼 모달
- `SearchModal.tsx` - 검색 모달
- `ScheduleAddModal.tsx` - 스케줄 추가 모달
- `MonthlyPayrollModal.tsx` - 월별 급여 모달
- `TodayScheduleModal.tsx` - 오늘의 스케줄 모달
- `UnpaidScheduleModal.tsx` - 미수금 스케줄 모달
- `StaffWorkStatusModal.tsx` - 직원 근무 상태 모달

### UI 컴포넌트

- `LoadingSpinner.tsx` - 로딩 스피너
- `PeriodSelector.tsx` - 기간 선택기
- `PlannerCalendar.tsx` - 캘린더 플래너
- `DatePicker.tsx` - 날짜 선택기
- `FileUpload.tsx` - 파일 업로드
- `Themed.tsx` - 테마 적용 컴포넌트
- `StyledText.tsx` - 스타일 텍스트

### 유틸리티

- `useColorScheme.ts` - 색상 스키마 훅
- `useClientOnlyValue.ts` - 클라이언트 전용 값
- `ExternalLink.tsx` - 외부 링크
- `EditScreenInfo.tsx` - 화면 정보 편집
- `AnimatedSplash.tsx` - 스플래시 애니메이션

---

## 🗄️ database/ 디렉토리 구조

### 핵심 파일

- `index.ts` - 데이터베이스 엔트리 포인트
- `interface.ts` - 데이터베이스 인터페이스
- `schema.ts` - 스키마 정의
- `platformDatabase.ts` - 플랫폼별 데이터베이스

### 구현체

- `sqlite.ts` - SQLite 구현
- `sqliteRepository.ts` - SQLite 리포지토리
- `indexedDBRepository.ts` - IndexedDB 리포지토리
- `supabaseRepository.ts` - Supabase 리포지토리
- `simpleDatabase.ts` - 간단한 데이터베이스 구현
- `webFallback.ts` - 웹 폴백

### SQL 파일

- `supabase-schema.sql` - Supabase 스키마
- `supabase-categories-schema.sql` - 카테고리 스키마

---

## 🛠️ utils/ 디렉토리 구조

- `authUtils.ts` - 인증 유틸리티
- `bankUtils.ts` - 은행 관련 유틸리티
- `daumMapApi.ts` - 다음 지도 API
- `fcmService.ts` - FCM 푸시 알림
- `fileUpload.ts` - 파일 업로드
- `notificationService.ts` - 알림 서비스
- `socialAuth.ts` - 소셜 인증
- `supabaseAuth.ts` - Supabase 인증
- `activityLogger.ts` - 활동 로거
- `activityUtils.ts` - 활동 유틸리티

---

## 📊 models/ 디렉토리 구조

- `types.ts` - 모든 데이터 타입 정의

  - Worker (근로자)
  - Schedule (스케줄)
  - Client (거래처)
  - WorkPeriod (근무 기간)
  - 등등...

- `store.ts` - 상태 관리 스토어

---

## 🎨 constants/ 디렉토리 구조

- `Colors.ts` - 색상 상수
- `Theme.ts` - 테마 정의

---

## 📝 contexts/ 디렉토리 구조

- `ThemeContext.tsx` - 테마 컨텍스트
- `LocalizationContext.tsx` - 로컬라이제이션 컨텍스트

---

## 🔗 라우팅 구조

### 인증 흐름

```
index (로그인) → main (메인 화면)
       ↓
   signup (회원가입)
   forgot-password (비밀번호 찾기)
   reset-password (재설정)
```

### 메인 기능

```
main → dashboard
     → schedule (스케줄 관리)
     → clients (거래처 관리)
     → workers (근로자 관리)
     → payroll (급여 관리)
     → reports (리포트)
     → files (파일 관리)
     → settings (설정)
```

### 스케줄 흐름

```
schedule → schedule/[id] (상세)
        → schedule-reports (리포트)
```

### 거래처 흐름

```
clients → client/[id] (상세)
```

---

## 🗑️ 삭제된 파일 (정리됨)

- ❌ `app/clients-backup.tsx` - 백업 파일 (삭제됨)
- ❌ `app/clients-simple.tsx` - 간단한 버전 (삭제됨)
- ❌ `components/ScheduleAddModal.tsx.backup` - 백업 파일 (삭제됨)

---

## 📌 주요 기능별 파일 그룹

### 스케줄 관리

- `app/schedule.tsx`
- `app/schedule-list.tsx`
- `app/schedule/[id].tsx`
- `app/schedule-reports.tsx`
- `components/ScheduleAddModal.tsx`
- `components/PlannerCalendar.tsx`

### 급여 관리

- `app/payroll.tsx`
- `app/worker-reports.tsx`
- `components/MonthlyPayrollModal.tsx`
- `components/StaffWorkStatusModal.tsx`

### 거래처 관리

- `app/clients.tsx`
- `app/client/[id].tsx`
- `app/uncollected.tsx`
- `app/unpaid-details.tsx`

### 파일 관리

- `app/files.tsx`
- `components/FileUpload.tsx`

### 리포트

- `app/reports.tsx`
- `app/revenue-reports.tsx`
- `app/performance-analysis.tsx`
- `components/PeriodSelector.tsx`

---

## 🎯 개선 권장사항

1. **파일 구조**: 현재 대부분의 화면이 `app/`에 직접 위치 - 관련 파일들을 하위 폴더로 그룹화 고려
2. **중복 코드**: `clients-simple.tsx` 같은 변형 파일들이 있었음 - 향후 사용하지 않을 파일은 정기적으로 정리
3. **컴포넌트 모듈화**: 큰 파일들을 더 작은 컴포넌트로 분리 권장
4. **테스트**: `components/__tests__/` 폴더에 테스트가 하나만 있음 - 테스트 커버리지 확대 권장
