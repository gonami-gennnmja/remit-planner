# ✅ 배포 체크리스트 - 내가 해야 할 일

## 🎉 자동으로 완료된 것들

### ✅ 생성된 파일들

- [x] `eas.json` - EAS Build 설정 파일
- [x] `.github/workflows/ci.yml` - CI 자동화
- [x] `.github/workflows/build-android.yml` - Android 자동 빌드
- [x] `.github/workflows/build-ios.yml` - iOS 자동 빌드
- [x] `.github/workflows/deploy-web.yml` - Web 자동 배포
- [x] `.github/workflows/submit-to-stores.yml` - 스토어 자동 제출
- [x] `setup-deployment.ps1` / `setup-deployment.sh` - 자동 설정 스크립트

### ✅ 완성된 문서들

- [x] `docs/DEPLOYMENT_PIPELINE_GUIDE.md` - 전체 가이드 (700줄+)
- [x] `docs/QUICK_DEPLOYMENT_GUIDE.md` - 빠른 참조 가이드
- [x] `docs/deployment/README.md` - 배포 문서 개요

### ✅ 자동화된 스크립트

- [x] `package.json`에 배포 명령어 추가
  - `npm run build:android`
  - `npm run build:ios`
  - `npm run build:all`
  - `npm run update` (OTA)
  - 기타...

---

## 🔴 내가 직접 해야 할 것들

### 1단계: 파일 커밋 (즉시 해야 함)

```bash
# 모든 파일 확인
git status

# 스테이징
git add .

# 커밋
git commit -m "Add deployment pipeline: EAS Build + GitHub Actions"

# 푸시
git push origin main
```

**⏰ 소요 시간:** 2분

---

### 2단계: EAS 계정 설정

#### 2.1 EAS CLI 설치 및 로그인

```bash
# EAS CLI 설치
npm install -g eas-cli

# 로그인 (Expo 계정 필요)
eas login
```

#### 2.2 프로젝트 설정

```bash
# 프로젝트 연동
eas build:configure
```

이 명령어는 프로젝트를 Expo EAS에 연결합니다.

**⏰ 소요 시간:** 5분

---

### 3단계: GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions에서:

#### 필수 Secret 추가:

1. **EXPO_TOKEN**

   - https://expo.dev/accounts/[your-account]/settings/access-tokens 접속
   - "Create Token" 클릭
   - 토큰 복사 후 GitHub Secrets에 `EXPO_TOKEN`으로 추가

2. **VERCEL_TOKEN** (Web 배포 시)
   - Vercel → Settings → Tokens
   - `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`도 함께 설정

**⏰ 소요 시간:** 5분

---

### 4단계: 환경 변수 설정

#### 4.1 EAS Secrets 설정

```bash
# 프로덕션 환경 변수 등록
eas secret:create --scope project --name SUPABASE_URL --value YOUR_ACTUAL_URL
eas secret:create --scope project --name SUPABASE_ANON_KEY --value YOUR_ACTUAL_KEY
```

#### 4.2 eas.json 수정

`eas.json` 파일을 열어서:

```json
{
  "build": {
    "production": {
      "ios": {
        "bundleIdentifier": "com.banban.halfhalf" // ✅ 실제 번들 ID로 변경
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com", // ✅ 실제 Apple ID로 변경
        "ascAppId": "1234567890" // ✅ 실제 App Store Connect ID로 변경
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json", // ✅ 경로 확인
        "track": "internal" // 또는 "production"
      }
    }
  }
}
```

**⏰ 소요 시간:** 10분

---

### 5단계: 첫 번째 빌드 테스트

#### 5.1 Preview 빌드 (테스트)

```bash
# Android 테스트 빌드
eas build --platform android --profile preview

# 빌드 완료까지 대기 (10-30분)
# EAS 대시보드: https://expo.dev/accounts/[your-account]/projects/banban-halfhalf/builds
```

#### 5.2 빌드 다운로드 및 테스트

- 빌드 완료 후 QR 코드 스캔 또는 직접 다운로드
- 앱 실행 테스트
- 모든 기능 확인

