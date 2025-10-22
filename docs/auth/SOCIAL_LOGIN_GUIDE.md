# 🔑 소셜 로그인 구현 가이드

## 📋 **Supabase 지원 현황**

### **✅ Supabase에서 기본 제공하는 Provider**

- ✅ **Google** - 완전 지원
- ✅ **Apple** - 완전 지원
- ✅ **Kakao** - 완전 지원 (2023년부터)
- ✅ Facebook, Twitter, GitHub, GitLab 등 40개 이상

### **❌ Supabase에서 기본 제공하지 않는 Provider**

- ❌ **Naver** - 기본 미제공

## 🔧 **Naver 소셜 로그인 구현 방법**

네이버는 Supabase가 기본 제공하지 않지만, **2가지 방법**으로 구현할 수 있습니다:

### **방법 1: Supabase Custom OAuth Provider (권장) ⭐**

Supabase는 커스텀 OAuth 2.0 Provider를 지원합니다!

#### **장점:**

- ✅ Supabase Auth와 완전 통합
- ✅ 다른 소셜 로그인과 동일한 방식으로 관리
- ✅ Row Level Security (RLS) 자동 적용
- ✅ 세션 관리 자동화

#### **단점:**

- ❌ 설정이 복잡함
- ❌ Supabase Functions 필요 (서버리스 함수)

#### **구현 방법:**

1. Naver Developers에서 OAuth 앱 생성
2. Supabase Functions로 OAuth 플로우 구현
3. Callback URL 처리

### **방법 2: 직접 구현 (간단) 🎯**

Naver Login SDK를 직접 사용하고, 인증 후 Supabase에 사용자 생성

#### **장점:**

- ✅ 구현이 비교적 간단
- ✅ Naver Login SDK 활용
- ✅ 네이버 공식 문서 참고 가능

#### **단점:**

- ❌ Supabase Auth와 별도 관리
- ❌ 추가 코드 작성 필요

## 🎯 **추천: 우선순위**

### **1순위: Google, Kakao, Apple (기본 제공)** ⭐⭐⭐

- 설정만 하면 바로 사용 가능
- Supabase Dashboard에서 쉽게 설정
- 안정적이고 검증됨

### **2순위: Naver (커스텀 구현)** ⭐⭐

- 한국 사용자에게 중요
- 하지만 구현 복잡도가 높음
- 시간이 걸림

## 💡 **현실적인 접근**

### **Phase 1: 기본 제공 Provider 먼저 구현**

```
1. Google 소셜 로그인 (전 세계 사용자)
2. Kakao 소셜 로그인 (한국 사용자)
3. Apple 소셜 로그인 (iOS 필수)
```

### **Phase 2: Naver 추가 (필요 시)**

```
1. Naver Login SDK 설치
2. OAuth 플로우 구현
3. Supabase Auth와 연동
```

## 🚀 **Google 소셜 로그인 구현 (가장 쉬움)**

### **1단계: Google Cloud Console 설정**

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 선택
3. **APIs & Services** → **Credentials**
4. **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```

### **2단계: Supabase Dashboard 설정**

1. **Authentication** → **Providers**
2. **Google** 활성화
3. Client ID와 Client Secret 입력 (Google에서 복사)
4. **Save**

### **3단계: 코드 구현**

```typescript
// utils/socialAuth.ts
import { supabase } from "@/lib/supabase";

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo:
        Platform.OS === "web"
          ? `${window.location.origin}/main`
          : "remitplanner://main",
    },
  });

  if (error) {
    console.error("Google 로그인 실패:", error);
    return { success: false, message: error.message };
  }

  return { success: true };
}
```

## 🍊 **Kakao 소셜 로그인 구현**

### **1단계: Kakao Developers 설정**

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 애플리케이션 추가
3. **제품 설정** → **카카오 로그인**
4. Redirect URI 설정:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```

### **2단계: Supabase Dashboard 설정**

1. **Authentication** → **Providers**
2. **Kakao** 활성화
3. Client ID와 Client Secret 입력
4. **Save**

### **3단계: 코드 구현**

```typescript
export async function signInWithKakao() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo:
        Platform.OS === "web"
          ? `${window.location.origin}/main`
          : "remitplanner://main",
    },
  });

  if (error) {
    console.error("Kakao 로그인 실패:", error);
    return { success: false, message: error.message };
  }

  return { success: true };
}
```

## 🍎 **Apple 소셜 로그인 구현**

### **1단계: Apple Developer 설정**

1. [Apple Developer](https://developer.apple.com/) 접속
2. **Certificates, Identifiers & Profiles**
3. Services ID 생성
4. Sign in with Apple 활성화
5. Return URLs:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```

### **2단계: Supabase Dashboard 설정**

1. **Authentication** → **Providers**
2. **Apple** 활성화
3. Client ID와 Secret Key 입력
4. **Save**

### **3단계: 코드 구현**

```typescript
export async function signInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo:
        Platform.OS === "web"
          ? `${window.location.origin}/main`
          : "remitplanner://main",
    },
  });

  if (error) {
    console.error("Apple 로그인 실패:", error);
    return { success: false, message: error.message };
  }

  return { success: true };
}
```

## 🟢 **Naver 소셜 로그인 구현 (커스텀)**

### **방법 A: React Native Naver Login 라이브러리 사용**

```bash
# 라이브러리 설치
npm install @react-native-seoul/naver-login
```

```typescript
import NaverLogin from "@react-native-seoul/naver-login";

