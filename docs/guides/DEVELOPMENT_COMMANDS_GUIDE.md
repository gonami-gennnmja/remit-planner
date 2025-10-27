# 개발 명령어 가이드

## 🚀 앱 실행하기

### 기본 실행 (개발 서버 시작)

```bash
npm start
```

이 명령어는 Expo 개발 서버를 시작하고 Metro Bundler를 실행합니다.

### 플랫폼별 실행

#### 1. 웹 브라우저에서 실행

```bash
npm run web
# 또는 터미널에서 'w' 키를 누르세요
```

#### 2. 안드로이드 에뮬레이터에서 실행

```bash
npm run android
# 또는 터미널에서 'a' 키를 누르세요
```

#### 3. iOS 시뮬레이터에서 실행 (Mac 전용)

```bash
npm run ios
# 또는 터미널에서 'i' 키를 누르세요
```

## 📱 디바이스에서 실행하기

### Expo Go 앱 사용 (권장)

1. **스마트폰에 Expo Go 설치**

   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS](https://apps.apple.com/app/expo-go/id982107779)

2. **개발 서버 실행**

   ```bash
   npm start
   ```

3. **QR 코드 스캔**
   - 터미널에 표시된 QR 코드를 Expo Go 앱으로 스캔
   - 또는 같은 네트워크(WiFi)에 연결되어 있다면 자동으로 감지됩니다

### 개발 빌드 사용 (고급)

Expo Go의 제한사항을 피하고 더 많은 네이티브 기능을 사용하려면:

```bash
npx expo prebuild
npx expo run:android  # 안드로이드
npx expo run:ios       # iOS
```

## ⚙️ 유용한 명령어

### 환경 변수 설정

```bash
# .env.local 또는 .env 파일 생성
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### 의존성 업데이트

```bash
# Expo SDK에 맞는 패키지 버전으로 업데이트
npx expo install --fix
```

### 캐시 초기화

```bash
# Metro bundler 캐시 초기화
npm start -- --clear

# 또는
expo start -c
```

### 프로덕션 빌드

```bash
# Android APK 빌드
eas build --platform android

# iOS 빌드
eas build --platform ios
```

## 🛠️ 개발 도구

### TypeScript 체크

```bash
# 타입 에러 검사
npx tsc --noEmit
```

### 린터 실행

```bash
# ESLint로 코드 검사
npx eslint .
```

### 패키지 추가

```bash
# Expo 호환 패키지 추가
npx expo install package-name
```

## 📊 프로젝트 스크립트

```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "create-admin-account": "ts-node scripts/create-admin-account.ts"
}
```

## 🔧 문제 해결

### Metro bundler가 시작되지 않을 때

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install

# 또는 Windows
rmdir /s node_modules
npm install
```

### 포트가 이미 사용 중일 때

#### Mac/Linux

1. **포트를 사용하는 프로세스 찾기**

```bash
lsof -ti:8081
```

2. **특정 포트의 모든 프로세스 종료**

```bash
lsof -ti:8081 | xargs kill -9
```

3. **또는 직접 PID 찾아서 종료**

```bash
# 1. 프로세스 찾기
lsof -ti:8081

# 2. 출력된 PID로 종료 (예: PID가 1234인 경우)
kill -9 1234

# 여러 개인 경우 모두 종료
kill -9 1234 5678 9012
```

4. **모든 개발 서버 강제 종료 (큰 작업 시)**

```bash
# 모든 Node 프로세스 종료 (주의: 다른 Node 앱도 종료됨)
pkill -f node

# 또는 특정 포트들만 정리
lsof -ti:8081,19000,19001,19002 | xargs kill -9
```

#### Windows

1. **포트를 사용하는 프로세스 찾기**

```cmd
netstat -ano | findstr :8081
```

2. **PID 확인 후 프로세스 종료**

```cmd
# 1. PID 찾기 (예: 1234)
netstat -ano | findstr :8081

# 2. 프로세스 종료
taskkill /PID 1234 /F
```

3. **또는 한 번에 처리**

