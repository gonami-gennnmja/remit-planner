# 🚨 Supabase 설정 필요 - 422 에러 해결

## 📋 **현재 문제**

회원가입 시 **422 에러**가 발생하는 이유:

- Supabase 환경 변수가 설정되지 않음
- 잘못된 URL로 인증 요청 시도

## 🔧 **해결 방법**

### **1단계: Supabase 프로젝트 생성**

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. "New Project" 클릭
3. 프로젝트 이름: `remit-planner`
4. 데이터베이스 비밀번호 설정
5. 지역 선택 (Asia Northeast - Seoul 권장)

### **2단계: 환경 변수 설정**

프로젝트 루트에 `.env` 파일 생성:

```bash
# .env 파일 생성
touch .env
```

`.env` 파일에 다음 내용 추가:

```env
# Supabase 설정
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### **3단계: Supabase 정보 확인**

1. Supabase 대시보드 → Settings → API
2. **Project URL** 복사 → `EXPO_PUBLIC_SUPABASE_URL`에 입력
3. **anon public** 키 복사 → `EXPO_PUBLIC_SUPABASE_ANON_KEY`에 입력

### **4단계: 데이터베이스 스키마 설정**

Supabase SQL Editor에서 다음 스크립트 실행:

```sql
-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  nickname TEXT,
  business_info JSONB,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 접근 가능
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### **5단계: 앱 재시작**

```bash
# 개발 서버 재시작
npm start
# 또는
npx expo start
```

## ✅ **확인 방법**

1. 회원가입 시도
2. 422 에러가 사라지고 정상 회원가입 진행
3. Supabase 대시보드 → Authentication → Users에서 새 사용자 확인

## 🆘 **문제 해결**

### **여전히 422 에러가 발생하는 경우:**

1. **환경 변수 확인**:

   ```bash
   echo $EXPO_PUBLIC_SUPABASE_URL
   echo $EXPO_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Supabase URL 형식 확인**:

   - 올바른 형식: `https://your-project-id.supabase.co`
   - 잘못된 형식: `desxjvuxemvpertgcorh...co`

3. **API 키 확인**:

   - `anon` 키 사용 (public 키)
   - `service_role` 키는 사용하지 말 것

4. **네트워크 확인**:
   - 인터넷 연결 상태
   - 방화벽 설정

## 📞 **도움이 필요한 경우**

Supabase 설정에 문제가 있으면:

1. Supabase 대시보드 스크린샷 공유
2. `.env` 파일 내용 확인 (민감한 정보 제외)
3. 브라우저 개발자 도구의 Network 탭 에러 메시지 공유
