# 🔑 비밀번호 재설정 설정 가이드

## 📋 **개요**

비밀번호 찾기 기능을 완전히 구현했습니다. 이메일 링크를 통해 비밀번호를 재설정할 수 있습니다.

## ✅ **구현된 기능**

### **1. 비밀번호 찾기 화면 (`app/forgot-password.tsx`)**

- ✅ 이메일 입력
- ✅ 비밀번호 재설정 링크 이메일 전송
- ✅ 웹/앱 자동 감지 및 적절한 링크 생성

### **2. 비밀번호 재설정 화면 (`app/reset-password.tsx`)**

- ✅ 새 비밀번호 입력
- ✅ 비밀번호 확인
- ✅ 실시간 검증 (영문 + 숫자 + 특수문자)
- ✅ 비밀번호 보기/숨기기 토글
- ✅ 빨간 테두리 에러 표시
- ✅ SafeAreaView 적용 (노치 대응)

### **3. Deep Link 설정**

- ✅ 앱: `remitplanner://reset-password`
- ✅ 웹: `https://yourdomain.com/reset-password`
- ✅ `app.json`에 scheme 설정됨

## 🚀 **Supabase 설정 방법**

### **1단계: Supabase Dashboard 접속**

1. [Supabase Dashboard](https://supabase.com/dashboard) 로그인
2. 프로젝트 선택
3. **Authentication** → **URL Configuration** 클릭

### **2단계: Redirect URLs 설정**

**Site URL** 섹션에 다음 URL들을 추가:

```
# 개발 환경
http://localhost:8081/reset-password
http://localhost:19006/reset-password

# 프로덕션 웹
https://yourdomain.com/reset-password

# 앱 Deep Link
remitplanner://reset-password
```

#### **설정 화면:**

```
Site URL:
  http://localhost:8081

Redirect URLs (여러 개 추가):
  http://localhost:8081/reset-password
  http://localhost:19006/reset-password
  https://yourdomain.com/reset-password
  remitplanner://reset-password
```

### **3단계: 이메일 템플릿 커스터마이징 (선택)**

1. **Authentication** → **Email Templates**
2. **Reset Password** 템플릿 선택
3. 한국어로 수정:

```html
<h2>비밀번호 재설정</h2>
<p>안녕하세요,</p>
<p>비밀번호 재설정을 요청하셨습니다.</p>
<p>아래 버튼을 클릭하여 새 비밀번호를 설정하세요:</p>
<p>
  <a
    href="{{ .ConfirmationURL }}"
    style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px;"
  >
    비밀번호 재설정하기
  </a>
</p>
<p>또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
<p style="word-break: break-all; color: #6b7280;">{{ .ConfirmationURL }}</p>
<p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
  이 링크는 1시간 동안 유효합니다.<br />
  요청하지 않으셨다면 이 이메일을 무시하세요.
</p>
<hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
<p style="color: #9ca3af; font-size: 12px;">
  리밋 플래너 운영팀<br />
  이메일: support@remit-planner.com
</p>
```

### **4단계: 이메일 확인 비활성화 (개발 중)**

개발 중에는 이메일 확인을 비활성화하는 것이 편리합니다:

1. **Authentication** → **Settings**
2. **Email Auth** 섹션
3. **Enable email confirmations** ✅ 체크 해제

## 📱 **사용자 흐름**

### **전체 프로세스**

```
1. 로그인 화면
   ↓ "비밀번호를 잊으셨나요?" 클릭

2. 비밀번호 찾기 화면
   ↓ 이메일 입력 후 "재설정 링크 보내기" 클릭

3. 이메일 수신
   ↓ "비밀번호 재설정하기" 링크 클릭

4. 비밀번호 재설정 화면
   ↓ 새 비밀번호 입력 후 "비밀번호 변경" 클릭

5. 로그인 화면
   ↓ 새 비밀번호로 로그인
```

### **웹 vs 앱 차이**

#### **웹 (localhost:8081)**

1. 이메일 링크 클릭
2. `http://localhost:8081/reset-password?access_token=...`로 이동
3. 비밀번호 재설정 화면에서 새 비밀번호 입력
4. 완료 후 로그인 화면

#### **앱 (Expo Go / 빌드된 앱)**

1. 이메일 링크 클릭
2. `remitplanner://reset-password?access_token=...` Deep Link 실행
3. 앱이 자동으로 열리면서 비밀번호 재설정 화면 표시
4. 새 비밀번호 입력
5. 완료 후 로그인 화면

## 🔧 **기술 구현**

### **Deep Link 처리**

앱은 이미 `app.json`에 `scheme: "remitplanner"` 설정되어 있어서 자동으로 Deep Link를 처리합니다.

### **Access Token 처리**

Supabase는 이메일 링크에 자동으로 `access_token`을 포함시킵니다:

```
remitplanner://reset-password?access_token=eyJhb...&type=recovery
```

Expo Router가 자동으로 이 링크를 처리하고 `/reset-password` 화면으로 이동시킵니다.

### **비밀번호 업데이트**

```typescript
// app/reset-password.tsx
const { error } = await supabase.auth.updateUser({
  password: newPassword,
});
```

Supabase는 URL의 `access_token`을 자동으로 인식하여 해당 사용자의 비밀번호를 업데이트합니다.

## 🧪 **테스트 방법**

### **개발 환경 테스트**

1. **Supabase Redirect URLs 설정**

   ```
   http://localhost:8081/reset-password
   remitplanner://reset-password
   ```

2. **비밀번호 찾기 실행**

   - 이메일: `admin@remit-planner.com`
   - "재설정 링크 보내기" 클릭

3. **이메일 확인**

   - 이메일 앱 열기
   - "비밀번호 재설정하기" 링크 클릭

4. **비밀번호 재설정**

   - 새 비밀번호: `newpass123!`
   - 비밀번호 확인: `newpass123!`
   - "비밀번호 변경" 클릭

5. **로그인 테스트**
   - 이메일: `admin@remit-planner.com`
   - 비밀번호: `newpass123!`
   - 로그인 성공 ✅

## 🚨 **문제 해결**

### **1. 이메일이 오지 않음**

- **원인**: Supabase 이메일 설정 미완료
- **해결**: Supabase Dashboard → Authentication → Email Templates 확인

### **2. 링크 클릭 시 404 오류**

- **원인**: Redirect URL이 Supabase에 등록되지 않음
- **해결**: Supabase Dashboard → Authentication → URL Configuration에서 URL 추가

### **3. 앱에서 링크 클릭 시 브라우저로 이동**

- **원인**: Deep Link 설정 미완료
- **해결**: `app.json`에 `scheme: "remitplanner"` 확인

### **4. 비밀번호 변경 실패**

- **원인**: Access Token 만료 (1시간)
- **해결**: 비밀번호 찾기를 다시 실행

## 📧 **아이디(이메일) 찾기는?**

### **Supabase의 제한**

Supabase Auth는 **아이디(이메일) 찾기 기능을 제공하지 않습니다**.

#### **이유:**

1. **보안**: 이메일 노출 방지
2. **개인정보 보호**: 임의로 이메일을 조회할 수 없음
3. **스팸 방지**: 이메일 존재 여부를 확인할 수 없도록 함

### **대안:**

#### **1. 고객센터 문의 (권장)**

```typescript
// 아이디 찾기 대신 고객센터 안내
Alert.alert(
  "아이디 찾기",
  "아이디(이메일)를 잊으셨나요?\n고객센터로 문의해주세요.\n\n이메일: support@remit-planner.com\n전화: 02-1234-5678"
);
```

#### **2. 전화번호로 찾기 (구현 필요)**

회원가입 시 전화번호를 필수로 받는다면:

```typescript
// 전화번호로 이메일 찾기
// 별도 API 엔드포인트 필요 (Supabase Functions)
```

#### **3. 가입한 이메일 기억하도록 유도**

```
로그인 화면에 안내:
"가입하신 이메일 주소로 로그인해주세요"
```

### **현재 앱의 방식**

현재는 **이메일이 곧 아이디**이므로:

- 가입한 이메일을 기억해야 함
- 이메일을 잊었다면 고객센터 문의
- 또는 새 계정 생성

## 📝 **Supabase Dashboard 설정 체크리스트**

### **Authentication → URL Configuration**

- [ ] Site URL 설정: `http://localhost:8081` 또는 실제 도메인
- [ ] Redirect URLs 추가:
  - [ ] `http://localhost:8081/reset-password`
  - [ ] `http://localhost:19006/reset-password`
  - [ ] `https://yourdomain.com/reset-password`
  - [ ] `remitplanner://reset-password`

### **Authentication → Email Templates**

- [ ] Reset Password 템플릿 확인
- [ ] 한국어로 커스터마이징 (선택)
- [ ] 버튼 스타일 추가 (선택)

### **Authentication → Settings**

- [ ] Enable email confirmations (개발 중 체크 해제 권장)
- [ ] Minimum password length: 6 (기본값)

## 🎉 **완료!**

이제 비밀번호 재설정이 완벽하게 작동합니다:

1. ✅ 비밀번호 찾기 화면
2. ✅ 이메일 전송
3. ✅ Deep Link 설정 (웹/앱)
4. ✅ 비밀번호 재설정 화면
5. ✅ 실시간 검증 (빨간 테두리)
6. ✅ SafeAreaView 적용

**다음 단계**: Supabase Dashboard에서 Redirect URLs를 설정하세요! 🚀

---

## 💡 **아이디 찾기 FAQ**

**Q: 아이디 찾기 기능이 없나요?**
A: Supabase는 보안상 이유로 아이디(이메일) 찾기를 지원하지 않습니다.

**Q: 이메일을 잊어버렸어요!**
A: 고객센터로 문의하거나, 가입 시 사용한 이메일을 확인해주세요.

**Q: 전화번호로 찾을 수 없나요?**
A: 전화번호를 필수로 수집한다면 별도 구현이 가능하지만, 현재는 지원하지 않습니다.

**Q: 다른 앱은 아이디 찾기가 있던데?**
A: 자체 인증 시스템을 사용하는 앱들은 가능하지만, Supabase Auth는 보안을 위해 제공하지 않습니다.
