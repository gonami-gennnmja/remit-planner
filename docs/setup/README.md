# ⚙️ 설정 (Setup) 문서

이 폴더는 프로젝트 초기 설정, 구성, UI 설정과 관련된 모든 문서를 포함합니다.

## 📋 문서 목록

### 1. DEVELOPMENT_ENVIRONMENT_SETUP.md

**언제 보나요?** macOS와 Windows를 오가며 개발할 때 또는 개발 환경을 처음 설정할 때

- Node.js & nvm 설치 (macOS/Windows)
- 플랫폼별 환경 설정 가이드
- 크로스 플랫폼 개발 팁
- 자주 발생하는 문제 해결
- 터미널 설정 (zsh, PowerShell)

### 2. QUICK_SETUP_GUIDE.md

**언제 보나요?** 프로젝트를 처음 시작하거나 새로운 개발 환경을 구축할 때

- 프로젝트 클론 및 설치
- 환경 변수 설정
- 첫 실행 가이드
- 필수 의존성 설치

### 3. APP_ICON_SETUP_GUIDE.md

**언제 보나요?** 앱 아이콘이나 스플래시 화면을 변경할 때

- 아이콘 파일 준비 방법
- 플랫폼별 아이콘 설정 (iOS, Android, Web)
- 스플래시 화면 설정
- 아이콘 생성 도구 안내

### 4. TERMS_AND_PRIVACY_GUIDE.md

**언제 보나요?** 이용약관이나 개인정보처리방침 페이지를 만들거나 수정할 때

- 약관 페이지 생성 방법
- 법적 필수 사항
- 텍스트 업데이트 절차
- 다국어 지원 방법

## 🎯 추천 읽기 순서

### 처음 프로젝트를 시작하는 경우

1. **DEVELOPMENT_ENVIRONMENT_SETUP.md** ← 개발 환경 먼저!
2. **QUICK_SETUP_GUIDE.md** ← 그 다음 프로젝트 설정
3. [../database/SUPABASE_SETUP.md](../database/SUPABASE_SETUP.md)
4. [../auth/AUTH_IMPLEMENTATION_SUMMARY.md](../auth/AUTH_IMPLEMENTATION_SUMMARY.md)

### macOS/Windows 환경 설정 문제가 있는 경우

1. **DEVELOPMENT_ENVIRONMENT_SETUP.md** ← 반드시 읽기!
   - nvm 설정
   - 플랫폼별 차이점
   - 문제 해결 방법

### 앱을 출시 준비하는 경우

1. APP_ICON_SETUP_GUIDE.md
2. TERMS_AND_PRIVACY_GUIDE.md
3. [../security/FINAL_SECURITY_VERIFICATION.md](../security/FINAL_SECURITY_VERIFICATION.md)

### UI/UX를 수정하는 경우

1. APP_ICON_SETUP_GUIDE.md (아이콘/스플래시)
2. TERMS_AND_PRIVACY_GUIDE.md (법적 페이지)

## 🚀 빠른 시작 (Quick Start)

프로젝트를 처음 시작하신다면 아래 순서대로 진행하세요:

1. **개발 환경 설정** (처음 1회만)

   - [ ] DEVELOPMENT_ENVIRONMENT_SETUP.md 읽기
   - [ ] Node.js & nvm 설치
   - [ ] 터미널 설정 (zsh/PowerShell)

   ```bash
   # macOS - nvm 확인
   nvm --version
   node --version

   # Windows (PowerShell)
   nvm version
   node --version
   ```

2. **프로젝트 설정**

   ```bash
   # 1. 프로젝트 클론
   git clone <repository-url>
   cd remit-planner

   # 2. 의존성 설치
   npm install
   ```

3. **문서 읽기**

   - [ ] QUICK_SETUP_GUIDE.md
   - [ ] [../database/SUPABASE_SETUP.md](../database/SUPABASE_SETUP.md)
   - [ ] [../auth/AUTH_IMPLEMENTATION_SUMMARY.md](../auth/AUTH_IMPLEMENTATION_SUMMARY.md)

4. **개발 서버 실행**
   ```bash
   npm start
   ```

## 📱 배포 체크리스트

앱을 배포하기 전에 확인하세요:

- [ ] **APP_ICON_SETUP_GUIDE.md**

  - [ ] 앱 아이콘 설정 완료
  - [ ] 스플래시 화면 설정 완료
  - [ ] 모든 플랫폼(iOS, Android, Web) 아이콘 확인

- [ ] **TERMS_AND_PRIVACY_GUIDE.md**

  - [ ] 이용약관 페이지 생성
  - [ ] 개인정보처리방침 페이지 생성
  - [ ] 법적 검토 완료

- [ ] **보안 및 테스트**
  - [ ] [../security/FINAL_SECURITY_VERIFICATION.md](../security/FINAL_SECURITY_VERIFICATION.md) 체크
  - [ ] [../security/FINAL_USER_ISOLATION_CHECK.md](../security/FINAL_USER_ISOLATION_CHECK.md) 체크

## 🛠️ 개발 환경 요구사항

### 필수 소프트웨어

- Node.js (v16 이상)
- npm 또는 yarn
- Git

### 선택 사항

- React Native CLI (네이티브 앱 개발 시)
- Xcode (iOS 개발 시)
- Android Studio (Android 개발 시)

### 환경 변수

자세한 내용은 **QUICK_SETUP_GUIDE.md**를 참고하세요.

## 💡 팁

- **처음이라면**: QUICK_SETUP_GUIDE.md를 단계별로 천천히 따라하세요
- **문제가 생기면**: 각 가이드의 "문제 해결" 섹션을 확인하세요
- **배포 전**: 모든 체크리스트를 확인하세요

---

**상위 문서로**: [../README.md](../README.md)
