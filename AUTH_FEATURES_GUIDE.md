# 🔐 인증 기능 구현 가이드

## 📋 **개요**

로그인 화면에 회원가입과 비밀번호 찾기 기능을 구현했습니다.

## ✅ **구현된 기능**

### **1. 회원가입 (`app/signup.tsx`)**

- ✅ 이름, 이메일, 비밀번호 입력
- ✅ 비밀번호 확인 (일치 검증)
- ✅ 비밀번호 보기/숨기기 토글
- ✅ 이메일 형식 검증
- ✅ 비밀번호 최소 길이 검증 (6자 이상)
- ✅ Supabase Auth 연동
- ✅ 에러 메시지 한국어 번역
- ✅ 회원가입 후 로그인 화면으로 이동

### **2. 비밀번호 찾기 (`app/forgot-password.tsx`)**

- ✅ 이메일 입력
- ✅ 비밀번호 재설정 링크 이메일 전송
- ✅ Supabase Auth `resetPasswordForEmail` 사용
- ✅ 에러 메시지 한국어 번역
- ✅ 이메일 전송 완료 안내
- ✅ 스팸 메일함 확인 안내
- ✅ 링크 유효 기간 안내 (1시간)

### **3. 로그인 화면 업데이트 (`components/LoginScreen.tsx`)**

- ✅ "비밀번호를 잊으셨나요?" 링크 연결
- ✅ "회원가입" 링크 연결
- ✅ 네비게이션 추가

## 🎨 **UI/UX 특징**

### **회원가입 화면**

#### **입력 필드**

- 이름 (필수)
- 이메일 (필수)
- 비밀번호 (필수, 최소 6자)
- 비밀번호 확인 (필수)

#### **기능**

- 비밀번호 보기/숨기기 아이콘
- 실시간 검증 (이메일 형식, 비밀번호 길이)
- 비밀번호 일치 확인
- 로딩 상태 표시

#### **디자인**

- 깔끔한 입력 폼
- 아이콘과 함께 표시되는 입력 필드
- 힌트 텍스트 (비밀번호 요구사항)
- 약관 동의 안내
- 로그인 링크

### **비밀번호 찾기 화면**

#### **입력 필드**

- 이메일 (필수)

#### **기능**

- 이메일 형식 검증
- 비밀번호 재설정 링크 전송
- 전송 완료 상태 표시
- Rate limit 에러 처리

#### **디자인**

- 큰 키 아이콘
- 명확한 안내 메시지
- 정보 박스 (스팸 메일함, 유효 기간)
- 로그인 링크
- 고객센터 링크

## 📱 **화면 흐름**

```
로그인 화면
├── [회원가입] → 회원가입 화면
│   └── [가입 완료] → 로그인 화면
│
└── [비밀번호 찾기] → 비밀번호 찾기 화면
    └── [이메일 전송] → 로그인 화면
```

## 🔧 **사용 방법**

### **회원가입**

1. 로그인 화면에서 **"회원가입"** 클릭
2. 필수 정보 입력:
   - 이름
   - 이메일
   - 비밀번호 (최소 6자)
   - 비밀번호 확인
3. **"회원가입"** 버튼 클릭
4. 이메일 확인 (Supabase 설정에 따라)
5. 로그인 화면으로 이동

### **비밀번호 찾기**

1. 로그인 화면에서 **"비밀번호를 잊으셨나요?"** 클릭
2. 가입한 이메일 주소 입력
3. **"재설정 링크 보내기"** 클릭
4. 이메일 확인
5. 이메일의 링크 클릭
6. 새 비밀번호 설정

## 🛠 **기술 구현**

### **회원가입 (`app/signup.tsx`)**

```typescript
// 회원가입 함수
const handleSignup = async () => {
  // 입력값 검증
  if (!formData.name.trim()) {
    Alert.alert("오류", "이름을 입력해주세요.");
    return;
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    Alert.alert("오류", "올바른 이메일 형식을 입력해주세요.");
    return;
  }

  // 비밀번호 길이 검증
  if (formData.password.length < 6) {
    Alert.alert("오류", "비밀번호는 최소 6자 이상이어야 합니다.");
    return;
  }

  // 비밀번호 일치 검증
  if (formData.password !== formData.confirmPassword) {
    Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
    return;
  }

  // Supabase Auth 회원가입
  const result = await registerUser(
    formData.email.trim(),
    formData.password,
    formData.name.trim(),
    formData.email.trim()
  );

  if (result.success) {
    Alert.alert("회원가입 완료", "회원가입이 완료되었습니다. 로그인해주세요.", [
      { text: "확인", onPress: () => router.replace("/") },
    ]);
  }
};
```

### **비밀번호 찾기 (`app/forgot-password.tsx`)**

```typescript
// 비밀번호 재설정 함수
const handleResetPassword = async () => {
  // 이메일 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    Alert.alert("오류", "올바른 이메일 형식을 입력해주세요.");
    return;
  }

  // Supabase Auth 비밀번호 재설정 이메일 전송
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: "remitplanner://reset-password",
  });

  if (error) {
    // 에러 메시지 번역
    let errorMessage = "비밀번호 재설정 링크 전송에 실패했습니다.";
    if (error.message.includes("rate limit")) {
      errorMessage =
        "이메일 전송 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.";
    }
    Alert.alert("오류", errorMessage);
  } else {
    setIsSent(true);
    Alert.alert(
      "이메일 전송 완료",
      "비밀번호 재설정 링크가 이메일로 전송되었습니다.",
      [{ text: "확인", onPress: () => router.replace("/") }]
    );
  }
};
```

