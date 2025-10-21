# 🔐 소셜 로그인 설정 가이드

## ✅ **구현 완료**

Google, Kakao, Apple 소셜 로그인이 코드에 구현되었습니다!

**이제 각 플랫폼에서 OAuth 앱을 생성하고 Supabase에 연결해야 합니다.**

---

## 🔵 **1. Google 소셜 로그인 설정**

### **Step 1: Google Cloud Console에서 OAuth 앱 생성**

1. **[Google Cloud Console](https://console.cloud.google.com/) 접속**

2. **프로젝트 생성 또는 선택**

   - 좌측 상단 프로젝트 드롭다운 클릭
   - "새 프로젝트" 클릭
   - 프로젝트 이름: `remit-planner` 입력
   - "만들기" 클릭

3. **OAuth 동의 화면 구성**

   - **APIs & Services** → **OAuth consent screen**
   - User Type: **External** 선택
   - "만들기" 클릭
   - 앱 이름: `리밋 플래너`
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처 정보: 본인 이메일
   - "저장 후 계속" 클릭

4. **사용자 인증 정보 만들기**
   - **APIs & Services** → **Credentials**
   - **+ CREATE CREDENTIALS** 클릭
   - **OAuth 2.0 Client ID** 선택
   - Application type: **Web application**
   - 이름: `Remit Planner Web`
5. **Redirect URIs 추가**

   - Authorized redirect URIs 섹션에서 **+ ADD URI** 클릭
   - 다음 URL 추가:
     ```
     https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
     ```
   - "만들기" 클릭

6. **Client ID와 Secret 복사**
   - 팝업에서 **Client ID**와 **Client secret** 복사
   - 안전한 곳에 보관

### **Step 2: Supabase에 Google 설정**

1. **Supabase Dashboard 접속**

   - [Supabase Dashboard](https://supabase.com/dashboard)
   - 프로젝트 선택

2. **Google Provider 활성화**

   - **Authentication** → **Providers**
   - **Google** 찾기
   - **Enabled** 토글 ON

3. **Credentials 입력**

   - **Client ID (for OAuth)**: Google에서 복사한 Client ID 붙여넣기
   - **Client Secret (for OAuth)**: Google에서 복사한 Client Secret 붙여넣기
   - **Save** 클릭

4. **Callback URL 확인**
   - Supabase가 제공하는 Callback URL 복사:
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```
   - 이 URL이 Google Cloud Console의 Redirect URIs에 포함되어 있는지 확인

---

## 🟡 **2. Kakao 소셜 로그인 설정**

### **Step 1: Kakao Developers에서 앱 생성**

1. **[Kakao Developers](https://developers.kakao.com/) 접속**

   - 카카오 계정으로 로그인

2. **애플리케이션 추가**

   - 우측 상단 **내 애플리케이션** 클릭
   - **애플리케이션 추가하기** 클릭
   - 앱 이름: `리밋 플래너`
   - 회사명: 본인 정보 입력
   - "저장" 클릭

3. **앱 키 확인**

   - 생성된 앱 클릭
   - **앱 키** 탭
   - **REST API 키** 복사 (Client ID로 사용)

4. **Kakao Login 활성화**

   - 좌측 메뉴에서 **제품 설정** → **카카오 로그인**
   - **활성화 설정** ON
   - "저장" 클릭

5. **Redirect URI 설정**

   - **카카오 로그인** → **Redirect URI**
   - **Redirect URI 등록** 클릭
   - 다음 URL 추가:
     ```
     https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
     ```
   - "저장" 클릭

6. **보안** 탭에서 Client Secret 생성

   - 좌측 메뉴 **제품 설정** → **카카오 로그인** → **보안**
   - **Client Secret** 섹션
   - **코드 생성** 클릭
   - 생성된 코드 복사
   - **활성화 상태**: ON으로 변경
   - "저장" 클릭

7. **동의 항목 설정**
   - **제품 설정** → **카카오 로그인** → **동의 항목**
   - 닉네임: **필수 동의** 설정
   - 카카오계정(이메일): **필수 동의** 설정
   - "저장" 클릭

### **Step 2: Supabase에 Kakao 설정**

1. **Supabase Dashboard**

   - **Authentication** → **Providers**
   - **Kakao** 찾기
   - **Enabled** 토글 ON

2. **Credentials 입력**
   - **Client ID**: Kakao REST API 키 붙여넣기
   - **Client Secret**: Kakao에서 생성한 Client Secret 붙여넣기
   - **Save** 클릭

---

## 🍎 **3. Apple 소셜 로그인 설정**

### **Step 1: Apple Developer에서 설정**

**⚠️ 주의**: Apple Developer Program 가입 필요 (연 $99)

1. **[Apple Developer](https://developer.apple.com/) 접속**

   - Apple ID로 로그인

2. **Identifiers 생성**

   - **Certificates, Identifiers & Profiles** → **Identifiers**
   - **+** 버튼 클릭
   - **Services IDs** 선택
   - "Continue" 클릭

3. **Service ID 등록**

   - Description: `Remit Planner`
   - Identifier: `com.remitplanner.signin` (고유해야 함)
   - "Continue" → "Register" 클릭

4. **Sign in with Apple 설정**
   - 생성한 Service ID 클릭
   - **Sign in with Apple** 체크
   - **Configure** 클릭
5. **Domains and Subdomains 설정**

   - Primary App ID 선택
   - **Website URLs** 섹션:
     - Domains: `[YOUR-PROJECT-REF].supabase.co`
     - Return URLs: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
   - "Next" → "Done" → "Continue" → "Save"

6. **Key 생성**
   - **Keys** → **+** 버튼
   - Key Name: `Remit Planner Sign in with Apple Key`
   - **Sign in with Apple** 체크
   - **Configure** 클릭
   - Primary App ID 선택
   - "Save" → "Continue" → "Register"
   - **Download** 클릭하여 `.p8` 파일 다운로드
   - **Key ID** 복사 (나중에 필요)

### **Step 2: Supabase에 Apple 설정**

1. **Supabase Dashboard**

   - **Authentication** → **Providers**
   - **Apple** 찾기
   - **Enabled** 토글 ON

2. **Credentials 입력**
   - **Services ID**: `com.remitplanner.signin` (Apple에서 생성한 Identifier)
   - **Key ID**: Apple에서 복사한 Key ID
   - **Team ID**: Apple Developer 계정의 Team ID
   - **Secret Key**: `.p8` 파일 내용 전체 복사 붙여넣기
   - **Save** 클릭

---

## 🚀 **테스트 방법**

### **1. Google 로그인 테스트**

1. 로그인 화면에서 **Google 아이콘** 클릭
2. Google 계정 선택 화면 표시
3. 계정 선택
4. 권한 동의
5. 메인 화면으로 자동 이동 ✅

### **2. Kakao 로그인 테스트**

1. 로그인 화면에서 **Kakao 아이콘** 클릭
2. Kakao 계정 로그인 화면 표시
3. 로그인 또는 QR 코드 스캔
4. 동의 항목 확인
5. 메인 화면으로 자동 이동 ✅

### **3. Apple 로그인 테스트**

1. 로그인 화면에서 **Apple 아이콘** 클릭
2. Apple ID로 계속하기 화면 표시
3. Apple ID 입력 (또는 Face ID/Touch ID)
4. 동의
5. 메인 화면으로 자동 이동 ✅

---

## 📝 **Supabase Project Ref 찾기**

**Supabase Project Reference**를 찾는 방법:

1. Supabase Dashboard → 프로젝트 선택
2. **Settings** → **API**
3. **Project URL** 확인:
   ```
   https://abcdefghijk.supabase.co
            ↑ 이 부분이 Project Ref
   ```

예시:

- Project URL: `https://xyzabc123.supabase.co`
- Project Ref: `xyzabc123`
- Callback URL: `https://xyzabc123.supabase.co/auth/v1/callback`

---

## 🔒 **보안 체크리스트**

### **Google**

- [ ] OAuth 동의 화면 구성 완료
- [ ] Redirect URIs에 Supabase Callback URL 등록
- [ ] Client ID와 Secret을 Supabase에 등록
- [ ] 테스트 사용자 추가 (개발 중)

### **Kakao**

- [ ] 카카오 로그인 활성화
- [ ] Redirect URI 등록
- [ ] Client Secret 생성 및 활성화
- [ ] 동의 항목 설정 (닉네임, 이메일 필수)
- [ ] REST API 키와 Secret을 Supabase에 등록

### **Apple**

- [ ] Apple Developer Program 가입 ($99/년)
- [ ] Services ID 생성
- [ ] Sign in with Apple 활성화
- [ ] Return URLs 설정
- [ ] Key 생성 및 다운로드
- [ ] Supabase에 모든 정보 등록

---

## 🎨 **UI 변경사항**

### **로그인 화면 버튼 순서**

```
[Kakao] [Google] [Apple]
```

### **네이버 버튼 제거**

- ✅ 네이버 버튼 제거됨
- ✅ 네이버 관련 스타일 정리됨
- ✅ 3개 버튼만 표시

---

## 🧪 **개발 환경 테스트 팁**

### **로컬 테스트 (웹)**

```
1. npm run web
2. http://localhost:8081 접속
3. 소셜 로그인 버튼 클릭
4. OAuth 플로우 진행
5. http://localhost:8081/main으로 redirect
```

### **Expo Go 테스트 (앱)**

```
1. npm start
2. Expo Go에서 QR 코드 스캔
3. 소셜 로그인 버튼 클릭
4. OAuth 플로우 진행
5. remitplanner://main으로 Deep Link
```

**⚠️ 주의**: Expo Go에서는 일부 소셜 로그인이 제한될 수 있습니다. 정확한 테스트는 빌드된 앱에서 해야 합니다.

---

## 🚨 **문제 해결**

### **1. "Redirect URI mismatch" 오류**

- **원인**: Redirect URI가 일치하지 않음
- **해결**:
  - Google/Kakao/Apple에서 설정한 Redirect URI 확인
  - Supabase Callback URL과 정확히 일치하는지 확인
  - `https://` 포함 여부 확인

### **2. "Invalid client" 오류**

- **원인**: Client ID 또는 Secret이 잘못됨
- **해결**:
  - Supabase에 입력한 Credentials 재확인
  - 공백이나 특수문자 포함 여부 확인

### **3. "OAuth error occurred" 오류**

- **원인**: Provider 설정 미완료
- **해결**:
  - Google/Kakao/Apple Developer Console에서 앱 활성화 확인
  - 동의 항목 설정 확인

### **4. 웹에서 소셜 로그인 후 화면 전환 안 됨**

- **원인**: 정상 동작입니다 (OAuth redirect)
- **설명**: 웹에서는 OAuth 플로우가 새 창에서 열리고, 인증 후 자동으로 `/main`으로 redirect됩니다.

### **5. 앱에서 "Deep Link not supported" 오류**

- **원인**: Deep Link 설정 미완료
- **해결**:
  - `app.json`에 `scheme: "remitplanner"` 확인
  - 각 Provider의 Redirect URI에 `remitplanner://main` 추가

---

## 📊 **예상 소요 시간**

| 작업         | 소요 시간     |
| ------------ | ------------- |
| Google 설정  | 15-20분       |
| Kakao 설정   | 15-20분       |
| Apple 설정   | 30-40분       |
| 총 소요 시간 | **1-1.5시간** |

---

## 🎉 **설정 완료 후**

모든 설정이 완료되면:

1. ✅ 사용자가 Google, Kakao, Apple 계정으로 간편 로그인
2. ✅ 회원가입 없이 바로 서비스 이용 가능
3. ✅ 소셜 로그인 계정도 Supabase Auth로 통합 관리
4. ✅ 설정 화면에서 프로필 정보 관리 가능

---

## 🔐 **보안 참고사항**

### **Client Secret 관리**

- ✅ `.env` 파일에 저장 (Git에 커밋 안 됨)
- ✅ Supabase Dashboard는 안전하게 관리
- ❌ 코드에 직접 입력 금지

### **OAuth Scope**

- **Google**: email, profile (기본)
- **Kakao**: account_email, profile_nickname (설정한 동의 항목)
- **Apple**: email, name (기본)

---

## 📞 **도움이 필요하신가요?**

### **Google 설정 관련**

- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)

### **Kakao 설정 관련**

- [Kakao Login 가이드](https://developers.kakao.com/docs/latest/ko/kakaologin/common)

### **Apple 설정 관련**

- [Sign in with Apple 가이드](https://developer.apple.com/sign-in-with-apple/)

### **Supabase 관련**

- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)

---

## ✅ **체크리스트**

설정을 완료하셨나요?

- [ ] Google Cloud Console에서 OAuth 앱 생성
- [ ] Kakao Developers에서 앱 생성
- [ ] Apple Developer에서 Services ID 생성
- [ ] Supabase에 Google Provider 설정
- [ ] Supabase에 Kakao Provider 설정
- [ ] Supabase에 Apple Provider 설정
- [ ] Google 로그인 테스트
- [ ] Kakao 로그인 테스트
- [ ] Apple 로그인 테스트

모든 체크리스트가 완료되면 소셜 로그인을 사용할 수 있습니다! 🎊
