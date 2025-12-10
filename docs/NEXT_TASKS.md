# 다음 작업 항목 정리

## 🔴 우선순위 높음 (즉시 구현 가능)

### 1. 급여 지급 상태 업데이트 ✅ 구현 가능

**파일**: `app/worker/payroll.tsx` (라인 571)

- **현재 상태**: TODO 주석만 있음
- **필요 작업**:
  - `updateScheduleWorker`를 사용하여 `wagePaid`, `fuelPaid`, `otherPaid` 업데이트
  - `unpaid-details.tsx`와 동일한 패턴으로 구현
- **예상 시간**: 10-15분

### 2. 일반 상세 모달 구현 ✅ 구현 가능

**파일**: `components/MainScreen.tsx` (라인 548)

- **현재 상태**: TODO 주석만 있음
- **필요 작업**:
  - 활동 클릭 시 상세 정보를 보여주는 모달 구현
  - 기존 모달 컴포넌트 재사용 가능
- **예상 시간**: 30-45분

## 🟡 우선순위 중간 (외부 서비스 필요)

### 3. 송금 API 연동 ⚠️ 외부 API 필요

**파일**: `app/clients/unpaid-details.tsx` (라인 203)

- **현재 상태**: Alert만 표시
- **필요 작업**:
  - 실제 은행 송금 API 연동 (오픈뱅킹 API 등)
  - 또는 송금 내역만 기록하는 기능으로 대체 가능
- **예상 시간**: 2-4시간 (API 연동 시)

### 4. Expo Push 알림 전송 ⚠️ 서버 구현 필요

**파일**: `utils/notificationService.ts` (라인 43)

- **현재 상태**: 로컬 알림만 작동
- **필요 작업**:
  - 서버에서 Expo Push Token으로 알림 전송
  - Supabase Edge Functions 또는 별도 서버 필요
- **예상 시간**: 4-6시간 (서버 구현 포함)

## 🟢 우선순위 낮음 (향후 개선)

### 5. 성능 최적화

- **파일**: `components/MainScreen.tsx`
- **문제**: 모든 스케줄을 로드한 후 클라이언트에서 필터링
- **개선**: `getTodaySchedules(date)` 같은 DB 쿼리 최적화
- **참고**: `docs/PERFORMANCE_ISSUES.md`

### 6. 소셜 로그인

- 카카오, 네이버, 구글, 애플 로그인
- **참고**: `docs/auth/SOCIAL_LOGIN_GUIDE.md`

### 7. 2단계 인증 (2FA)

- 보안 강화 기능
- **참고**: `docs/auth/AUTH_IMPLEMENTATION_SUMMARY.md`

## 📋 추천 작업 순서

1. **급여 지급 상태 업데이트** (가장 간단, 즉시 구현 가능)
2. **일반 상세 모달 구현** (UI 개선, 사용자 경험 향상)
3. **송금 내역 기록 기능** (API 연동 대신 내역만 기록)
4. **성능 최적화** (데이터가 많아질 때 필요)

## 💡 빠른 대안

### 송금 API 대신 내역 기록

실제 송금 API 연동 대신, 송금 내역만 기록하는 기능으로 구현:

- 송금 완료 시 DB에 기록
- 송금 내역 조회 기능
- 나중에 실제 API 연동 가능




