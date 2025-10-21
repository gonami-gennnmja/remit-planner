# 🌐 인증 에러 메시지 한국어 번역 가이드

## 📋 **개요**

Supabase Authentication의 영어 에러 메시지를 한국어로 자동 번역하여 사용자에게 표시합니다.

## ✅ **적용된 변경사항**

### **파일 수정**

- `utils/supabaseAuth.ts` - 에러 메시지 번역 함수 추가

### **번역 함수**

```typescript
translateAuthError(errorMessage: string, errorCode?: string): string
```

## 📝 **번역된 에러 메시지**

### **로그인 에러**

| 영어 메시지               | 한국어 번역                               |
| ------------------------- | ----------------------------------------- |
| Invalid login credentials | 아이디 또는 비밀번호가 올바르지 않습니다. |
| Email not confirmed       | 이메일 인증이 필요합니다.                 |
| User not found            | 사용자를 찾을 수 없습니다.                |
| Invalid email or password | 이메일 또는 비밀번호가 올바르지 않습니다. |

### **회원가입 에러**

| 영어 메시지                              | 한국어 번역                            |
| ---------------------------------------- | -------------------------------------- |
| User already registered                  | 이미 등록된 사용자입니다.              |
| Password should be at least 6 characters | 비밀번호는 최소 6자 이상이어야 합니다. |
| Email address is invalid                 | 유효하지 않은 이메일 주소입니다.       |
| Signup requires a valid password         | 올바른 비밀번호를 입력해주세요.        |
| Password is too weak                     | 비밀번호가 너무 약합니다.              |

### **이메일 관련 에러**

| 영어 메시지                          | 한국어 번역                                                 |
| ------------------------------------ | ----------------------------------------------------------- |
| Email rate limit exceeded            | 이메일 전송 횟수를 초과했습니다. 잠시 후 다시 시도해주세요. |
| Email link is invalid or has expired | 이메일 링크가 만료되었거나 유효하지 않습니다.               |

### **토큰 관련 에러**

| 영어 메시지                     | 한국어 번역                            |
| ------------------------------- | -------------------------------------- |
| Token has expired or is invalid | 토큰이 만료되었거나 유효하지 않습니다. |

### **비밀번호 변경 에러**

| 영어 메시지                                            | 한국어 번역                                  |
| ------------------------------------------------------ | -------------------------------------------- |
| New password should be different from the old password | 새 비밀번호는 기존 비밀번호와 달라야 합니다. |

### **네트워크 에러**

| 영어 메시지            | 한국어 번역                   |
| ---------------------- | ----------------------------- |
| Network request failed | 네트워크 연결을 확인해주세요. |

### **에러 코드별 번역**

| 에러 코드                  | 한국어 번역                                                 |
| -------------------------- | ----------------------------------------------------------- |
| invalid_credentials        | 아이디 또는 비밀번호가 올바르지 않습니다.                   |
| email_not_confirmed        | 이메일 인증이 필요합니다.                                   |
| user_already_exists        | 이미 등록된 사용자입니다.                                   |
| weak_password              | 비밀번호가 너무 약합니다. 최소 6자 이상 입력해주세요.       |
| email_address_invalid      | 유효하지 않은 이메일 주소입니다.                            |
| user_not_found             | 사용자를 찾을 수 없습니다.                                  |
| over_email_send_rate_limit | 이메일 전송 횟수를 초과했습니다. 잠시 후 다시 시도해주세요. |
| validation_failed          | 입력 정보를 확인해주세요.                                   |

### **기본 메시지**

번역이 정의되지 않은 에러의 경우:

```
로그인 중 오류가 발생했습니다. 다시 시도해주세요.
```

## 🔧 **동작 방식**

