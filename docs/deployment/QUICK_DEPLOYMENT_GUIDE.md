# 🚀 빠른 배포 가이드

> 5분 안에 배포를 시작하세요!

## ⚡ 빠른 시작

### 1단계: EAS CLI 설치 및 로그인

```bash
# EAS CLI 설치
npm install -g eas-cli

# 로그인
eas login
```

### 2단계: 프로젝트 설정

**macOS/Linux:**

```bash
chmod +x setup-deployment.sh
./setup-deployment.sh
```

**Windows:**

```powershell
.\setup-deployment.ps1
```

### 3단계: 첫 번째 빌드

```bash
# Android 테스트 빌드
eas build --platform android --profile preview

# 또는 프로덕션 빌드
eas build --platform all --profile production
```

---

## 📦 주요 배포 명령어

### 빌드

| 명령어                  | 설명                  |
| ----------------------- | --------------------- |
| `npm run build:android` | Android 프로덕션 빌드 |
| `npm run build:ios`     | iOS 프로덕션 빌드     |
| `npm run build:all`     | 전체 플랫폼 빌드      |
| `npm run build:preview` | 미리보기 빌드         |

### 업데이트

| 명령어                                         | 설명                  |
| ---------------------------------------------- | --------------------- |
| `npm run update`                               | 프로덕션 OTA 업데이트 |
| `eas update --branch dev --message "업데이트"` | 개발 브랜치 업데이트  |

### 스토어 제출

| 명령어                   | 설명                    |
| ------------------------ | ----------------------- |
| `npm run submit:ios`     | iOS App Store 제출      |
| `npm run submit:android` | Android Play Store 제출 |

### Web 배포

| 명령어                | 설명          |
| --------------------- | ------------- |
| `npm run export:web`  | Web 빌드 생성 |
| `npx serve web-build` | 로컬 테스트   |

---

## 🔑 필수 설정 항목

### 1. GitHub Secrets

GitHub 저장소 Settings > Secrets > Actions에 추가:

- `EXPO_TOKEN`: Expo Access Token
- `VERCEL_TOKEN`: Vercel Token (Web 배포 시)
- `VERCEL_ORG_ID`: Vercel Organization ID
- `VERCEL_PROJECT_ID`: Vercel Project ID

### 2. EAS Secrets

```bash
# 환경 변수 설정
eas secret:create --scope project --name SUPABASE_URL --value your_url
eas secret:create --scope project --name SUPABASE_ANON_KEY --value your_key
```

### 3. eas.json 수정

```json
{
  "build": {
    "production": {
      "ios": {
        "bundleIdentifier": "com.banban.halfhalf" // 실제 값으로 변경
      }
    }
  }
}
```

---

## 🎯 일반적인 워크플로우

### 새 기능 추가 후 배포

```bash
# 1. 코드 수정 및 커밋
git add .
git commit -m "새 기능 추가"
git push origin main

# 2. GitHub Actions가 자동으로 빌드
# .github/workflows/build-android.yml
# .github/workflows/build-ios.yml

# 3. 빌드 완료 후 테스트
# EAS 대시보드에서 다운로드

# 4. 문제 없으면 스토어 제출
npm run submit:ios
npm run submit:android
```

### JavaScript 업데이트만 있는 경우

```bash
# OTA 업데이트 (앱 재배포 불필요)
npm run update
```

### 긴급 버그 수정

```bash
# 1. 버그 수정
git add .
git commit -m "긴급 버그 수정"
git push origin main

# 2. 빠른 OTA 업데이트
eas update --branch production --message "긴급 수정"

# 3. 또는 새 빌드
npm run build:all
```

---

## 🔍 빌드 상태 확인

### EAS 대시보드

```bash
# 브라우저에서 대시보드 열기
eas build:list
```

### 로컬 확인

```bash
# 빌드 상태 확인
eas build:list --platform all --limit 5
```

---

## 🐛 문제 해결

### 빌드 실패 시

```bash
# 1. 로그 확인
eas build:list --latest

# 2. 로컬에서 테스트
npm run android  # 또는 ios
npx expo start --clear

# 3. 환경 변수 확인
eas secret:list

# 4. 캐시 클리어
eas build --clear-cache
```

### 코드 사이닝 문제

```bash
# iOS 인증서 설정
eas credentials

# Android 키스토어 설정
eas credentials
```

---

## 📊 배포 체크리스트

배포 전 확인:

- [ ] 버전 번호 업데이트 (app.json)
- [ ] 환경 변수 설정 확인
- [ ] 로컬 테스트 완료
- [ ] Staging 환경 테스트 완료
- [ ] 변경 로그 작성
- [ ] 화면 스크린샷 최신화

---

## 📚 더 자세한 정보

전체 가이드는 **[DEPLOYMENT_PIPELINE_GUIDE.md](./DEPLOYMENT_PIPELINE_GUIDE.md)**를 참고하세요.

- 상세한 설정 방법
- GitHub Actions 커스터마이징
- OTA 업데이트 전략
- 멀티 환경 관리
- 비용 최적화 팁

---

## 🆘 도움이 필요하신가요?

1. [Expo 문서](https://docs.expo.dev/)
2. [EAS Build 문서](https://docs.expo.dev/build/introduction/)
3. [GitHub Issues](https://github.com/your-repo/issues)

**성공적인 배포를 응원합니다! 🎉**
