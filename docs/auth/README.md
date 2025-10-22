# 🔐 인증 (Authentication) 문서

이 폴더는 사용자 인증 및 계정 관리와 관련된 모든 문서를 포함합니다.

## 📋 문서 목록

### 1. AUTH_IMPLEMENTATION_SUMMARY.md

**언제 보나요?** 전체 인증 시스템의 구조를 이해하고 싶을 때

- 인증 시스템 전체 아키텍처
- 구현된 기능 요약
- 코드 구조 및 흐름

### 2. AUTH_FEATURES_GUIDE.md

**언제 보나요?** 사용 가능한 인증 기능의 상세 정보가 필요할 때

- 각 인증 기능 상세 설명
- 사용 방법 및 예제
- API 레퍼런스

### 3. AUTH_ERROR_TRANSLATION_GUIDE.md

**언제 보나요?** 인증 에러 메시지를 한글로 표시하고 싶을 때

- 에러 메시지 한글화 방법
- 에러 코드별 번역 매핑
- 사용자 친화적 메시지 작성법

### 4. PASSWORD_RESET_SETUP_GUIDE.md

**언제 보나요?** 비밀번호 재설정 기능을 구현하거나 수정할 때

- 비밀번호 재설정 플로우
- 이메일 템플릿 설정
- Supabase 설정 방법

### 5. SOCIAL_LOGIN_GUIDE.md

**언제 보나요?** 소셜 로그인 기능을 사용하는 방법을 알고 싶을 때

- 소셜 로그인 사용법
- 각 플랫폼별 구현 방법
- 사용자 데이터 처리

### 6. SOCIAL_LOGIN_SETUP_GUIDE.md

**언제 보나요?** 소셜 로그인을 처음 설정할 때

- Google, Apple 등 초기 설정
- OAuth 설정 방법
- 플랫폼별 키 발급 절차

### 7. SIGNUP_VALIDATION_FIX.md

**언제 보나요?** 회원가입 유효성 검사 관련 문제를 해결할 때

- 회원가입 폼 검증 이슈
- 버그 수정 내역
- 실시간 유효성 검사 구현

## 🎯 추천 읽기 순서

### 처음 인증 시스템을 접하는 경우

1. AUTH_IMPLEMENTATION_SUMMARY.md
2. AUTH_FEATURES_GUIDE.md
3. 필요한 기능별 가이드

### 새로운 인증 기능을 추가하는 경우

1. AUTH_FEATURES_GUIDE.md (기존 기능 확인)
2. 해당 기능별 상세 가이드
3. AUTH_ERROR_TRANSLATION_GUIDE.md (에러 처리)

### 버그를 수정하는 경우

1. SIGNUP_VALIDATION_FIX.md (관련 버그 확인)
2. 해당 기능 가이드
3. AUTH_ERROR_TRANSLATION_GUIDE.md (에러 메시지)

---

**상위 문서로**: [../README.md](../README.md)