### **1. 에러 발생 시**

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  // 1. 원본 에러: "Invalid login credentials"
  console.log("원본:", error.message);

  // 2. 번역된 에러: "아이디 또는 비밀번호가 올바르지 않습니다."
  const translatedMessage = translateAuthError(error.message, error.code);

  // 3. 사용자에게 한국어 메시지 표시
  return { success: false, message: translatedMessage };
}
```

### **2. 번역 우선순위**

1. **에러 코드 확인** (`error.code`)
2. **에러 메시지 부분 매칭** (`error.message`)
3. **기본 메시지 반환**

### **3. 적용된 함수들**

- ✅ `loginWithSupabase()` - 로그인
- ✅ `registerWithSupabase()` - 회원가입
- ✅ `logoutFromSupabase()` - 로그아웃
- ✅ `updateSupabaseUser()` - 사용자 정보 업데이트

## 📱 **사용 예시**

### **로그인 실패 예시**

```typescript
// 사용자가 잘못된 비밀번호 입력
const result = await login("admin", "wrongpassword");

// 이전: "Invalid login credentials"
// 이후: "아이디 또는 비밀번호가 올바르지 않습니다."
console.log(result.message); // "아이디 또는 비밀번호가 올바르지 않습니다."
```

### **회원가입 실패 예시**

```typescript
// 사용자가 짧은 비밀번호 입력
const result = await registerUser("test", "123", "테스트");

// 이전: "Password should be at least 6 characters"
// 이후: "비밀번호는 최소 6자 이상이어야 합니다."
console.log(result.message); // "비밀번호는 최소 6자 이상이어야 합니다."
```

## 🎨 **UI 표시**

### **로그인 화면**

```tsx
// components/LoginScreen.tsx
const result = await login(userId.trim(), password.trim());

if (result.success && result.user) {
  // 로그인 성공
  navigation.push("/main");
} else {
  // 한국어 에러 메시지 표시
  Alert.alert("로그인 실패", result.message);
}
```

### **설정 화면**

```tsx
// app/settings.tsx
const result = await updateUser(updatedUser);

if (result.success) {
  Alert.alert("성공", "사용자 정보가 업데이트되었습니다.");
} else {
  // 한국어 에러 메시지 표시
  Alert.alert("오류", result.message);
}
```

## 🌍 **다국어 지원 (향후 확장)**

### **현재 상태**

- ✅ 한국어 (ko) - 완전 지원

### **향후 계획**

영어 사용자를 위해 조건부 번역 추가:

```typescript
function translateAuthError(
  errorMessage: string,
  errorCode?: string,
  language: "ko" | "en" = "ko" // 언어 파라미터 추가
): string {
  // 영어 사용자는 원본 메시지 반환
  if (language === "en") {
    return errorMessage;
  }

  // 한국어 사용자는 번역된 메시지 반환
  // ... 기존 번역 로직
}
```

## 📊 **테스트 시나리오**

### **1. 잘못된 로그인**

- **입력**: `admin` / `wrongpassword`
- **예상 결과**: "아이디 또는 비밀번호가 올바르지 않습니다."

### **2. 짧은 비밀번호**

- **입력**: 회원가입 시 비밀번호 `1234`
- **예상 결과**: "비밀번호는 최소 6자 이상이어야 합니다."

### **3. 중복 이메일**

- **입력**: 이미 존재하는 이메일로 회원가입
- **예상 결과**: "이미 등록된 사용자입니다."

### **4. 잘못된 이메일**

- **입력**: 유효하지 않은 이메일 형식
- **예상 결과**: "유효하지 않은 이메일 주소입니다."

## ✅ **체크리스트**

- [x] 에러 메시지 번역 함수 구현
- [x] 로그인 함수에 번역 적용
- [x] 회원가입 함수에 번역 적용
- [x] 로그아웃 함수에 번역 적용
- [x] 사용자 정보 업데이트 함수에 번역 적용
- [x] 일반적인 에러 메시지 모두 번역
- [x] 에러 코드별 번역 추가
- [ ] 영어 지원 추가 (향후)
- [ ] 기타 언어 지원 추가 (향후)

## 🎉 **완료!**

이제 Supabase Authentication의 모든 에러 메시지가 한국어로 표시됩니다!

사용자는 더 이상 영어 에러 메시지를 보지 않고, 친숙한 한국어 메시지를 통해 문제를 쉽게 이해할 수 있습니다. 🇰🇷
