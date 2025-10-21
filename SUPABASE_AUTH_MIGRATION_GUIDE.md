# Supabase Authentication 마이그레이션 가이드

## 🎯 **개요**

기존 AsyncStorage 기반 인증 시스템을 **Supabase Authentication**으로 마이그레이션했습니다.

## 📋 **변경 사항**

### **1. 새로운 파일**

- `utils/supabaseAuth.ts` - Supabase Auth 전용 함수들
- `scripts/create-admin-account.ts` - Admin 계정 생성 스크립트
- `SUPABASE_AUTH_MIGRATION_GUIDE.md` - 이 가이드

### **2. 수정된 파일**

- `utils/authUtils.ts` - Supabase Auth로 마이그레이션
- `components/LoginScreen.tsx` - 이메일 입력 지원
- `package.json` - 새로운 스크립트 및 의존성 추가

### **3. 기존 기능 유지**

- `app/settings.tsx` - 로그아웃 기능 (자동 마이그레이션)
- `contexts/ThemeContext.tsx` - 사용자 설정 저장 (이미 Supabase 연동됨)
- `contexts/LocalizationContext.tsx` - 언어 설정 저장 (이미 Supabase 연동됨)

## 🚀 **설정 방법**

### **1단계: 환경 변수 설정**

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase 설정
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

**Supabase URL과 ANON KEY 찾는 방법:**

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. Settings → API
4. Project URL과 anon/public key 복사

### **2단계: 의존성 설치**

```bash
npm install
```

### **3단계: Admin 계정 생성**

```bash
npm run create-admin-account
```

**성공 시 출력:**

```
✅ Admin 계정이 성공적으로 생성되었습니다!
이메일: admin@remit-planner.com
비밀번호: 123456
사용자 ID: [UUID]
```

### **4단계: 앱 실행**

```bash
npm start
```

## 🔐 **로그인 방법**

### **Admin 계정으로 로그인**

- **이메일**: `admin@remit-planner.com`
- **비밀번호**: `1234`

### **아이디로도 로그인 가능**

- **아이디**: `admin`
- **비밀번호**: `1234`
- (자동으로 `admin@remit-planner.com`으로 변환됨)

## 📱 **사용자 경험**

### **기존 사용자**

- 기존 AsyncStorage 데이터는 백업됨 (`@remit-planner:users_backup`)
- 첫 실행 시 자동으로 Supabase Auth로 마이그레이션
- 기존 로그인 방식 그대로 사용 가능

### **새로운 기능**

- **실시간 동기화**: 여러 디바이스에서 설정 동기화
- **보안 강화**: Supabase의 강력한 인증 시스템
- **확장성**: 나중에 소셜 로그인 등 추가 가능

## 🔄 **마이그레이션 과정**

### **자동 마이그레이션**

1. 앱 시작 시 `initializeAuthDB()` 호출
2. 기존 AsyncStorage 데이터 백업
3. Admin 계정이 Supabase에 없으면 자동 생성
4. 이후 모든 인증은 Supabase Auth 사용

### **수동 마이그레이션 (필요시)**

```bash
# Admin 계정 강제 재생성
npm run create-admin-account
```

## 🛠 **개발자 정보**

### **주요 함수들**

#### **Supabase Auth 함수**

```typescript
// 로그인
loginWithSupabase(email: string, password: string)

// 회원가입
registerWithSupabase(email: string, password: string, name: string)

// 로그아웃
logoutFromSupabase()

// 현재 사용자 조회
getCurrentSupabaseUser()

// 사용자 정보 업데이트
updateSupabaseUser(user: SupabaseUser)
```

#### **기존 호환 함수들**

```typescript
// 기존 코드와 호환 (내부적으로 Supabase Auth 사용)
login(id: string, password: string)
logout()
getCurrentUser()
updateUser(user: User)
```

### **데이터베이스 연동**

- **사용자 설정**: `user_settings` 테이블에 저장
- **테마 설정**: 실시간 동기화
- **언어 설정**: 실시간 동기화
- **알림 설정**: 실시간 동기화

## 🚨 **문제 해결**

### **1. "환경 변수가 설정되지 않았습니다" 오류**

```bash
# .env 파일 확인
cat .env

# 환경 변수 설정
EXPO_PUBLIC_SUPABASE_URL=your_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### **2. "Admin 계정이 이미 존재합니다" 메시지**

- 정상적인 메시지입니다
- 기존 계정으로 로그인하세요

### **3. 로그인 실패**

```bash
# Admin 계정 재생성
npm run create-admin-account
```

### **4. 설정이 저장되지 않음**

- Supabase `user_settings` 테이블이 생성되었는지 확인
- RLS 정책이 올바르게 설정되었는지 확인

## 📊 **데이터베이스 스키마**

### **user_settings 테이블**

```sql
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_mode TEXT DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'auto')),
  accent_color TEXT DEFAULT 'indigo' CHECK (accent_color IN ('blue', 'purple', 'green', 'orange', 'pink', 'red', 'teal', 'indigo', 'black')),
  language TEXT DEFAULT 'ko' CHECK (language IN ('ko', 'en')),
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## 🎉 **완료!**

이제 Supabase Authentication이 완전히 설정되었습니다!

- ✅ **보안**: Supabase의 강력한 인증 시스템
- ✅ **동기화**: 여러 디바이스 간 설정 동기화
- ✅ **확장성**: 나중에 소셜 로그인 등 추가 가능
- ✅ **호환성**: 기존 코드와 완전 호환

**다음 단계**: 필요에 따라 소셜 로그인, 비밀번호 재설정 등의 기능을 추가할 수 있습니다.
