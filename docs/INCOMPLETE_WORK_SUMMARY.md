# 미완성 작업 정리 요약

## ✅ 완료된 작업

### 1. 담당자 정보 저장/삭제 기능 구현

- **파일**: `app/clients/[id].tsx`
- **내용**: `client_contacts` 테이블에 담당자 정보를 저장/삭제하는 기능 구현
- **변경사항**:
  - `handleSaveContact`: 담당자 정보를 DB에 저장하도록 수정
  - `handleDeleteContact`: 담당자 정보를 DB에서 삭제하도록 수정
  - `updateClient` 메서드를 활용하여 담당자 정보 동기화

### 2. 거래처 매출 데이터 계산 로직 구현

- **파일**: `app/dashboard.tsx`
- **내용**: 실제 `contractAmount`를 사용하여 매출 계산
- **변경사항**:
  - 하드코딩된 `REVENUE_PER_SCHEDULE` 제거
  - `schedule.contractAmount`를 사용하여 실제 계약금액 기반 계산
  - `totalRevenue` 계산 로직 구현

### 3. 수입 확인 처리 DB 업데이트

- **파일**: `app/clients/revenue-management.tsx`
- **내용**: 수입 확인 시 `revenue_status`를 'received'로 업데이트
- **변경사항**:
  - `markAsReceived` 함수에서 `updateSchedule` 호출
  - `schedule.collected` 대신 `schedule.revenueStatus` 사용
  - `database` import를 `getDatabase`로 변경

### 4. 지급 완료 처리 DB 업데이트

- **파일**: `app/clients/unpaid-details.tsx`
- **내용**: 급여/유류비/기타비용 지급 완료 시 DB 업데이트
- **변경사항**:
  - `markAsPaid` 함수에서 `getScheduleWorkers`로 `scheduleWorkerId` 찾기
  - `updateScheduleWorker`를 사용하여 `wagePaid`, `fuelPaid`, `otherPaid` 업데이트
  - 지급 완료 후 `loadUnpaidData` 호출하여 데이터 새로고침

## 📝 남은 TODO 항목

### 외부 API 연동 필요

1. **송금 API 연동** (`app/clients/unpaid-details.tsx`)

   - 실제 은행 송금 API 연동 필요
   - 현재는 Alert만 표시

2. **파일 업로드 구현** (`app/files.tsx`)

   - 실제 파일 업로드 기능 구현 필요
   - Supabase Storage 또는 다른 스토리지 서비스 연동

3. **Expo Push 알림 전송** (`utils/notificationService.ts`)
   - 서버에서 Expo Push 알림 전송 기능 구현 필요

### 라우팅 관련

4. **router.push 구현** (`utils/fcmService.ts`)
   - FCM 알림 클릭 시 해당 화면으로 이동하는 기능
   - Expo Router의 `router.push` 사용

### UI 개선

5. **일반 상세 모달 구현** (`components/MainScreen.tsx`)
   - 일반 스케줄 상세 모달 구현 필요

### 데이터베이스

6. **급여 지급 상태 업데이트** (`app/worker/payroll.tsx`)

   - 급여 지급 상태 변경 시 DB 업데이트 필요

7. **사용자 ID 처리** (`app/clients/index.tsx`)
   - 하드코딩된 "current-user" 대신 실제 사용자 ID 사용
   - `getCurrentUser` 또는 인증 컨텍스트 활용

## 📌 참고사항

- 모든 DB 업데이트는 `getDatabase()`를 통해 플랫폼별 데이터베이스 인스턴스를 가져와 사용
- Supabase를 사용하는 경우 `SupabaseRepository`가 자동으로 선택됨
- 변경사항은 모두 에러 처리 및 사용자 피드백 포함

