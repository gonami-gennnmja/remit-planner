# 🧪 개발자 계정 없이 테스트 빌드하기

Apple Developer 계정 결제 전에 앱을 빌드하고 테스트할 수 있습니다!

---

## ✅ 가능한 것들

### Preview 빌드 (무료!)

```bash
# Android APK 빌드
eas build --platform android --profile preview

# QR 코드 스캔으로 다운로드 가능
```

**이것만으로도 충분히 테스트 가능합니다!**

---

## ❌ 안 되는 것들

- iOS 앱스토어 제출
- TestFlight 배포
- 실제 iOS 디바이스에 설치 (개발자 계정 필요)

---

## 🚀 테스트 빌드 절차

### 1단계: Android Preview 빌드

```bash
eas build --platform android --profile preview
```

### 2단계: 빌드 완료 대기

- 10-30분 소요
- QR 코드 생성됨
- 다운로드 링크 제공

### 3단계: 다운로드 및 테스트

- 휴대폰에서 QR 코드 스캔
- APK 다운로드
- 설치 및 실행

---

## 📝 현재 설정 확인

현재 `eas.json`과 `app.json`은 이미 올바르게 설정되어 있습니다:

### eas.json ✅

```json
{
  "build": {
    "preview": {
      "distribution": "internal" // ← 테스트용 설정
    }
  }
}
```

### app.json ✅

```json
{
  "android": {
    "package": "com.banban.halfhalf" // ← 이미 설정됨
  }
}
```

---

## 🎯 지금 바로 빌드하기

```bash
# 1. EAS 로그인 (이미 했다면 생략)
eas login

# 2. Android 테스트 빌드
eas build --platform android --profile preview

# 3. 빌드 완료 후
# - QR 코드 스캔
# - 또는 링크 클릭해서 다운로드
```

---

## 💰 iOS 테스트는?

iOS는 Apple Developer 계정 **필수**입니다 ($99/년).

하지만 다음 방법들로 회피 가능:

### 방법 1: Android만 사용

- Android APK로 충분히 테스트 가능

### 방법 2: iOS Simulator

```bash
# 로컬에서 iOS 시뮬레이터 실행
npx expo run:ios

# 단, Mac 필요
```

### 방법 3: 나중에 Developer 계정 결제

- 지금은 Android로 테스트
- 나중에 iOS 버전 추가

---

## 🔄 submit 섹션은?

`eas.json`의 `submit` 섹션은 **나중에** 설정하면 됩니다:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-email@example.com", // ← Developer 계정 있을 때 설정
        "ascAppId": "1234567890" // ← 나중에
      },
      "android": {
        "serviceAccountKeyPath": "./api-key.json", // ← Play Store 계정 있을 때
        "track": "internal"
      }
    }
  }
}
```

**지금은 무시해도 됩니다!**

---

## ✅ 체크리스트

현재 단계에서 필요한 것:

- [ ] EAS 로그인 완료
- [ ] GitHub Secrets 설정 (EXPO_TOKEN)
- [x] eas.json 설정 완료
- [x] app.json 설정 완료
- [ ] Preview 빌드 실행

**불필요한 것**:

- [ ] Apple Developer 계정 (나중에)
- [ ] Play Store 계정 (나중에)
- [ ] eas.json의 submit 섹션 (나중에)

---

## 🎉 결론

**지금 바로 테스트 빌드 가능합니다!**

다음 명령어만 실행하면 됩니다:

```bash
eas build --platform android --profile preview
```

QR 코드를 스캔해서 다운로드하고 테스트하세요! 🚀

---

## 💡 나중에 Developer 계정 결제하면?

그때 추가 설정:

1. Apple Developer 계정 결제
2. `eas credentials` 명령어로 인증서 설정
3. `eas.json`의 submit 섹션 추가
4. 스토어 제출 가능

하지만 지금은 Android Preview로 충분히 테스트 가능합니다! ✅
