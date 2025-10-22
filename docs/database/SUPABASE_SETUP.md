# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인
4. "New Project" 클릭
5. 프로젝트 정보 입력:
   - **Organization:** 개인 계정 또는 조직 선택
   - **Project Name:** `remit-planner`
   - **Database Password:** 강력한 비밀번호 설정 (기억해두세요!)
   - **Region:** Asia Pacific (Seoul) 권장
6. "Create new project" 클릭
7. 프로젝트 생성 완료까지 2-3분 대기

## 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase 설정
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### Supabase URL과 Key 찾기:

1. Supabase 대시보드에서 프로젝트 선택
2. 좌측 메뉴에서 "Settings" > "API" 클릭
3. **Project URL** 복사 → `EXPO_PUBLIC_SUPABASE_URL`에 입력
4. **anon public** 키 복사 → `EXPO_PUBLIC_SUPABASE_ANON_KEY`에 입력

## 3. 데이터베이스 스키마 생성

1. Supabase 대시보드에서 좌측 메뉴 "SQL Editor" 클릭
2. "New query" 클릭
3. `database/supabase-schema.sql` 파일의 내용을 복사하여 붙여넣기
4. "Run" 버튼 클릭하여 스키마 생성

## 4. 테이블 확인

1. 좌측 메뉴에서 "Table Editor" 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - `workers` (근로자)
   - `schedules` (스케줄)
   - `schedule_workers` (스케줄-근로자 관계)
   - `work_periods` (근무 기간)
   - `activities` (활동 로그)

## 5. 앱 재시작

환경 변수를 변경했으므로 앱을 재시작하세요:

```bash
# 개발 서버 중지 후 재시작
npm start
# 또는
expo start
```

## 6. 연결 확인

앱을 실행하면 콘솔에 다음 메시지가 표시됩니다:

- **성공:** `🗄️ Using Supabase database` + `✅ Supabase connected successfully`
- **실패:** `💾 Using local database (Supabase not configured)`

## 7. 데이터 영속성 확인

1. 근로자 추가/수정/삭제 테스트
2. 브라우저 캐시 삭제
3. 페이지 새로고침
4. 데이터가 유지되는지 확인

## 문제 해결

### 환경 변수가 적용되지 않는 경우:

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일명이 정확한지 확인 (`.env.local`)
3. 앱을 완전히 재시작

### Supabase 연결 실패:

1. URL과 Key가 정확한지 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. 네트워크 연결 상태 확인

### 데이터베이스 오류:

1. Supabase 대시보드에서 "Logs" 확인
2. SQL 스키마가 올바르게 실행되었는지 확인
3. 테이블 권한 설정 확인

## 보안 주의사항

- `.env.local` 파일은 절대 Git에 커밋하지 마세요
- `.gitignore`에 `.env.local`이 포함되어 있는지 확인
- 프로덕션에서는 환경 변수를 안전하게 관리하세요