export async function signInWithNaver() {
  try {
    const result = await NaverLogin.login({
      appName: "리밋 플래너",
      consumerKey: "YOUR_NAVER_CLIENT_ID",
      consumerSecret: "YOUR_NAVER_CLIENT_SECRET",
      serviceUrlScheme: "remitplanner",
    });

    // Naver에서 받은 정보로 Supabase 계정 생성/로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email: result.response.email,
      password: "naver_" + result.response.id, // 임시 비밀번호
    });

    // 계정이 없으면 생성
    if (error?.message.includes("Invalid login credentials")) {
      await supabase.auth.signUp({
        email: result.response.email,
        password: "naver_" + result.response.id,
        options: {
          data: {
            name: result.response.name,
            provider: "naver",
          },
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Naver 로그인 실패:", error);
    return { success: false, message: error.message };
  }
}
```

### **방법 B: Supabase Edge Functions 사용 (고급)**

Supabase Edge Functions로 OAuth 플로우를 직접 구현:

1. Naver OAuth API 연동
2. Access Token 받기
3. 사용자 정보 조회
4. Supabase Auth에 사용자 생성

**복잡도가 높아서 권장하지 않습니다.**

## 📊 **구현 난이도 비교**

| Provider | 난이도            | 소요 시간 | Supabase 통합 |
| -------- | ----------------- | --------- | ------------- |
| Google   | ⭐ (쉬움)         | 30분      | ✅ 완전 통합  |
| Kakao    | ⭐ (쉬움)         | 30분      | ✅ 완전 통합  |
| Apple    | ⭐⭐ (중간)       | 1시간     | ✅ 완전 통합  |
| Naver    | ⭐⭐⭐⭐ (어려움) | 4-6시간   | ⚠️ 별도 구현  |

## 💡 **추천 방향**

### **옵션 1: 네이버 제외 (빠름)** ⚡

```
✅ Google (전 세계 사용자)
✅ Kakao (한국 사용자 대부분)
✅ Apple (iOS 필수)
```

**장점:**

- 빠른 구현 (1-2시간)
- 안정적
- 대부분의 사용자 커버

**단점:**

- 네이버 사용자 불편

### **옵션 2: 네이버 포함 (완전)** 🎯

```
✅ Google
✅ Kakao
✅ Apple
🔧 Naver (커스텀 구현)
```

**장점:**

- 모든 주요 플랫폼 지원
- 한국 사용자 친화적

**단점:**

- 구현 시간 오래 걸림 (5-7시간)
- 유지보수 복잡

### **옵션 3: 단계별 구현 (권장)** 🌟

```
Phase 1: Google, Kakao (1시간)
  ↓ 테스트 및 피드백
Phase 2: Apple (1시간)
  ↓ iOS 사용자 확보
Phase 3: Naver (4-6시간, 필요시)
  ↓ 네이버 사용자 요구 시
```

## 🤔 **네이버가 꼭 필요한가요?**

### **한국 소셜 로그인 점유율 (2024)**

- **Kakao**: ~70% (압도적 1위)
- **Naver**: ~20%
- **Google**: ~8%
- **Apple**: ~2%

### **결론**

- **Kakao만으로도 한국 사용자의 70% 커버**
- **Google 추가 시 거의 모든 사용자 커버**
- **Naver는 필수는 아님** (nice-to-have)

## 🎯 **현실적인 제안**

### **지금 당장: Google + Kakao 먼저 구현**

1. 구현 시간: **1-2시간**
2. 커버리지: **한국 사용자 70% + 전 세계 사용자**
3. 난이도: **쉬움**

### **나중에: Naver 추가 (선택)**

1. 사용자 요청이 많을 때
2. 시간 여유가 있을 때
3. 또는 아예 생략

## 📝 **구현 계획**

어떻게 진행하시겠습니까?

### **A. 빠른 구현 (1-2시간)** ⚡

```
✅ Google 소셜 로그인
✅ Kakao 소셜 로그인
❌ Naver 제외 (나중에)
```

### **B. 완전 구현 (5-7시간)** 🎯

```
✅ Google 소셜 로그인
✅ Kakao 소셜 로그인
✅ Apple 소셜 로그인
🔧 Naver 커스텀 구현
```

### **C. 단계별 구현 (권장)** 🌟

```
Step 1: Google + Kakao (1-2시간)
  → 테스트 및 사용자 피드백

Step 2: Apple 추가 (1시간)
  → iOS 사용자 대응

Step 3: Naver 검토 (필요시)
  → 사용자 요구가 많으면 구현
```

## 🚀 **빠른 시작 (Google + Kakao)**

제가 **Google과 Kakao 소셜 로그인**을 먼저 구현해드릴까요?

### **필요한 것:**

1. Google Cloud Console 계정
2. Kakao Developers 계정
3. Supabase 프로젝트

### **소요 시간:**

- Google: 30분
- Kakao: 30분
- 총 1시간

### **결과:**

- ✅ 대부분의 사용자가 소셜 로그인 가능
- ✅ 회원가입 절차 간소화
- ✅ 안정적인 인증 시스템

## ❓ **질문**

**어떤 방향으로 진행하시겠습니까?**

1. **빠른 구현**: Google + Kakao만 (1-2시간)
2. **완전 구현**: Google + Kakao + Apple + Naver (5-7시간)
3. **단계별**: Google + Kakao 먼저, 나머지는 나중에
4. **네이버만**: 네이버 커스텀 구현만 (4-6시간)

말씀해주시면 바로 구현하겠습니다! 🚀
