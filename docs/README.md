# 📚 Remit Planner 문서 가이드

이 폴더는 Remit Planner 프로젝트의 모든 기술 문서를 포함하고 있습니다. 상황별로 필요한 문서를 쉽게 찾을 수 있도록 정리했습니다.

## 📁 폴더 구조

```
docs/
├── auth/           # 인증 및 사용자 관리 관련 문서
├── database/       # 데이터베이스 설정 및 마이그레이션 문서
├── deployment/     # 배포 및 CI/CD 관련 문서
├── guides/         # 일반 설정 및 가이드 문서
├── security/       # 보안 및 사용자 격리 관련 문서
├── setup/          # 초기 설정 및 구성 관련 문서
├── sql-scripts/    # SQL 스크립트 파일들
└── updates/        # 업데이트 및 패치 내역 문서
```

---

## 🎯 상황별 문서 찾기

### 🚀 **처음 프로젝트를 시작하는 경우**

1. **[setup/DEVELOPMENT_ENVIRONMENT_SETUP.md](./setup/DEVELOPMENT_ENVIRONMENT_SETUP.md)** - 개발 환경 설정 (macOS/Windows)
2. **[setup/QUICK_SETUP_GUIDE.md](./setup/QUICK_SETUP_GUIDE.md)** - 프로젝트 빠른 시작 가이드
3. **[database/SUPABASE_SETUP.md](./database/SUPABASE_SETUP.md)** - Supabase 초기 설정
4. **[guides/SUPABASE_SETUP_INSTRUCTIONS.md](./guides/SUPABASE_SETUP_INSTRUCTIONS.md)** - Supabase 상세 설정
5. **[guides/DEVELOPMENT_COMMANDS_GUIDE.md](./guides/DEVELOPMENT_COMMANDS_GUIDE.md)** - 앱 실행 및 개발 명령어
6. **[setup/APP_ICON_SETUP_GUIDE.md](./setup/APP_ICON_SETUP_GUIDE.md)** - 앱 아이콘 설정
7. **[deployment/DEPLOYMENT_PIPELINE_GUIDE.md](./deployment/DEPLOYMENT_PIPELINE_GUIDE.md)** - 배포 파이프라인 설정 (선택사항)

### 💻 **macOS/Windows 환경 설정 문제가 있는 경우**

1. **[setup/DEVELOPMENT_ENVIRONMENT_SETUP.md](./setup/DEVELOPMENT_ENVIRONMENT_SETUP.md)** - 필수!
   - Node.js & nvm 설치
   - 터미널 설정 (zsh/PowerShell)
   - "npm: command not found" 해결
   - 크로스 플랫폼 개발 팁
   - 자주 발생하는 문제 해결

### 🔐 **인증(로그인/회원가입) 기능을 구현/수정하는 경우**

1. **[auth/AUTH_IMPLEMENTATION_SUMMARY.md](./auth/AUTH_IMPLEMENTATION_SUMMARY.md)** - 인증 구현 전체 개요
2. **[auth/AUTH_FEATURES_GUIDE.md](./auth/AUTH_FEATURES_GUIDE.md)** - 사용 가능한 인증 기능 상세 설명
3. **[auth/SIGNUP_VALIDATION_FIX.md](./auth/SIGNUP_VALIDATION_FIX.md)** - 회원가입 유효성 검사 이슈 해결
4. **[auth/PASSWORD_RESET_SETUP_GUIDE.md](./auth/PASSWORD_RESET_SETUP_GUIDE.md)** - 비밀번호 재설정 기능 구현
5. **[auth/AUTH_ERROR_TRANSLATION_GUIDE.md](./auth/AUTH_ERROR_TRANSLATION_GUIDE.md)** - 인증 에러 메시지 한글화

### 🌐 **소셜 로그인(구글, 애플 등)을 추가하는 경우**

1. **[auth/SOCIAL_LOGIN_SETUP_GUIDE.md](./auth/SOCIAL_LOGIN_SETUP_GUIDE.md)** - 소셜 로그인 초기 설정
2. **[auth/SOCIAL_LOGIN_GUIDE.md](./auth/SOCIAL_LOGIN_GUIDE.md)** - 소셜 로그인 사용 가이드

### 🗄️ **데이터베이스 스키마를 변경/마이그레이션하는 경우**

1. **[database/DATABASE_MIGRATION_GUIDE.md](./database/DATABASE_MIGRATION_GUIDE.md)** - 데이터베이스 마이그레이션 절차
2. **[database/SUPABASE_SCHEMA_UPDATE.md](./database/SUPABASE_SCHEMA_UPDATE.md)** - Supabase 스키마 업데이트 가이드
3. **[database/SUPABASE_AUTH_MIGRATION_GUIDE.md](./database/SUPABASE_AUTH_MIGRATION_GUIDE.md)** - 인증 시스템 마이그레이션

