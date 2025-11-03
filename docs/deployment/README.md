# 🚀 배포 가이드 개요

반반(Half&Half) 프로젝트의 배포 관련 모든 문서를 한 곳에서 찾을 수 있습니다.

## 📚 가이드 목차

### 0. [DEPLOYMENT_SETUP_SUMMARY.md](./DEPLOYMENT_SETUP_SUMMARY.md) 📋 **시작하기**

배포 설정 요약 및 빠른 시작

**누가 봐야 하나요?**

- 지금 배포를 시작하는 모든 분

---

### 1. [DEPLOYMENT_PIPELINE_GUIDE.md](./DEPLOYMENT_PIPELINE_GUIDE.md) ⭐ **필수 읽기**

완전한 배포 파이프라인 설정 가이드

**주요 내용:**

- EAS Build 설정 및 사용법
- GitHub Actions CI/CD 구축
- OTA 업데이트 전략
- 멀티 환경 관리
- 비용 최적화

**누가 봐야 하나요?**

- DevOps 담당자
- 초기 배포 설정하는 개발자
- CI/CD 구축하는 팀원

---

### 2. [QUICK_DEPLOYMENT_GUIDE.md](./QUICK_DEPLOYMENT_GUIDE.md) ⚡ **빠른 참조**

5분 안에 시작하는 빠른 가이드

**주요 내용:**

- 주요 배포 명령어
- 일반적인 워크플로우
- 빠른 문제 해결

**누가 봐야 하나요?**

- 이미 설정된 프로젝트를 배포하는 개발자
- 빠른 명령어 참조가 필요한 경우

---

### 3. [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) ✅ **체크리스트**

배포 전 꼭 확인해야 할 항목들

**주요 내용:**

- 단계별 체크리스트
- 환경별 확인사항
- 문제 해결 가이드

**누가 봐야 하나요?**

- 배포 직전 개발자
- QA 담당자

---

### 4. [NEXT_STEPS.md](./NEXT_STEPS.md) 🎯 **다음 단계**

간단한 행동 지침

**주요 내용:**

- 지금 바로 해야 할 일
- 시간별 소요 예상
- 빠른 명령어

**누가 봐야 하나요?**

- 지금 배포 시작하는 개발자

---

### 5. [EAS_FIX_INSTRUCTIONS.md](./EAS_FIX_INSTRUCTIONS.md) 🔧 **EAS 설정**

EAS 빌드 설정 문제 해결

**주요 내용:**

- EAS 프로젝트 설정
- 빌드 오류 해결

**누가 봐야 하나요?**

- EAS 빌드 오류 발생 시

---

### 6. [ENV_VARIABLES_EXPLAINED.md](./ENV_VARIABLES_EXPLAINED.md) 🔐 **환경 변수**

환경 변수 설정 가이드

**주요 내용:**

- 환경 변수 우선순위
- 보안 고려사항
- 배포 환경 설정

**누가 봐야 하나요?**

- 환경 변수 설정 필요한 경우

---

### 7. [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) 🔑 **Secrets 설정**

GitHub Secrets 등록 방법

**주요 내용:**

- EXPO_TOKEN 등록
- 단계별 가이드
- 보안 주의사항

**누가 봐야 하나요?**

- CI/CD 설정하는 개발자

---

### 8. [TEST_BUILD_WITHOUT_DEV_ACCOUNT.md](./TEST_BUILD_WITHOUT_DEV_ACCOUNT.md) 🧪 **무료 테스트 빌드**

개발자 계정 없이 테스트하기

**주요 내용:**

- Android Preview 빌드
- 무료 옵션 활용
- 개발자 계정 없이 가능한 것들

**누가 봐야 하나요?**

- 비용 없이 테스트하고 싶은 경우

---

### 9. [IOS_BUILD_ACCOUNT_REQUIREMENTS.md](./IOS_BUILD_ACCOUNT_REQUIREMENTS.md) 📱 **iOS 계정 요구사항**

iOS 빌드 계정 필요성 설명

**주요 내용:**

- iOS vs Android 비교
- 무료 대안
- 개발자 계정 비용

**누가 봐야 하나요?**

- iOS 빌드 계획 중인 경우

---

### 10. [BUILD_TROUBLESHOOTING.md](./BUILD_TROUBLESHOOTING.md) 🔧 **빌드 문제 해결**

빌드 실패 시 대처 방법

**주요 내용:**

- Gradle 빌드 오류
- 환경 변수 문제
- 의존성 충돌 해결

**누가 봐야 하나요?**

- 빌드가 실패하는 경우

---

### 11. [POWERSHELL_COMMANDS.md](./POWERSHELL_COMMANDS.md) 💻 **PowerShell 명령어**

Windows PowerShell 명령어 모음

**주요 내용:**

- Windows 전용 명령어
- 파일 관리
- Git 명령어

**누가 봐야 하나요?**

- Windows 사용자

---

## 🚀 시작하기

### 처음 시작하시나요?