```powershell
# PowerShell에서
Get-NetTCPConnection -LocalPort 8081 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

4. **모든 Node 프로세스 종료**

```cmd
taskkill /F /IM node.exe
```

#### 공통 해결 방법

1. **다른 포트 사용**

```bash
expo start --port 8082
```

2. **캐시 초기화 후 재시작**

```bash
npm start -- --clear
```

### 패키지 버전 경고 해결

```bash
# Expo SDK에 맞게 모든 패키지 업데이트
npx expo install --fix
```

## 🚨 일반적인 경고 메시지

### 1. 패키지 버전 경고

```
The following packages should be updated for best compatibility:
  @expo/vector-icons@15.0.2 - expected version: ^15.0.3
```

**해결**: `npx expo install --fix` 실행

### 2. Expo Go 제한 경고

```
expo-notifications functionality is not fully supported in Expo Go
```

**해결**: 개발 빌드를 사용하거나 Expo Go의 제한을 받아들임

### 3. 인증 관련 경고

```
No authenticated user found, returning null settings
```

**상태**: 정상 - 로그인 전에는 이 메시지가 나타납니다

## 📝 개발 워크플로우

### 1. 첫 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env 파일 생성)
# 그 다음 시작
npm start
```

### 2. 일반 개발

```bash
# 개발 서버 시작
npm start

# 코드 수정 시 자동으로 리로드됩니다
```

### 3. 빌드 테스트

```bash
# 프로덕션 빌드 생성
eas build --platform android

# 또는 로컬 빌드
npx expo run:android
```

## 🌐 접속 정보

앱이 실행되면:

- **로컬 URL**: http://localhost:8081
- **네트워크 URL**: http://your-ip:8081
- **Expo Dev Tools**: http://localhost:19002

## 🔗 유용한 링크

- [Expo 공식 문서](https://docs.expo.dev/)
- [React Native 문서](https://reactnative.dev/)
- [Expo Router 문서](https://docs.expo.dev/router/introduction/)
- [Supabase 문서](https://supabase.com/docs)

## 📌 빠른 참조

### 기본 명령어

| 명령어      | 설명                |
| ----------- | ------------------- |
| `npm start` | 개발 서버 시작      |
| `w`         | 웹에서 실행         |
| `a`         | 안드로이드에서 실행 |
| `i`         | iOS에서 실행        |
| `r`         | 앱 리로드           |
| `m`         | 메뉴 토글           |
| `Ctrl+C`    | 서버 중지           |

### 포트 충돌 해결

#### Mac/Linux

| 명령어                           | 설명                           |
| -------------------------------- | ------------------------------ |
| `lsof -ti:8081`                  | 8081 포트 사용 프로세스 찾기   |
| `lsof -ti:8081 \| xargs kill -9` | 해당 포트의 모든 프로세스 종료 |
| `pkill -f node`                  | 모든 Node 프로세스 종료 (주의) |

#### Windows

| 명령어                          | 설명                         |
| ------------------------------- | ---------------------------- |
| `netstat -ano \| findstr :8081` | 8081 포트 사용 프로세스 찾기 |
| `taskkill /PID [PID] /F`        | 특정 PID 프로세스 종료       |
| `taskkill /F /IM node.exe`      | 모든 Node 프로세스 종료      |

#### 공통

| 명령어                   | 설명                |
| ------------------------ | ------------------- |
| `expo start --port 8082` | 다른 포트로 시작    |
| `npm start -- --clear`   | 캐시 초기화 후 시작 |

## 🎯 주요 단축키

터미널에서 Expo Dev Tools가 열려 있을 때:

- `w` - 웹 브라우저에서 열기
- `a` - Android 에뮬레이터/디바이스에서 열기
- `i` - iOS 시뮬레이터에서 열기
- `r` - 앱 리로드
- `m` - 개발자 메뉴 토글
- `d` - 개발자 도구 열기

## 📋 체크리스트

### 실행 전 확인사항

- [ ] Node.js 설치됨 (`node --version`)
- [ ] npm 설치됨 (`npm --version`)
- [ ] `.env` 파일 설정됨
- [ ] Supabase 연결 설정됨
- [ ] 의존성 설치됨 (`npm install`)

### 개발 중

- [ ] 터미널에 로그 정상 출력
- [ ] 개발 서버가 시작됨
- [ ] 디바이스/에뮬레이터에 연결됨
- [ ] 핫 리로드 작동 확인