### 🔒 **보안 및 사용자 데이터 격리를 설정하는 경우**

1. **[security/SECURITY_LEVELS_EXPLAINED.md](./security/SECURITY_LEVELS_EXPLAINED.md)** - 보안 레벨 설명
2. **[database/DATABASE_LEVEL_SECURITY_SETUP_GUIDE.md](./database/DATABASE_LEVEL_SECURITY_SETUP_GUIDE.md)** - RLS(Row Level Security) 설정
3. **[database/DATABASE_OPERATIONS_USER_ISOLATION_COMPLETE.md](./database/DATABASE_OPERATIONS_USER_ISOLATION_COMPLETE.md)** - 사용자 격리 구현 완료 문서
4. **[security/USER_ISOLATION_TEST_GUIDE.md](./security/USER_ISOLATION_TEST_GUIDE.md)** - 사용자 격리 테스트 방법

### ✅ **보안 검증 및 테스트를 수행하는 경우**

1. **[security/FINAL_SECURITY_VERIFICATION.md](./security/FINAL_SECURITY_VERIFICATION.md)** - 최종 보안 검증 체크리스트
2. **[security/FINAL_USER_ISOLATION_CHECK.md](./security/FINAL_USER_ISOLATION_CHECK.md)** - 사용자 격리 최종 확인
3. **[security/USER_ISOLATION_TEST_GUIDE.md](./security/USER_ISOLATION_TEST_GUIDE.md)** - 격리 기능 테스트 가이드

### 📱 **앱 UI/UX를 수정하는 경우**

1. **[setup/APP_ICON_SETUP_GUIDE.md](./setup/APP_ICON_SETUP_GUIDE.md)** - 앱 아이콘 변경
2. **[setup/TERMS_AND_PRIVACY_GUIDE.md](./setup/TERMS_AND_PRIVACY_GUIDE.md)** - 이용약관 및 개인정보처리방침 페이지

### 🚢 **앱을 배포하거나 CI/CD를 설정하는 경우**

1. **[deployment/DEPLOYMENT_PIPELINE_GUIDE.md](./deployment/DEPLOYMENT_PIPELINE_GUIDE.md)** - 배포 파이프라인 완전 가이드
   - EAS Build 설정
   - GitHub Actions CI/CD
   - OTA 업데이트
   - 앱스토어 제출
2. **[deployment/QUICK_DEPLOYMENT_GUIDE.md](./deployment/QUICK_DEPLOYMENT_GUIDE.md)** - 빠른 배포 참조
3. **[guides/DEVELOPMENT_COMMANDS_GUIDE.md](./guides/DEVELOPMENT_COMMANDS_GUIDE.md)** - 빌드 명령어 참고

### 🐛 **버그를 수정하거나 업데이트를 확인하는 경우**

1. **[updates/REALTIME_VALIDATION_UPDATE.md](./updates/REALTIME_VALIDATION_UPDATE.md)** - 실시간 유효성 검사 업데이트
2. **[auth/SIGNUP_VALIDATION_FIX.md](./auth/SIGNUP_VALIDATION_FIX.md)** - 회원가입 관련 버그 수정

### 🔧 **에러 메시지를 다루는 경우**

1. **[auth/AUTH_ERROR_TRANSLATION_GUIDE.md](./auth/AUTH_ERROR_TRANSLATION_GUIDE.md)** - 인증 에러 메시지 처리

---

## 📋 카테고리별 상세 설명

### 📂 auth/ (인증 관련)

- **AUTH_IMPLEMENTATION_SUMMARY.md** - 전체 인증 시스템 구현 요약
- **AUTH_FEATURES_GUIDE.md** - 인증 기능 상세 가이드
- **AUTH_ERROR_TRANSLATION_GUIDE.md** - 에러 메시지 한글화
- **PASSWORD_RESET_SETUP_GUIDE.md** - 비밀번호 재설정 구현
- **SOCIAL_LOGIN_GUIDE.md** - 소셜 로그인 사용법
- **SOCIAL_LOGIN_SETUP_GUIDE.md** - 소셜 로그인 설정
- **SIGNUP_VALIDATION_FIX.md** - 회원가입 유효성 검사 수정사항

### 📂 database/ (데이터베이스 관련)

- **SUPABASE_SETUP.md** - Supabase 초기 설정
- **SUPABASE_SCHEMA_UPDATE.md** - 스키마 업데이트 가이드
- **SUPABASE_AUTH_MIGRATION_GUIDE.md** - 인증 마이그레이션
- **DATABASE_MIGRATION_GUIDE.md** - 일반 마이그레이션 절차
- **DATABASE_LEVEL_SECURITY_SETUP_GUIDE.md** - RLS 설정
- **DATABASE_OPERATIONS_USER_ISOLATION_COMPLETE.md** - 사용자 격리 완료 문서