1. **[DEPLOYMENT_PIPELINE_GUIDE.md](./DEPLOYMENT_PIPELINE_GUIDE.md)**부터 읽으세요
2. `../../scripts/setup-deployment.sh` 또는 `../../scripts/setup-deployment.ps1` 실행
3. 첫 번째 빌드 실행

### 빠른 명령어가 필요하신가요?

**[QUICK_DEPLOYMENT_GUIDE.md](./QUICK_DEPLOYMENT_GUIDE.md)**를 북마크하세요

---

## 📁 관련 파일

### 설정 파일

- `../../eas.json` - EAS Build 설정
- `../../app.json` - 앱 메타데이터
- `../../.github/workflows/` - GitHub Actions 워크플로우
  - `ci.yml` - 지속적 통합
  - `build-android.yml` - Android 빌드
  - `build-ios.yml` - iOS 빌드
  - `deploy-web.yml` - Web 배포
  - `submit-to-stores.yml` - 스토어 제출

### 스크립트

- `../../scripts/setup-deployment.sh` (macOS/Linux) - 자동 설정 스크립트
- `../../scripts/setup-deployment.ps1` (Windows) - 자동 설정 스크립트

---

## 🎯 배포 시나리오별 가이드

### 시나리오 1: 처음 프로덕션 배포

```
1. DEPLOYMENT_PIPELINE_GUIDE.md 읽기
2. scripts/setup-deployment.sh 실행
3. GitHub Secrets 설정
4. eas.json 수정
5. 첫 빌드: eas build --platform all --profile production
6. 테스트
7. 스토어 제출: npm run submit:ios && npm run submit:android
```

### 시나리오 2: CI/CD 자동화 구축

```
1. DEPLOYMENT_PIPELINE_GUIDE.md의 "GitHub Actions" 섹션
2. .github/workflows/ 파일들 확인
3. GitHub Secrets 설정
4. main 브랜치에 푸시하여 테스트
```

### 시나리오 3: 빠른 버그 수정 배포

```
1. QUICK_DEPLOYMENT_GUIDE.md의 "JavaScript 업데이트" 섹션
2. eas update --branch production
```

### 시나리오 4: Web 배포

```
1. DEPLOYMENT_PIPELINE_GUIDE.md의 "Web 배포" 섹션
2. npm run export:web
3. Vercel/Netlify에 배포
```

---

## ⚙️ 배포 스크립트 (package.json)

| 스크립트     | 명령어                   | 설명                  |
| ------------ | ------------------------ | --------------------- |
| Android 빌드 | `npm run build:android`  | Android 프로덕션 빌드 |
| iOS 빌드     | `npm run build:ios`      | iOS 프로덕션 빌드     |
| 전체 빌드    | `npm run build:all`      | 모든 플랫폼 빌드      |
| 미리보기     | `npm run build:preview`  | 테스트 빌드           |
| OTA 업데이트 | `npm run update`         | 프로덕션 업데이트     |
| iOS 제출     | `npm run submit:ios`     | App Store 제출        |
| Android 제출 | `npm run submit:android` | Play Store 제출       |
| Web 내보내기 | `npm run export:web`     | Web 빌드              |

---

## 🔗 외부 리소스

- [Expo 공식 문서](https://docs.expo.dev/)
- [EAS Build 가이드](https://docs.expo.dev/build/introduction/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Apple App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console/)

---

## ❓ 자주 묻는 질문

**Q: 무료로 시작할 수 있나요?**
A: 네! EAS 무료 플랜과 GitHub Actions(퍼블릭 리포)로 충분히 시작 가능합니다.

**Q: iOS 빌드에 Mac이 필요한가요?**
A: EAS Build를 사용하면 불필요합니다. 클라우드에서 빌드됩니다.

**Q: 배포 시간은 얼마나 걸리나요?**
A: 일반적으로 10-30분입니다. 빌드 큐 상태에 따라 달라질 수 있습니다.

**Q: CI/CD 설정이 복잡한가요?**
A: 처음 설정은 30분 정도 걸리지만, 이후 자동화되어 매우 편리합니다.

**Q: OTA 업데이트는 언제 사용하나요?**
A: JavaScript 코드 변경 시만 사용 가능합니다. 네이티브 변경은 앱 재배포 필요.

---

## 📝 체크리스트

배포 전 확인:

### 공통

- [ ] 버전 번호 업데이트
- [ ] 환경 변수 설정 완료
- [ ] 로컬 테스트 통과

### iOS

- [ ] Bundle ID 설정
- [ ] 인증서 유효
- [ ] App Store Connect 설정

### Android

- [ ] Package name 설정
- [ ] 키스토어 백업
- [ ] Play Console 설정

### Web

- [ ] 도메인 설정
- [ ] CDN 설정
- [ ] 환경 변수 배포

---

## 🎉 성공적인 배포!

문제가 있으시면:

1. DEPLOYMENT_PIPELINE_GUIDE.md의 문제 해결 섹션
2. Expo 공식 문서
3. GitHub Issues

**행운을 빕니다! 🚀**
