# 🔒 보안 (Security) 문서

이 폴더는 보안, 사용자 데이터 격리, 권한 관리와 관련된 모든 문서를 포함합니다.

## 📋 문서 목록

### 1. SECURITY_LEVELS_EXPLAINED.md

**언제 보나요?** 프로젝트의 보안 레벨과 개념을 이해하고 싶을 때

- 보안 레벨 정의
- 각 레벨의 요구사항
- 보안 아키텍처 개요

### 2. USER_ISOLATION_TEST_GUIDE.md

**언제 보나요?** 사용자 간 데이터 격리가 제대로 작동하는지 테스트할 때

- 격리 기능 테스트 방법
- 테스트 케이스 예제
- 취약점 확인 체크리스트

### 3. FINAL_SECURITY_VERIFICATION.md

**언제 보나요?** 배포 전 최종 보안 검증을 수행할 때

- 보안 검증 체크리스트
- 필수 확인 항목
- 배포 전 점검 사항

### 4. FINAL_USER_ISOLATION_CHECK.md

**언제 보나요?** 사용자 격리 기능의 최종 확인이 필요할 때

- 격리 기능 완전성 확인
- 모든 테이블의 RLS 정책 검증
- 사용자별 데이터 접근 테스트

## 🎯 추천 읽기 순서

### 보안을 처음 공부하는 경우

1. SECURITY_LEVELS_EXPLAINED.md
2. [../database/DATABASE_LEVEL_SECURITY_SETUP_GUIDE.md](../database/DATABASE_LEVEL_SECURITY_SETUP_GUIDE.md)
3. USER_ISOLATION_TEST_GUIDE.md

### 보안 기능을 구현하는 경우

1. SECURITY_LEVELS_EXPLAINED.md (개념 이해)
2. [../database/DATABASE_LEVEL_SECURITY_SETUP_GUIDE.md](../database/DATABASE_LEVEL_SECURITY_SETUP_GUIDE.md) (RLS 설정)
3. USER_ISOLATION_TEST_GUIDE.md (테스트)

### 배포 전 검증하는 경우

1. USER_ISOLATION_TEST_GUIDE.md
2. FINAL_USER_ISOLATION_CHECK.md
3. FINAL_SECURITY_VERIFICATION.md

### 보안 이슈를 해결하는 경우

1. USER_ISOLATION_TEST_GUIDE.md (문제 재현)
2. SECURITY_LEVELS_EXPLAINED.md (개념 재확인)
3. [../database/DATABASE_LEVEL_SECURITY_SETUP_GUIDE.md](../database/DATABASE_LEVEL_SECURITY_SETUP_GUIDE.md) (수정)

## 🛡️ 보안 베스트 프랙티스

### 필수 보안 조치

- ✅ 모든 테이블에 RLS 정책 적용
- ✅ user_id 기반 데이터 격리
- ✅ API 키 환경변수 관리
- ✅ HTTPS 통신 필수

### 정기적으로 확인할 사항

- 🔍 RLS 정책 유효성
- 🔍 사용자 권한 설정
- 🔍 API 엔드포인트 보안
- 🔍 인증 토큰 만료 정책

### 금지 사항

- ❌ 프론트엔드에 민감 정보 하드코딩
- ❌ RLS 없이 테이블 생성
- ❌ 관리자 계정 기본 비밀번호 사용
- ❌ SQL 인젝션 취약한 쿼리 작성

## ⚠️ 주의사항

- **테스트 필수**: 모든 보안 변경 사항은 반드시 테스트하세요
- **정기 검증**: 최소 월 1회 보안 체크리스트 점검
- **즉시 대응**: 보안 이슈 발견 시 즉시 패치 적용
- **문서화**: 모든 보안 결정 사항을 문서화하세요

---

**상위 문서로**: [../README.md](../README.md)
