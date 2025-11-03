# 🔧 빌드 문제 해결 가이드

Android 빌드 실패 시 대처 방법입니다.

## ❗ 자주 발생하는 빌드 오류

### 1. Gradle Build Failed

**증상:**

```
Build failed
🤖 Android build failed:
Gradle build failed with unknown error.
```

**원인:**

- React Native Firebase 같은 네이티브 모듈 미설정
- 의존성 충돌
- Gradle 설정 문제

**해결:**

#### 1.1 불필요한 Firebase 제거

```bash
# package.json에서 Firebase 패키지 제거
npm uninstall @react-native-firebase/app @react-native-firebase/messaging

# firebase.json 파일 삭제
```

#### 1.2 노드 모듈 재설치

```bash
# 완전 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

#### 1.3 Expo 캐시 클리어

```bash
npx expo start --clear
```

---

### 2. appVersionSource 경고

**증상:**

```
The field "cli.appVersionSource" is not set, but it will be required in the future.
```

**해결:**

`eas.json`에 추가:

```json
{
  "cli": {
    "version": ">= 7.11.0",
    "appVersionSource": "remote"
  }
}
```

---

### 3. 환경 변수 누락

**증상:**

```
No environment variables found for the "preview" environment.
```

**해결:**

```bash
# EAS Secrets에 환경 변수 추가
eas secret:create --scope project --name SUPABASE_URL --value your_url
eas secret:create --scope project --name SUPABASE_ANON_KEY --value your_key
```

---

### 4. Bundle Identifier 중복

**증상:**

```
Bundle identifier is already in use
```

**해결:**

`app.json`의 Bundle ID를 고유 값으로 변경:

```json
{
  "ios": {
    "bundleIdentifier": "com.yourcompany.yourapp"
  },
  "android": {
    "package": "com.yourcompany.yourapp"
  }
}
```

---

### 5. 키스토어 문제

**증상:**

```
Keystore generation failed
```

**해결:**

- EAS가 자동으로 생성하므로 대부분 문제 없음
- 로컬 키스토어가 있다면 삭제 후 재생성:

```bash
eas credentials
```

---

## 🔍 빌드 로그 확인

빌드 실패 시:

1. EAS 대시보드에서 로그 확인

   - https://expo.dev/accounts/[your-account]/projects/banban-halfhalf/builds

2. 특정 단계 확인
   - "Compress and upload" - 파일 업로드 문제
   - "Install dependencies" - 의존성 문제
   - "Run gradlew" - Gradle 빌드 문제
   - "Archive and upload" - 아카이브 문제

---

## ✅ 빌드 전 체크리스트

- [ ] `app.json`에 bundleIdentifier와 package 설정됨
- [ ] Android versionCode 추가됨
- [ ] iOS bundleIdentifier 추가됨
- [ ] `eas.json`에 appVersionSource 설정됨
- [ ] Firebase 패키지 제거됨 (사용하지 않는 경우)
- [ ] `npm install` 성공
- [ ] TypeScript 오류 없음 (`npx tsc --noEmit`)

---

## 🚀 깨끗한 빌드

```bash
# 1. 완전히 정리
rm -rf node_modules package-lock.json
rm -rf .expo
rm -rf web-build

# 2. 재설치
npm install

# 3. 타입 체크
npx tsc --noEmit

# 4. 캐시 클리어
npx expo start --clear

# 5. 빌드
eas build --platform android --profile preview --clear-cache
```

---

## 📚 추가 리소스

- [EAS Build 문서](https://docs.expo.dev/build/introduction/)
- [빌드 오류 해결](https://docs.expo.dev/build/troubleshooting/)
- [GitHub Issues](https://github.com/expo/fyi/issues)

---

**요약**: Firebase 제거 후 `npm install` 재실행!

---

## 🆘 긴급: Gradle 빌드 계속 실패 시

### EAS 로그 확인 필수!

빌드 실패 시 **무조건** EAS 대시보드에서 로그를 확인하세요:

1. 터미널에 나온 빌드 URL 클릭
2. "Run gradlew" 단계 클릭
3. 실제 오류 메시지 확인
4. 오류 메시지를 Google에 검색

**공통 해결책**:

#### React Native Worklets 제거 (필요시)

```bash
npm uninstall react-native-worklets
```

#### Gradle 버전 문제

`android/build.gradle` 파일이 없다면 Expo가 자동 관리합니다.
`eas.json`에 추가:

```json
{
  "build": {
    "preview": {
      "android": {
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

#### 의존성 충돌

```bash
npx expo-doctor
```

**주의**: `react-native-calendars`의 하위 의존성 중복은 대부분 무시해도 됩니다.

#### 최후의 수단: 깨끗한 빌드

```bash
# 모든 것을 삭제
Remove-Item -Recurse -Force node_modules,package-lock.json,.expo -ErrorAction SilentlyContinue

# 재설치
npm install

# 빌드
eas build --platform android --profile preview --clear-cache
```