## 🔒 **보안 기능**

### **입력 검증**

- ✅ 이메일 형식 검증 (정규식)
- ✅ 비밀번호 최소 길이 (6자)
- ✅ 비밀번호 일치 확인
- ✅ 필수 필드 검증

### **Supabase Auth 기능**

- ✅ 안전한 비밀번호 해싱
- ✅ 이메일 인증 (옵션)
- ✅ Rate limiting (이메일 전송 제한)
- ✅ 토큰 기반 인증
- ✅ 세션 관리

### **에러 처리**

- ✅ 한국어 에러 메시지
- ✅ Rate limit 에러 처리
- ✅ 네트워크 에러 처리
- ✅ 사용자 친화적 메시지

## 📧 **이메일 설정 (Supabase)**

### **이메일 템플릿 커스터마이징**

1. Supabase Dashboard → **Authentication** → **Email Templates**
2. **Reset Password** 템플릿 선택
3. 한국어로 커스터마이징:

```html
<h2>비밀번호 재설정</h2>
<p>안녕하세요,</p>
<p>비밀번호 재설정을 요청하셨습니다.</p>
<p>아래 링크를 클릭하여 새 비밀번호를 설정하세요:</p>
<p><a href="{{ .ConfirmationURL }}">비밀번호 재설정하기</a></p>
<p>이 링크는 1시간 동안 유효합니다.</p>
<p>요청하지 않으셨다면 이 이메일을 무시하세요.</p>
```

### **이메일 확인 비활성화 (개발 중)**

개발 중에는 이메일 확인을 비활성화할 수 있습니다:

1. Supabase Dashboard → **Authentication** → **Settings**
2. **Email Auth** 섹션
3. **Enable email confirmations** 체크 해제

## 🎯 **테스트 시나리오**

### **회원가입 테스트**

#### **1. 정상 회원가입**

- **입력**:
  - 이름: `홍길동`
  - 이메일: `test@example.com`
  - 비밀번호: `test123456`
  - 비밀번호 확인: `test123456`
- **예상 결과**: "회원가입이 완료되었습니다." 메시지 후 로그인 화면으로 이동

#### **2. 짧은 비밀번호**

- **입력**: 비밀번호 `12345` (5자)
- **예상 결과**: "비밀번호는 최소 6자 이상이어야 합니다."

#### **3. 비밀번호 불일치**

- **입력**:
  - 비밀번호: `test123456`
  - 비밀번호 확인: `test654321`
- **예상 결과**: "비밀번호가 일치하지 않습니다."

#### **4. 잘못된 이메일**

- **입력**: `testexample.com` (@ 없음)
- **예상 결과**: "올바른 이메일 형식을 입력해주세요."

#### **5. 중복 이메일**

- **입력**: 이미 존재하는 이메일
- **예상 결과**: "이미 등록된 사용자입니다."

### **비밀번호 찾기 테스트**

#### **1. 정상 이메일 전송**

- **입력**: `admin@remit-planner.com`
- **예상 결과**: "비밀번호 재설정 링크가 이메일로 전송되었습니다."

#### **2. 존재하지 않는 이메일**

- **입력**: `notexist@example.com`
- **예상 결과**: "등록되지 않은 이메일입니다."

#### **3. Rate limit 초과**

- **입력**: 짧은 시간에 여러 번 전송
- **예상 결과**: "이메일 전송 횟수를 초과했습니다. 잠시 후 다시 시도해주세요."

## 📂 **파일 구조**

```
app/
├── signup.tsx              # 회원가입 화면
├── forgot-password.tsx     # 비밀번호 찾기 화면
└── _layout.tsx            # 라우팅 설정

components/
└── LoginScreen.tsx        # 로그인 화면 (링크 추가)

utils/
├── authUtils.ts           # 인증 유틸리티 (기존)
└── supabaseAuth.ts        # Supabase Auth 함수 (기존)
```

## ✅ **체크리스트**

- [x] 회원가입 화면 구현
- [x] 비밀번호 찾기 화면 구현
- [x] 로그인 화면 링크 연결
- [x] 이메일 형식 검증
- [x] 비밀번호 길이 검증
- [x] 비밀번호 일치 확인
- [x] 에러 메시지 한국어 번역
- [x] Supabase Auth 연동
- [x] 라우팅 설정
- [ ] 이메일 템플릿 한국어 커스터마이징 (Supabase Dashboard에서 수동)
- [ ] 소셜 로그인 연동 (향후)

## 🎉 **완료!**

이제 사용자는:

- ✅ 회원가입으로 새 계정 생성
- ✅ 비밀번호 찾기로 재설정 링크 받기
- ✅ 친숙한 한국어 UI로 쉽게 사용

**다음 단계**: Supabase Dashboard에서 이메일 템플릿을 한국어로 커스터마이징하세요! 📧
