# 배포 파이프라인 가이드

> 반반(Half&Half) 앱의 효율적인 배포를 위한 완전한 가이드

## 📋 목차

1. [배포 전략 비교](#배포-전략-비교)
2. [권장 배포 방식](#권장-배포-방식)
3. [상세 설정 가이드](#상세-설정-가이드)
4. [GitHub Actions CI/CD](#github-actions-cicd)
5. [수동 배포 절차](#수동-배포-절차)
6. [환경별 설정](#환경별-설정)

---

## 📊 배포 전략 비교

### 1. **EAS Build (Expo Application Services)** ⭐ **권장**

**장점:**

- Expo 공식 클라우드 빌드 서비스
- iOS와 Android를 클라우드에서 자동 빌드
- 코드 사이닝 자동 관리
- OTA(Over-The-Air) 업데이트 지원
- GitHub Actions와 연동 가능
- 무료 플랜 사용 가능

**단점:**

- 무료 플랜은 빌드 시간 제한
- 프리미엄 플랜은 월 구독 비용 ($29/월 이상)

**적합한 프로젝트:**

- ✅ 중소규모 프로젝트
- ✅ 빠른 MVP 출시
- ✅ 팀 규모가 작고 DevOps 전문가가 없는 경우
- ✅ 우리 프로젝트에 **최적**

---

### 2. **GitHub Actions CI/CD**

**장점:**

- GitHub과 완벽 통합
- 무료 퍼블릭 리포지토리
- 커스텀 가능한 워크플로우
- 다양한 도구와 연동 가능
- 로컬 Mac 없이도 iOS 빌드 가능

**단점:**

- 초기 설정 복잡
- 무료 플랜은 시간 제한 (2,000분/월)
- macOS 러너 비용 ($0.08/분)

**적합한 프로젝트:**

- ✅ 오픈소스 프로젝트
- ✅ 복잡한 CI/CD 요구사항
- ✅ 비용 최적화가 중요한 경우
- ✅ DevOps 경험이 있는 팀

---

### 3. **프리마 버전 (Fastlane + 로컬 빌드)**

**장점:**

- 완전한 제어권
- 무료 (자신의 Mac 필요)
- 커스터마이징 자유도 높음

**단점:**

- Mac 필수 (iOS 빌드)
- 초기 설정 매우 복잡
- 코드 사이닝 직접 관리
- CI/CD 구현 필요
- 많은 시간 투자

**적합한 프로젝트:**

- ✅ 기업급 프로젝트
- ✅ 특수한 빌드 요구사항
- ✅ DevOps 팀 보유

---

## ⭐ 권장 배포 방식

### **하이브리드 접근법**: EAS Build + GitHub Actions

우리 프로젝트는 다음 조합을 권장합니다:

```
1. EAS Build (초기 설정) → 빠른 프로덕션 빌드
2. GitHub Actions (확장) → 자동화된 CI/CD
3. OTA Updates (유지보수) → 빠른 버그 수정
```

**이유:**

- ✅ 빠른 시작: EAS로 즉시 빌드 시작 가능
- ✅ 자동화 확장: GitHub Actions로 CI/CD 구축
- ✅ 유연성: 필요에 따라 점진적 확장
- ✅ 비용 효율: 무료 플랜으로 시작 가능

---

## 🔧 상세 설정 가이드

### 단계 1: EAS Build 초기 설정

#### 1.1 EAS CLI 설치

```bash
npm install -g eas-cli
```

#### 1.2 EAS에 로그인

```bash
eas login
# Expo 계정으로 로그인하거나 새로 생성
```

#### 1.3 프로젝트 설정

```bash
# 프로젝트 루트에서 실행
eas build:configure
```

이 명령어는 `eas.json` 파일을 생성합니다.

#### 1.4 eas.json 파일 확인 및 수정

프로젝트 루트에 `eas.json` 파일이 생성되면 다음과 같이 수정하세요:

```json
{
  "cli": {
    "version": ">= 13.3.6"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "bundleIdentifier": "com.banban.halfhalf",
        "resourceClass": "m1-medium"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:bundleRelease"
      },
      "env": {
        "SUPABASE_URL": "YOUR_PRODUCTION_SUPABASE_URL",
        "SUPABASE_ANON_KEY": "YOUR_PRODUCTION_SUPABASE_ANON_KEY"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-id"
      },
      "android": {
        "serviceAccountKeyPath": "./path/to/api-key.json",
        "track": "internal"
      }
    }
  }
}
```

#### 1.5 환경 변수 설정

Expo Secrets를 사용하여 민감한 정보를 안전하게 관리:

```bash
# 프로덕션 환경 변수 등록
eas secret:create --scope project --name SUPABASE_URL --value your_production_url
eas secret:create --scope project --name SUPABASE_ANON_KEY --value your_production_key

# 등록된 시크릿 확인
eas secret:list
```

#### 1.6 첫 번째 빌드 실행

```bash
# Android 빌드 (테스트)
eas build --platform android --profile preview

# iOS 빌드 (테스트)
eas build --platform ios --profile preview

# 프로덕션 빌드
eas build --platform all --profile production
```

---

### 단계 2: GitHub Actions CI/CD 설정

#### 2.1 GitHub Actions 디렉토리 생성

```bash
mkdir -p .github/workflows
```

#### 2.2 iOS 빌드 워크플로우

`.github/workflows/build-ios.yml` 파일 생성:

```yaml
name: Build iOS

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    name: Build iOS
    runs-on: macos-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Run EAS Build iOS
        run: eas build --platform ios --non-interactive --no-wait
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

#### 2.3 Android 빌드 워크플로우

`.github/workflows/build-android.yml` 파일 생성:

```yaml
name: Build Android

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    name: Build Android
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Run EAS Build Android
        run: eas build --platform android --non-interactive --no-wait
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

#### 2.4 Web 배포 워크플로우

`.github/workflows/deploy-web.yml` 파일 생성:

```yaml
name: Deploy Web

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    name: Build and Deploy Web
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build Web
        run: npx expo export:web

      - name: Deploy to Netlify
        uses: netlify/actions/build@master
        with:
          publish-dir: "./web-build"
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

#### 2.5 GitHub Secrets 설정

GitHub 저장소 Settings > Secrets and variables > Actions에서 다음 시크릿 추가:

1. **EXPO_TOKEN**: `eas whoami` 실행 후 생성

   ```bash
   eas login
   eas whoami
   # 토큰은 https://expo.dev/accounts/[your-account]/settings/access-tokens 에서 생성
   ```

2. **NETLIFY_AUTH_TOKEN**: Netlify 계정 설정에서 가져오기

3. **NETLIFY_SITE_ID**: Netlify 프로젝트 설정에서 가져오기

---

### 단계 3: OTA (Over-The-Air) 업데이트 설정

코드 푸시를 통해 앱 재배포 없이 JavaScript 업데이트를 배포합니다.

#### 3.1 expo-updates 설치

```bash
npx expo install expo-updates
```

#### 3.2 app.json에 업데이트 설정 추가

```json
{
  "expo": {
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/[your-project-id]",
      "requestHeaders": {
        "expo-channel-name": "production"
      }
    }
  }
}
```

#### 3.3 업데이트 배포

```bash
# 프로덕션 업데이트 배포
eas update --branch production --message "버그 수정 및 성능 개선"

# 개발 업데이트 배포
eas update --branch development --message "새로운 기능 추가"
```

---

### 단계 4: 스토어 제출 자동화

#### 4.1 App Store Connect 설정

```bash
# eas.json에 이미 설정됨

# iOS 앱 스토어 제출
eas submit --platform ios --latest

# Android Play Store 제출
eas submit --platform android --latest
```

#### 4.2 자동 제출 워크플로우

`.github/workflows/submit-to-stores.yml` 파일 생성:

```yaml
name: Submit to Stores

on:
  workflow_dispatch:
    inputs:
      platform:
        description: "Platform to submit"
        required: true
        type: choice
        options:
          - ios
          - android
          - all

jobs:
  submit:
    name: Submit to Stores
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Submit to Stores
        run: eas submit --platform ${{ github.event.inputs.platform }} --latest --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## 🧪 수동 배포 절차

긴급 상황이나 테스트를 위한 수동 배포 방법:

### 개발 빌드

```bash
# Android APK 생성
eas build --platform android --profile preview

# iOS Simulator 빌드
eas build --platform ios --profile preview
```

### 프로덕션 빌드

```bash
# 전체 플랫폼
eas build --platform all --profile production

# 특정 플랫폼만
eas build --platform android --profile production
eas build --platform ios --profile production
```

### Web 배포

```bash
# 빌드
npx expo export:web

# 로컬 테스트
npx serve web-build

# Netlify CLI로 배포
netlify deploy --prod --dir=web-build
```

---

## 🌍 환경별 설정

### 개발 환경 (Development)

- **목적**: 개발자 로컬 테스트
- **빌드 프로필**: `development`
- **배포**: EAS Development Build
- **사용**: QR 코드 스캔 또는 로컬 빌드

### 스테이징 환경 (Preview)

- **목적**: 베타 테스터 및 QA
- **빌드 프로필**: `preview`
- **배포**: EAS Internal Distribution
- **사용**: TestFlight (iOS) / Internal Testing (Android)

### 프로덕션 환경 (Production)

- **목적**: 실사용자 서비스
- **빌드 프로필**: `production`
- **배포**: App Store / Play Store
- **사용**: 공식 앱스토어

---

## 📊 배포 체크리스트

### 빌드 전 확인사항

- [ ] `app.json`의 버전 번호 증가
- [ ] 모든 환경 변수가 정확히 설정됨
- [ ] Supabase 프로덕션 데이터베이스 사용
- [ ] 코드 사이닝 인증서가 유효함
- [ ] `.gitignore`에 민감한 정보가 포함되지 않음

### 테스트 체크리스트

- [ ] 로그인/회원가입 기능 정상
- [ ] 모든 주요 기능 동작 확인
- [ ] iOS/Android 둘 다 테스트
- [ ] 다양한 디바이스 크기 테스트
- [ ] 다크 모드/라이트 모드 테스트
- [ ] 오프라인 모드 테스트 (가능한 경우)

### 제출 전 확인사항

- [ ] 앱 아이콘 및 스플래시 설정 완료
- [ ] 이용약관 및 개인정보처리방침 링크 활성
- [ ] 스크린샷이 최신 버전
- [ ] 앱 설명이 정확함
- [ ] 개인정보 수집 정책 준수

---

## 🔒 보안 고려사항

### 환경 변수

```bash
# .env 파일 사용 (로컬 개발용)
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key

# EAS Secrets 사용 (프로덕션)
eas secret:create --scope project --name SUPABASE_URL --value your_url
```

### API 키 관리

- ✅ Supabase Anon Key는 `EXPO_PUBLIC_` 접두사로 클라이언트 노출 OK
- ❌ Service Role Key는 절대 클라이언트에 노출 금지
- ✅ RLS 정책으로 데이터 접근 제어
- ✅ 모든 API 요청에 인증 토큰 포함

---

## 💰 비용 예상

### EAS Build

- **무료 플랜**: 월 30분 빌드 시간
- **프리미엄 플랜**: $29/월 (300분)
- **빌드 시간**: 앱당 10-30분 소요

### GitHub Actions

- **무료**: 2,000분/월 (퍼블릭 리포)
- **$21/월**: 3,000분 추가
- **macOS 러너**: $0.08/분

### Web 호스팅 (Netlify/Vercel)

- **무료**: 충분함
- **프로 플랜**: $19/월 (고급 기능)

**예상 월 비용: $0 - $29** (프로젝트 규모에 따라)

---

## 🚀 빠른 시작 스크립트

### 전체 설정 자동화

프로젝트 루트에 `setup-deployment.sh` 파일 생성:

```bash
#!/bin/bash

echo "🚀 배포 파이프라인 설정 시작..."

# 1. EAS CLI 설치 확인
if ! command -v eas &> /dev/null; then
    echo "📦 EAS CLI 설치 중..."
    npm install -g eas-cli
fi

# 2. EAS 로그인 확인
echo "🔐 EAS 로그인 필요..."
eas login

# 3. 프로젝트 설정
echo "⚙️ EAS 프로젝트 설정..."
eas build:configure

# 4. GitHub Actions 설정
echo "🔧 GitHub Actions 워크플로우 생성..."
mkdir -p .github/workflows

echo "✅ 설정 완료!"
echo "📝 다음 단계:"
echo "   1. eas.json 파일 확인 및 수정"
echo "   2. GitHub Secrets 설정"
echo "   3. eas build --platform android --profile preview 실행"
```

실행:

```bash
chmod +x setup-deployment.sh
./setup-deployment.sh
```

---

## 📚 참고 자료

- [EAS Build 공식 문서](https://docs.expo.dev/build/introduction/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Expo Updates 문서](https://docs.expo.dev/eas-updates/introduction/)
- [Netlify 배포 가이드](https://docs.netlify.com/integrations/github/)
- [App Store Connect 가이드](https://developer.apple.com/documentation/appstoreconnectapi)

---

## ❓ 자주 묻는 질문 (FAQ)

### Q1: 무료 플랜으로 충분한가요?

**A**: 초기 단계에서는 충분합니다. 프로젝트가 성장하면 프리미엄 플랜 고려.

### Q2: iOS 빌드에 Mac이 필요한가요?

**A**: EAS Build를 사용하면 불필요합니다. 클라우드에서 빌드됩니다.

### Q3: Web 배포는 필수인가요?

**A**: 아니요, 선택사항입니다. 모바일 전용이라면 Web 빌드는 생략 가능.

### Q4: OTA 업데이트는 어떻게 작동하나요?

**A**: JavaScript 코드만 변경 시 앱 재배포 없이 즉시 업데이트 가능. 네이티브 변경은 불가.

### Q5: 빌드 실패 시 어떻게 하나요?

**A**: EAS 빌드 로그 확인 → 로컬에서 `eas build:configure` 재실행 → GitHub Issues 검색

---

## 🎯 다음 단계

1. ✅ 이 가이드대로 EAS Build 설정
2. ✅ 첫 번째 테스트 빌드 실행
3. ✅ GitHub Actions 워크플로우 추가
4. ✅ 스테이징 환경 배포
5. ✅ 프로덕션 배포

**성공적인 배포를 응원합니다! 🎉**
