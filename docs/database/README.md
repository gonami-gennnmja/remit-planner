# 🗄️ 데이터베이스 문서

이 폴더는 데이터베이스 설정, 스키마, 마이그레이션과 관련된 모든 문서를 포함합니다.

## 📋 문서 목록

### 1. SUPABASE_SETUP.md

**언제 보나요?** Supabase를 처음 설정하거나 새 환경을 구축할 때

- Supabase 프로젝트 생성
- 환경 변수 설정
- 초기 연결 테스트

### 2. SUPABASE_SCHEMA_UPDATE.md

**언제 보나요?** 데이터베이스 스키마를 변경해야 할 때

- 테이블 추가/수정 방법
- 컬럼 변경 절차
- 인덱스 생성 가이드

### 3. SUPABASE_AUTH_MIGRATION_GUIDE.md

**언제 보나요?** 인증 시스템을 Supabase로 마이그레이션할 때

- 기존 인증 시스템에서 전환
- 사용자 데이터 이전
- 세션 관리 변경

### 4. DATABASE_MIGRATION_GUIDE.md

**언제 보나요?** 일반적인 데이터베이스 마이그레이션을 수행할 때

- 마이그레이션 파일 작성
- 업/다운 마이그레이션 실행
- 롤백 절차

### 5. DATABASE_LEVEL_SECURITY_SETUP_GUIDE.md

**언제 보나요?** Row Level Security (RLS)를 설정할 때

- RLS 정책 작성
- 사용자별 데이터 접근 제어
- 권한 설정 예제

### 6. DATABASE_OPERATIONS_USER_ISOLATION_COMPLETE.md

**언제 보나요?** 사용자 데이터 격리 구현이 완료되었는지 확인할 때

- 격리 기능 구현 내역
- 적용된 정책 목록
- 검증 완료 사항

## 🎯 추천 읽기 순서

### 처음 데이터베이스를 설정하는 경우

1. SUPABASE_SETUP.md
2. DATABASE_LEVEL_SECURITY_SETUP_GUIDE.md
3. DATABASE_MIGRATION_GUIDE.md

### 스키마를 변경해야 하는 경우

1. DATABASE_MIGRATION_GUIDE.md
2. SUPABASE_SCHEMA_UPDATE.md
3. DATABASE_OPERATIONS_USER_ISOLATION_COMPLETE.md (격리 영향 확인)

### 보안 정책을 적용하는 경우

1. DATABASE_LEVEL_SECURITY_SETUP_GUIDE.md
2. DATABASE_OPERATIONS_USER_ISOLATION_COMPLETE.md
3. [../security/](../security/) 폴더의 문서들

### 기존 시스템을 마이그레이션하는 경우

1. SUPABASE_SETUP.md
2. SUPABASE_AUTH_MIGRATION_GUIDE.md
3. DATABASE_MIGRATION_GUIDE.md

## ⚠️ 주의사항

- **백업 필수**: 프로덕션 데이터베이스 작업 전 반드시 백업하세요
- **마이그레이션 테스트**: 개발 환경에서 먼저 테스트 후 프로덕션 적용
- **RLS 정책**: 정책 변경 시 기존 사용자 접근 권한에 영향을 줄 수 있습니다

---

**상위 문서로**: [../README.md](../README.md)