**⏰ 소요 시간:** 30분 (빌드 시간 포함)

---

### 6단계: 프로덕션 빌드 및 배포

#### 6.1 버전 확인

`app.json`의 버전 확인:

```json
{
  "expo": {
    "version": "1.0.0" // ✅ 필요시 증가
  }
}
```

#### 6.2 프로덕션 빌드

```bash
# 전체 플랫폼 빌드
npm run build:all

# 또는 개별
npm run build:android
npm run build:ios
```

**⏰ 소요 시간:** 1-2시간 (빌드 + 스토어 심사)

#### 6.3 스토어 제출

```bash
# iOS App Store
npm run submit:ios

# Android Play Store
npm run submit:android
```

---

### 7단계: GitHub Actions 테스트 (선택사항)

main 브랜치에 푸시하면 자동으로 빌드가 시작됩니다:

```bash
# 간단한 테스트 커밋
echo "# Test deployment" >> README.md
git add README.md
git commit -m "Test: trigger CI/CD"
git push origin main
```

GitHub Actions 탭에서 빌드 진행 상황 확인:
https://github.com/[your-username]/remit-planner/actions

---

## 📝 체크리스트 요약

### 즉시 해야 할 것 (오늘)

- [ ] 파일 커밋 및 푸시
- [ ] EAS CLI 설치 및 로그인
- [ ] `eas build:configure` 실행
- [ ] GitHub Secrets 설정 (EXPO_TOKEN)

### 이번 주 내에

- [ ] EAS Secrets 설정 (환경 변수)
- [ ] `eas.json` 파일 수정 (Bundle ID, Apple ID 등)
- [ ] 첫 번째 Preview 빌드 실행
- [ ] 빌드 테스트

### 배포 준비 완료 시

- [ ] `app.json` 버전 업데이트
- [ ] 프로덕션 빌드 실행
- [ ] 스토어 제출
- [ ] 심사 대기 및 승인

### 선택사항

- [ ] GitHub Actions 자동 빌드 테스트
- [ ] OTA 업데이트 설정
- [ ] Web 배포 설정 (Vercel)

---

## 🚨 주의사항

### ❌ 하지 말아야 할 것들

1. **민감한 정보 노출**

   - `.env` 파일을 GitHub에 커밋하지 마세요
   - 이미 `.gitignore`에 추가되어 있음

2. **무작정 프로덕션 빌드**

   - 반드시 Preview 빌드로 먼저 테스트하세요

3. **환경 변수 하드코딩**
   - `eas.json`에 실제 키를 넣지 마세요
   - EAS Secrets 사용

### ✅ 확인할 것들

1. **코드 사이닝**

   - iOS: Apple Developer 계정 필요 ($99/년)
   - Android: Google Play Console 필요 ($25 일회성)

2. **스토어 계정**

   - Apple App Store Connect 설정
   - Google Play Console 설정

3. **백엔드 준비**
   - Supabase 프로덕션 환경 설정
   - 데이터베이스 마이그레이션 완료

---

## 📚 도움말

문제가 생기면 다음 문서를 참고하세요:

1. **빠른 참조**: `docs/QUICK_DEPLOYMENT_GUIDE.md`
2. **전체 가이드**: `docs/DEPLOYMENT_PIPELINE_GUIDE.md`
3. **상황별 가이드**: `docs/deployment/README.md`

---

## 💡 팁

### 비용 절감하기

- ✅ 무료 플랜으로 시작 (EAS + GitHub Actions)
- ✅ Preview 빌드로 먼저 테스트
- ✅ OTA 업데이트 활용 (빌드 시간 절약)

### 빠른 시작

```bash
# 모든 단계를 한 번에
./setup-deployment.sh  # 또는 .ps1

# 그 다음
eas build --platform android --profile preview
```

---

**시간 예상:**

- 최소 설정: **20분** (커밋 + EAS 설정)
- 첫 번째 빌드까지: **30-60분** (빌드 시간 포함)
- 스토어 배포까지: **2-3시간** (심사 제외)

**성공적인 배포를 응원합니다! 🎉**
