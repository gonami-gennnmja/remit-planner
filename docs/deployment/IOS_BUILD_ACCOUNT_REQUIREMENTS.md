# 📱 iOS 빌드 계정 요구사항

## ❓ iOS 앱 파일(.ipa) 만들 때도 개발자 계정 필요한가요?

**네, 완전히 필요합니다!** 🚨

iOS는 안드로이드와 달리 **100% 애플의 제어** 하에 있습니다.

---

## 📊 플랫폼별 계정 요구사항

| 빌드 유형     | Android   | iOS     |
| ------------- | --------- | ------- |
| Preview 빌드  | ❌ 불필요 | ✅ 필요 |
| 프로덕션 빌드 | ❌ 불필요 | ✅ 필요 |
| 스토어 제출   | ❌ 불필요 | ✅ 필요 |
| 빌드만 하기   | ❌ 불필요 | ✅ 필요 |

**iOS는 어떤 빌드든 개발자 계정 필수입니다!**

---

## 🔒 왜 iOS는 무조건 개발자 계정이 필요한가?

### Apple의 정책

1. **코드 사이닝 필수**

   - iOS는 모든 앱이 Apple에서 발급한 인증서로 서명되어야 함
   - 인증서 발급은 개발자 계정 필요

2. **증명서(Provisioning Profile) 필요**

   - 어떤 디바이스에 설치할 수 있는지 정의
   - 개발자 계정에서 발급

3. **보안 정책**
   - "Unknown Developer" 앱 설치 막음
   - 공식 인증된 앱만 허용

---

## 💰 개발자 계정 비용

### Apple Developer Program

- **가격**: $99/년 (미화 기준)
- **지역별 차이**: 국가마다 약간 다름
- **결제 방식**: 연간 구독, 자동 갱신

---

## ✅ iOS 앱을 만드는 방법들

### 방법 1: Expo Go 사용 (무료!) ⭐

**가장 쉽고 빠른 방법**

```bash
# 개발 서버 실행
npm start

# QR 코드 스캔
```

**장점:**

- ✅ 무료
- ✅ 개발자 계정 불필요
- ✅ 즉시 실행 가능
- ✅ 실시간 리로드

**단점:**

- ❌ Expo Go로만 실행 가능
- ❌ 독립 앱 파일(.ipa) 생성 불가
- ❌ 일부 네이티브 기능 제한

---

### 방법 2: iOS Simulator (Mac 필요, 무료)

**Mac 사용자만 가능**

```bash
# iOS 시뮬레이터 실행
npm run ios
```

**장점:**

- ✅ 무료
- ✅ 개발자 계정 불필요
- ✅ Mac 내에서 테스트

**단점:**

- ❌ Mac 필수
- ❌ 실제 디바이스에서 테스트 불가
- ❌ 독립 앱 파일(.ipa) 생성 불가

---

### 방법 3: Apple Developer Program 가입 ($99/년)

**유일하게 독립 앱 파일 만들 수 있는 방법**

```bash
# iOS 빌드
eas build --platform ios --profile preview
```

**장점:**

- ✅ 독립 앱 파일(.ipa) 생성 가능
- ✅ 실제 iPhone에 설치 가능
- ✅ TestFlight 배포 가능
- ✅ App Store 제출 가능

**단점:**

- ❌ $99/년 비용
- ❌ 결제 필수
- ❌ 연간 갱신 필요

---

## 🎯 추천 방법

### 지금 바로 테스트하고 싶다면

**1순위: Expo Go 사용**

```bash
npm start
# QR 코드 스캔하여 Expo Go 앱으로 실행
```

**2순위: Android APK 빌드**

```bash
eas build --platform android --profile preview
# 무료, 계정 불필요, 독립 앱 파일 생성 가능
```

### 나중에 실제 배포하고 싶다면

**Apple Developer Program 가입**

- App Store에 제출하려면 필수
- 사용자들이 iPhone에 설치하려면 필수

---

## 💡 대안 전략

### 단기: Android로 테스트

```bash
# Android APK 빌드 (무료, 계정 불필요)
eas build --platform android --profile preview

# 테스트 완료 후 기능 개선
```

### 중기: iOS는 나중에

- Android로 먼저 출시
- 사용자 피드백 수집
- 수익 확인
- 그 다음 iOS 버전 개발

### 장기: 양쪽 모두 지원

- Android 성공 후
- iOS 개발자 계정 결제
- 양쪽 플랫폼 모두 배포

---

## 📝 결론

### iOS 독립 앱 파일(.ipa) 만들기

**❌ 무료 방법 없음**
**❌ 개발자 계정 없이 불가능**
**✅ Apple Developer Program ($99/년) 필수**

### 대안

**✅ Expo Go**: 무료, 즉시 실행 가능
**✅ Android APK**: 무료, 독립 앱 파일 가능
**✅ iOS Simulator**: Mac 사용자, 무료

---

## 🚀 지금 추천하는 방법

### 1단계: Android로 시작

```bash
# Android 테스트 빌드
eas build --platform android --profile preview
```

### 2단계: 테스트 및 개선

- 휴대폰에서 APK 다운로드
- 모든 기능 테스트
- 버그 수정

### 3단계: 성공 후 iOS 추가

- Android 출시
- 사용자 확인
- 수익 발생
- 그때 iOS 개발자 계정 결제
- iOS 버전 배포

---

**요약**: iOS는 $99/년 없이는 독립 앱 파일 만들 수 없습니다.
하지만 Android는 무료로 가능하며, Expo Go는 무료로 바로 테스트 가능합니다! ✅