### 📂 deployment/ (배포 및 CI/CD 관련)

- **FINAL_DEPLOYMENT_SETUP.md** - 최종 설정 완료
- **DEPLOYMENT_SETUP_SUMMARY.md** - 배포 설정 요약
- **DEPLOYMENT_PIPELINE_GUIDE.md** - 배포 파이프라인 완전 가이드
- **QUICK_DEPLOYMENT_GUIDE.md** - 빠른 배포 가이드
- **DEPLOYMENT_CHECKLIST.md** - 배포 전 체크리스트
- **NEXT_STEPS.md** - 다음 단계 간단 정리
- **BUILD_TROUBLESHOOTING.md** - 빌드 문제 해결
- **CURRENT_BUILD_ISSUES.md** - 현재 빌드 문제 현황
- **IMAGE_FILES_FIX.md** - 이미지 파일 형식 문제
- **POWERSHELL_COMMANDS.md** - PowerShell 명령어
- **EAS_FIX_INSTRUCTIONS.md** - EAS 설정 문제 해결
- **ENV_VARIABLES_EXPLAINED.md** - 환경 변수 설정 가이드
- **GITHUB_SECRETS_SETUP.md** - GitHub Secrets 설정 방법
- **TEST_BUILD_WITHOUT_DEV_ACCOUNT.md** - 무료 테스트 빌드
- **IOS_BUILD_ACCOUNT_REQUIREMENTS.md** - iOS 계정 요구사항

### 📂 security/ (보안 관련)

- **SECURITY_LEVELS_EXPLAINED.md** - 보안 레벨 개념 설명
- **USER_ISOLATION_TEST_GUIDE.md** - 사용자 격리 테스트
- **FINAL_SECURITY_VERIFICATION.md** - 최종 보안 검증
- **FINAL_USER_ISOLATION_CHECK.md** - 격리 기능 최종 확인

### 📂 setup/ (설정 관련)

- **DEVELOPMENT_ENVIRONMENT_SETUP.md** - 개발 환경 설정 (macOS/Windows)
- **QUICK_SETUP_GUIDE.md** - 빠른 시작 가이드
- **APP_ICON_SETUP_GUIDE.md** - 앱 아이콘 설정
- **TERMS_AND_PRIVACY_GUIDE.md** - 약관 및 개인정보 페이지

### 📂 guides/ (가이드 및 설명)

- **CATEGORY_SETUP_GUIDE.md** - 카테고리 설정 가이드
- **SUPABASE_SETUP_INSTRUCTIONS.md** - Supabase 설치 지침
- **SUPABASE_STORAGE_SETUP.md** - Supabase Storage 설정
- **TEST_DATA_GUIDE.md** - 테스트 데이터 가이드
- **PROJECT_STRUCTURE.md** - 프로젝트 구조 문서
- **DEVELOPMENT_COMMANDS_GUIDE.md** - 개발 명령어 및 실행 가이드

### 📂 sql-scripts/ (SQL 스크립트)

- 여러 테스트 데이터 및 마이그레이션 SQL 파일들

### 📂 updates/ (업데이트 내역)

- **REALTIME_VALIDATION_UPDATE.md** - 실시간 유효성 검사 업데이트 내역

---

## 🆘 도움이 필요한 경우

1. **개발 환경 문제**: [setup/DEVELOPMENT_ENVIRONMENT_SETUP.md](./setup/DEVELOPMENT_ENVIRONMENT_SETUP.md) - npm, nvm 등
2. **일반적인 시작**: [setup/QUICK_SETUP_GUIDE.md](./setup/QUICK_SETUP_GUIDE.md)부터 읽으세요
3. **특정 기능 구현**: 위의 "상황별 문서 찾기" 섹션을 참고하세요
4. **문서가 없는 경우**: 프로젝트 메인테이너에게 문의하거나 이슈를 등록하세요

---

## 📝 문서 작성/수정 규칙

새로운 문서를 추가하거나 기존 문서를 수정할 때는 다음 규칙을 따라주세요:

1. **적절한 폴더에 배치**: auth, database, deployment, guides, security, setup, updates 중 하나
2. **명확한 파일명**: 대문자와 언더스코어 사용 (예: NEW_FEATURE_GUIDE.md)
3. **이 README 업데이트**: 새 문서를 추가했다면 이 파일에 링크 추가
4. **일관된 형식**: 제목, 목차, 단계별 설명, 예제 코드 포함

---

**최종 업데이트**: 2025-11-03
