# ✨ 실시간 검증 UI 업데이트

## 📋 **변경 사항**

### **1. 실시간 검증 (onBlur)** ✅

- **이전**: 회원가입 버튼 클릭 시에만 검증
- **이후**: 각 필드에서 포커스가 벗어날 때 (onBlur) 즉시 검증
- **UX**: 요즘 트렌드에 맞는 실시간 피드백

### **2. 시각적 에러 표시** ✅

- **빨간 테두리**: 에러가 있는 입력 필드는 빨간색 테두리 (2px)
- **에러 메시지**: 입력 필드 아래에 빨간색 텍스트로 에러 메시지 표시
- **힌트 텍스트**: 에러가 없을 때만 회색 힌트 텍스트 표시

### **3. 비밀번호 규칙 강화** ✅

- **이전**: 영문 + 숫자 (특수문자 선택)
- **이후**: 영문 + 숫자 + 특수문자 필수
- **정규식**: `/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/`
- **힌트**: "영문, 숫자, 특수문자를 포함하여 6자 이상 입력해주세요"

## 🎨 **UI 변경사항**

### **Before (이전)**

```
[입력 필드] - 항상 회색 테두리
회색 힌트 텍스트
```

### **After (이후)**

```
[입력 필드] - 정상: 회색 테두리 / 에러: 빨간 테두리 (2px)
에러 있을 때: 빨간색 에러 메시지
에러 없을 때: 회색 힌트 텍스트
```

## 🔧 **구현 상세**

### **1. 에러 상태 관리**

```typescript
const [errors, setErrors] = useState({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
});
```

### **2. 실시간 검증 함수**

#### **이름 검증**

```typescript
const validateName = (name: string) => {
  if (!name.trim()) {
    setErrors((prev) => ({ ...prev, name: "이름을 입력해주세요." }));
    return false;
  }
  setErrors((prev) => ({ ...prev, name: "" }));
  return true;
};
```

#### **이메일 검증**

```typescript
const validateEmail = (email: string) => {
  if (!email.trim()) {
    setErrors((prev) => ({ ...prev, email: "이메일을 입력해주세요." }));
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setErrors((prev) => ({
      ...prev,
      email: "올바른 이메일 형식을 입력해주세요.",
    }));
    return false;
  }
  setErrors((prev) => ({ ...prev, email: "" }));
  return true;
};
```

#### **비밀번호 검증 (영문 + 숫자 + 특수문자)**

```typescript
const validatePassword = (password: string) => {
  if (!password) {
    setErrors((prev) => ({ ...prev, password: "비밀번호를 입력해주세요." }));
    return false;
  }
  if (password.length < 6) {
    setErrors((prev) => ({
      ...prev,
      password: "비밀번호는 최소 6자 이상이어야 합니다.",
    }));
    return false;
  }
  // 영문, 숫자, 특수문자 포함 검증
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
  if (!passwordRegex.test(password)) {
    setErrors((prev) => ({
      ...prev,
      password: "영문, 숫자, 특수문자를 포함하여 6자 이상 입력해주세요.",
    }));
    return false;
  }
  setErrors((prev) => ({ ...prev, password: "" }));
  return true;
};
```

#### **비밀번호 확인 검증**

```typescript
const validateConfirmPassword = (confirmPassword: string) => {
  if (confirmPassword !== formData.password) {
    setErrors((prev) => ({
      ...prev,
      confirmPassword: "비밀번호가 일치하지 않습니다.",
    }));
    return false;
  }
  setErrors((prev) => ({ ...prev, confirmPassword: "" }));
  return true;
};
```

### **3. UI 구현**

#### **TextInput with onBlur**

```typescript
<View
  style={[
    styles.inputContainer,
    errors.name && styles.inputContainerError, // 에러 시 빨간 테두리
  ]}
>
  <TextInput
    value={formData.name}
    onChangeText={(text) => setFormData({ ...formData, name: text })}
    onBlur={() => validateName(formData.name)} // 포커스 벗어날 때 검증
  />
</View>;
{
  errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null;
}
```

#### **비밀번호 필드 (힌트 vs 에러)**

```typescript
{
  errors.password ? (
    <Text style={styles.errorText}>{errors.password}</Text>
  ) : (
    <Text style={styles.hint}>
      영문, 숫자, 특수문자를 포함하여 6자 이상 입력해주세요
    </Text>
  );
}
```

### **4. 스타일**

```typescript
inputContainer: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: Theme.colors.card,
  borderRadius: Theme.borderRadius.lg,
  paddingHorizontal: Theme.spacing.lg,
  borderWidth: 1,
  borderColor: Theme.colors.border.light, // 기본 회색
  ...Theme.shadows.sm,
},
inputContainerError: {
  borderColor: "#ef4444", // 빨간색
  borderWidth: 2,
},
errorText: {
  fontSize: Theme.typography.sizes.xs,
  color: "#ef4444", // 빨간색
  marginTop: Theme.spacing.xs,
  marginLeft: Theme.spacing.sm,
},
hint: {
  fontSize: Theme.typography.sizes.xs,
  color: Theme.colors.text.tertiary, // 회색
  marginTop: Theme.spacing.xs,
  marginLeft: Theme.spacing.sm,
},
```

