# 🚀 빠른 설정 가이드 - Admin 계정 생성

## ⚠️ 로그인이 안 되는 이유

**Supabase에 admin 계정이 아직 생성되지 않았기 때문입니다!**

## 📝 해결 방법 (2가지)

---

### **방법 1: Supabase 대시보드에서 직접 생성 (권장) ⭐**

#### 1단계: Supabase 대시보드 접속

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택

#### 2단계: Authentication 설정

1. 왼쪽 메뉴에서 **Authentication** 클릭
2. **Users** 탭 클릭
3. 오른쪽 상단의 **"Add user"** 또는 **"Invite"** 버튼 클릭

#### 3단계: Admin 계정 생성

다음 정보를 입력하세요:

```
Email: admin@remit-planner.com
Password: 123456
Auto Confirm User: ✅ (체크) ← 중요!
```

**⚠️ 중요**: "Auto Confirm User"를 반드시 체크해야 이메일 확인 없이 바로 로그인할 수 있습니다!

#### 4단계: 사용자 메타데이터 추가 (선택사항)

"User metadata" 섹션에 다음 JSON을 추가하세요:

```json
{
  "name": "관리자",
  "nickname": "관리자",
  "businessInfo": {
    "businessName": "리밋 플래너",
    "businessNumber": "123-45-67890",
    "businessAddress": "서울시 강남구 테헤란로 123",
    "businessPhone": "02-1234-5678",
    "businessEmail": "business@remit-planner.com"
  },
  "settings": {
    "notifications": true,
    "theme": "light",
    "language": "ko"
  }
}
```

#### 5단계: 완료!

이제 다음 정보로 로그인할 수 있습니다:

- **이메일**: `admin@remit-planner.com`
- **비밀번호**: `123456`
- **아이디**: `admin` (자동 변환됨)

---

### **방법 2: 이메일 확인 비활성화 후 스크립트 실행**

#### 1단계: 이메일 확인 비활성화

1. Supabase Dashboard → **Authentication** → **Settings**
2. **Email Auth** 섹션 찾기
3. **"Enable email confirmations"** 체크 해제 ✅

#### 2단계: 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**환경 변수 찾는 방법:**

1. Supabase Dashboard → **Settings** → **API**
2. **Project URL** 복사 → `EXPO_PUBLIC_SUPABASE_URL`
3. **anon public key** 복사 → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

#### 3단계: Admin 계정 생성 스크립트 실행

```bash
npm run create-admin-account
```

**성공 시 출력:**

```
✅ Admin 계정이 성공적으로 생성되었습니다!
이메일: admin@remit-planner.com
비밀번호: 12345656
사용자 ID: [UUID]
```

---

## 🎉 로그인하기

이제 다음 정보로 로그인할 수 있습니다:

### **방법 1: 이메일로 로그인**

- **이메일**: `admin@remit-planner.com`
- **비밀번호**: `1234`

### **방법 2: 아이디로 로그인**

- **아이디**: `admin`
- **비밀번호**: `1234`
- (자동으로 `admin@remit-planner.com`으로 변환됨)

---

## 🚨 문제 해결

### 1. "Invalid login credentials" 오류

- **원인**: Admin 계정이 아직 생성되지 않았거나, 이메일 확인이 필요함
- **해결**: 위의 "방법 1" 또는 "방법 2"를 다시 시도

### 2. "User already registered" 오류

- **원인**: Admin 계정이 이미 존재하지만 이메일 미확인 상태
- **해결**: Supabase Dashboard에서 해당 사용자의 "Confirm email" 클릭

### 3. 환경 변수 오류

- **원인**: `.env` 파일이 없거나 잘못된 값
- **해결**: Supabase Dashboard → Settings → API에서 올바른 값 복사

### 4. 스크립트 실행 오류

```bash
# 의존성 재설치
npm install

# 다시 시도
npm run create-admin-account
```

---

## 📱 다음 단계

로그인 후:

1. **설정** 화면에서 프로필 정보 수정
2. **근로자 관리**에서 근로자 추가
3. **스케줄 관리**에서 일정 생성
4. 모든 데이터가 Supabase에 자동 동기화됩니다! 🎊

---

## 💡 참고사항

### Supabase Authentication 설정 확인

1. **Email confirmations**: 개발 중에는 비활성화 권장
2. **Auto-confirm users**: 활성화 권장
3. **Minimum password length**: 기본값 사용 (6자 이상)

### 보안 강화 (배포 시)

- 이메일 확인 활성화
- 강력한 비밀번호 정책 설정
- Rate limiting 설정
- Row Level Security (RLS) 정책 확인

---

## ✅ 체크리스트

- [ ] Supabase 프로젝트 생성됨
- [ ] 환경 변수 설정 완료 (`.env`)
- [ ] Admin 계정 생성 완료 (대시보드 또는 스크립트)
- [ ] 로그인 성공 ✅
- [ ] 설정 화면에서 정보 동기화 확인

모든 체크리스트가 완료되면 앱을 사용할 준비가 완료됩니다! 🚀
