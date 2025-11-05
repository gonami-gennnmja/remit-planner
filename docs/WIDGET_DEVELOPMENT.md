# 위젯 개발 가이드

## Expo Go 제한사항

**Expo Go에서는 위젯을 테스트할 수 없습니다.** 위젯은 네이티브 코드가 필요한 기능이므로 개발 빌드(Expo Dev Client)를 사용해야 합니다.

## 위젯 개발을 위한 설정

### 1. 개발 빌드 생성

위젯을 테스트하려면 먼저 개발 빌드를 생성해야 합니다:

```bash
# Android 개발 빌드
eas build --platform android --profile development

# iOS 개발 빌드 (Apple Developer 계정 필요)
eas build --platform ios --profile development
```

### 2. 개발 빌드 설치

빌드가 완료되면:

- Android: APK 파일을 다운로드하여 기기에 설치
- iOS: TestFlight 또는 직접 설치

### 3. 개발 빌드로 실행

```bash
# 개발 서버 시작
expo start --dev-client
```

개발 빌드 앱을 열면 Expo Go 대신 커스텀 개발 클라이언트가 실행됩니다.

## 위젯 구현 방법

### iOS 위젯 (WidgetKit)

iOS 위젯은 네이티브 Swift 코드로 작성해야 합니다. Expo Config Plugin을 사용하여 설정할 수 있습니다.

#### 필요한 패키지

- 직접 네이티브 코드 작성 필요
- 또는 `expo-build-properties`로 네이티브 설정 관리

#### 설정 방법

1. `app.json`에 플러그인 추가:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "14.0"
          }
        }
      ]
    ]
  }
}
```

2. 위젯 확장 프로젝트 생성:
   - Xcode에서 프로젝트 열기 (`npx expo prebuild`)
   - File > New > Target > Widget Extension 추가

### Android 위젯 (App Widgets)

Android 위젯도 네이티브 코드(Kotlin/Java)가 필요합니다.

#### 설정 방법

1. `app.json`에 플러그인 추가:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 34,
            "targetSdkVersion": 34
          }
        }
      ]
    ]
  }
}
```

2. 위젯 클래스 생성:
   - `npx expo prebuild` 실행
   - Android Studio에서 위젯 프로바이더 클래스 작성

## 위젯 개발 워크플로우

1. **프로젝트 설정**

   ```bash
   npx expo install expo-build-properties
   ```

2. **네이티브 코드 추가**

   ```bash
   npx expo prebuild
   ```

   이 명령어로 네이티브 프로젝트가 생성됩니다.

3. **위젯 코드 작성**

   - iOS: `ios/YourApp/Widget/` 폴더에 Swift 코드
   - Android: `android/app/src/main/java/` 에 Kotlin/Java 코드

4. **개발 빌드 생성 및 테스트**

   ```bash
   eas build --platform android --profile development
   eas build --platform ios --profile development
   ```

5. **개발 서버 실행**
   ```bash
   expo start --dev-client
   ```

## 데이터 공유

위젯과 메인 앱 간 데이터 공유 방법:

### iOS

- App Groups 사용
- UserDefaults 또는 Core Data with App Groups

### Android

- SharedPreferences
- ContentProvider
- Room Database (앱과 위젯이 같은 데이터베이스 접근)

## Expo Module로 위젯 래핑

위젯을 Expo Module로 만들어서 재사용 가능하게 만들 수 있습니다:

```bash
npx create-expo-module --local expo-widget
```

## 참고 자료

- [Expo Development Build](https://docs.expo.dev/development/introduction/)
- [iOS WidgetKit](https://developer.apple.com/documentation/widgetkit)
- [Android App Widgets](https://developer.android.com/develop/ui/views/appwidgets)
- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)

## 주의사항

⚠️ **위젯 개발은 네이티브 코드 작성이 필요합니다.**

- Swift (iOS) 또는 Kotlin/Java (Android) 지식이 필요합니다.
- 각 플랫폼의 위젯 API를 이해해야 합니다.
- Expo Go를 사용할 수 없으므로 개발 빌드를 빌드하고 설치하는 과정이 필요합니다.