### **5. 회원가입 버튼 클릭 시**

```typescript
const handleSignup = async () => {
  // 모든 필드 검증
  const isNameValid = validateName(formData.name);
  const isEmailValid = validateEmail(formData.email);
  const isPasswordValid = validatePassword(formData.password);
  const isConfirmPasswordValid = validateConfirmPassword(
    formData.confirmPassword
  );

  // 하나라도 유효하지 않으면 중단
  if (
    !isNameValid ||
    !isEmailValid ||
    !isPasswordValid ||
    !isConfirmPasswordValid
  ) {
    return;
  }

  // 모든 검증 통과 시 회원가입 진행
  setIsLoading(true);
  // ...
};
```

## 🔒 **업데이트된 비밀번호 규칙**

### **검증 규칙**

1. ✅ 최소 6자 이상
2. ✅ 영문 포함 (대소문자)
3. ✅ 숫자 포함
4. ✅ 특수문자 필수 (`@$!%*#?&`)

### **허용되는 예시**

- `test123!` ✅
- `Pass@456` ✅
- `abc#123` ✅
- `User$789` ✅
- `Hello1234!` ✅

### **거부되는 예시**

- `123456` ❌ (영문, 특수문자 없음)
- `abcdef` ❌ (숫자, 특수문자 없음)
- `test123` ❌ (특수문자 없음)
- `test!@#` ❌ (숫자 없음)
- `12345` ❌ (6자 미만)

## 🧪 **사용자 경험 (UX)**

### **이름 필드**

1. 사용자가 이름을 입력
2. 다음 필드로 이동 (포커스 벗어남)
3. 이름이 비어있으면:
   - 테두리가 빨갛게 변경
   - "이름을 입력해주세요." 메시지 표시

### **이메일 필드**

1. 사용자가 이메일을 입력
2. 다음 필드로 이동
3. 이메일 형식이 잘못되었으면:
   - 테두리가 빨갛게 변경
   - "올바른 이메일 형식을 입력해주세요." 메시지 표시

### **비밀번호 필드**

1. 사용자가 비밀번호를 입력
2. 다음 필드로 이동
3. 비밀번호가 규칙에 맞지 않으면:
   - 테두리가 빨갛게 변경
   - "영문, 숫자, 특수문자를 포함하여 6자 이상 입력해주세요." 메시지 표시
4. 비밀번호가 규칙에 맞으면:
   - 회색 힌트 텍스트만 표시

### **비밀번호 확인 필드**

1. 사용자가 비밀번호를 다시 입력
2. 포커스 벗어남
3. 비밀번호가 일치하지 않으면:
   - 테두리가 빨갛게 변경
   - "비밀번호가 일치하지 않습니다." 메시지 표시

### **회원가입 버튼**

1. 사용자가 회원가입 버튼 클릭
2. 모든 필드를 다시 한 번 검증
3. 에러가 있는 필드는 빨간 테두리 + 에러 메시지 표시
4. 모든 검증 통과 시 회원가입 진행

## 📊 **Before vs After 비교**

### **Before (버튼 클릭 시 검증)**

1. 사용자가 모든 필드 입력
2. 회원가입 버튼 클릭
3. Alert 팝업으로 에러 메시지 표시
4. 어느 필드가 문제인지 불명확
5. 사용자가 다시 입력하고 재시도

### **After (실시간 검증)**

1. 사용자가 필드 입력
2. 다음 필드로 이동
3. 즉시 해당 필드에 시각적 피드백 (빨간 테두리 + 에러 메시지)
4. 어느 필드가 문제인지 명확
5. 사용자가 즉시 수정 가능
6. 회원가입 버튼 클릭 시 최종 검증만 수행

## ✅ **장점**

1. **즉각적인 피드백**: 사용자가 입력 실수를 즉시 알 수 있음
2. **명확한 시각적 표시**: 빨간 테두리로 문제 필드를 쉽게 식별
3. **Alert 팝업 제거**: 방해가 되는 팝업 대신 인라인 메시지
4. **요즘 트렌드**: 최신 UI/UX 패턴 적용
5. **사용자 친화적**: 한 번에 모든 에러를 확인하고 수정 가능

## 🎉 **완료!**

이제 회원가입 화면이 요즘 트렌드에 맞는 실시간 검증 UI로 업데이트되었습니다:

1. ✅ onBlur 시 즉시 검증
2. ✅ 빨간 테두리로 에러 표시
3. ✅ 인라인 에러 메시지
4. ✅ 비밀번호: 영문 + 숫자 + 특수문자 필수
5. ✅ Alert 팝업 제거 (회원가입 실패 시 제외)
