# 🔒 데이터 보안 레벨(계층) 구조 설명

## 📊 **3단계 보안 레벨 구조**

```
┌─────────────────────────────────────────────────┐
│  👤 사용자 (User)                                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  🔐 레벨 1: 인증 레벨 (Authentication Level)     │
│  - Supabase Auth                                │
│  - 사용자 로그인/로그아웃                          │
│  - 토큰 관리                                     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  💻 레벨 2: 애플리케이션 레벨 (Application Level)│
│  - React Native 코드                            │
│  - database/supabaseRepository.ts               │
│  - user_id 필터링 (.eq('user_id', user.id))    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  🗄️ 레벨 3: 데이터베이스 레벨 (Database Level)   │
│  - Supabase PostgreSQL                          │
│  - Row Level Security (RLS)                     │
│  - SQL 정책 (Policies)                          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  💾 실제 데이터 (Actual Data)                    │
└─────────────────────────────────────────────────┘
```

---

## 🔐 **레벨 1: 인증 레벨 (Authentication Level)**

### **역할:**

"이 사람이 누구인지 확인"

### **사용 시점:**

- 로그인할 때
- 회원가입할 때
- 토큰이 유효한지 확인할 때

### **예시:**

```typescript
// utils/supabaseAuth.ts
async function loginWithSupabase(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.user; // ✅ 사용자 인증 완료
}
```

### **이 레벨에서 막는 것:**

- ❌ 로그인하지 않은 사용자의 접근
- ❌ 잘못된 비밀번호로 로그인 시도
- ❌ 만료된 토큰 사용

### **이 레벨에서 못 막는 것:**

- 로그인한 사용자 A가 사용자 B의 데이터를 보는 것
  → 다음 레벨에서 막아야 함!

---

## 💻 **레벨 2: 애플리케이션 레벨 (Application Level)**

### **역할:**

"이 사람이 자기 데이터만 보고 있는지 확인"

### **사용 시점:**

- 데이터를 조회할 때
- 데이터를 생성할 때
- 데이터를 수정할 때
- 데이터를 삭제할 때

### **예시:**

```typescript
// database/supabaseRepository.ts
async getAllWorkers(): Promise<any[]> {
  const user = await this.getCurrentUser()  // ✅ 현재 로그인한 사용자 확인

  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('user_id', user.id)  // ✅ 자기 데이터만 조회
    .order('created_at', { ascending: false })

  return data
}

async updateWorker(id: string, worker: any): Promise<void> {
  const user = await this.getCurrentUser()

  const { error } = await supabase
    .from('workers')
    .update({ ... })
    .eq('id', id)
    .eq('user_id', user.id)  // ✅ 자기 데이터만 수정
}
```

### **이 레벨에서 막는 것:**

- ❌ 사용자 A가 사용자 B의 근로자 목록 조회
- ❌ 사용자 A가 사용자 B의 일정 수정
- ❌ 사용자 A가 사용자 B의 거래처 삭제

### **이 레벨에서 못 막는 것:**

- 코드를 우회해서 직접 데이터베이스에 접근하는 경우
- Postman 같은 도구로 API를 직접 호출하는 경우
  → 다음 레벨에서 막아야 함!

---

## 🗄️ **레벨 3: 데이터베이스 레벨 (Database Level)**

### **역할:**

"어떤 방법으로든 데이터베이스에 접근하더라도 자기 데이터만 볼 수 있게 강제"

### **사용 시점:**

- **항상!** (모든 데이터베이스 접근에 자동 적용)
- 앱에서 접근할 때도
- Postman으로 API 호출할 때도
- SQL Editor에서 직접 쿼리할 때도

### **예시:**

```sql
-- Row Level Security (RLS) 정책
CREATE POLICY "Users can view their own workers" ON workers
  FOR SELECT USING (auth.uid() = user_id);
  -- ✅ auth.uid()와 user_id가 같을 때만 조회 가능

CREATE POLICY "Users can update their own workers" ON workers
  FOR UPDATE USING (auth.uid() = user_id);
  -- ✅ auth.uid()와 user_id가 같을 때만 수정 가능
```

### **실제 작동 예시:**

#### **사용자 A (user_id = 'aaa-111') 로그인 상태**

```sql
-- 사용자 A가 실행하는 쿼리
SELECT * FROM workers;

-- 실제 데이터베이스에서 실행되는 쿼리 (RLS 자동 적용)
SELECT * FROM workers WHERE user_id = 'aaa-111';
-- ✅ 자기 데이터만 반환됨
```

#### **사용자 A가 악의적으로 시도해도 차단**

```sql
-- 사용자 A가 사용자 B의 데이터를 보려고 시도
SELECT * FROM workers WHERE user_id = 'bbb-222';

-- 실제 데이터베이스에서 실행되는 쿼리 (RLS 자동 적용)
SELECT * FROM workers WHERE user_id = 'bbb-222' AND user_id = 'aaa-111';
-- ❌ 조건이 모순이므로 빈 결과 반환
```

### **이 레벨에서 막는 것:**

- ❌ 코드 우회해서 직접 DB 접근
- ❌ Postman으로 API 직접 호출
- ❌ SQL Editor에서 다른 사용자 데이터 조회
- ❌ 해커가 SQL Injection 시도

### **이 레벨의 특징:**

- **완전 자동**: 개발자가 `.eq('user_id', user.id)`를 깜빡해도 DB에서 자동 차단
- **최후의 방어선**: 어떤 방법으로든 뚫을 수 없음

---

## 🎯 **각 레벨을 언제 사용하는가?**

### **✅ 인증 레벨 (레벨 1)**

**사용 시점:**

- 로그인/로그아웃 기능 구현할 때
- 회원가입 기능 구현할 때
- 소셜 로그인 구현할 때
- 비밀번호 재설정 구현할 때

**파일:**

- `utils/supabaseAuth.ts`
- `components/LoginScreen.tsx`
- `app/signup.tsx`
- `app/forgot-password.tsx`

---

### **✅ 애플리케이션 레벨 (레벨 2)**

**사용 시점:**

- 데이터베이스 CRUD 작업할 때 (항상)
- API 호출할 때
- 비즈니스 로직 구현할 때

**파일:**

- `database/supabaseRepository.ts` ← 여기에 `.eq('user_id', user.id)` 추가
- 모든 데이터베이스 관련 함수

**원칙:**

```typescript
// ❌ 나쁜 예: user_id 필터링 없음
async getAllWorkers() {
  return await supabase.from('workers').select('*')
}

// ✅ 좋은 예: user_id 필터링 있음
async getAllWorkers() {
  const user = await this.getCurrentUser()
  return await supabase
    .from('workers')
    .select('*')
    .eq('user_id', user.id)  // ✅ 반드시 추가!
}
```

---

### **✅ 데이터베이스 레벨 (레벨 3)**

**사용 시점:**

- 프로젝트 초기 설정할 때 (1회)
- 새로운 테이블 추가할 때
- 보안 정책 변경할 때

**위치:**

- Supabase Dashboard > SQL Editor
- 마이그레이션 파일 (`supabase/migrations/`)

**설정 방법:**

```sql
-- 1. RLS 활성화
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- 2. 정책 생성
CREATE POLICY "Users can view their own workers" ON workers
  FOR SELECT USING (auth.uid() = user_id);
```

**설정 후:**

- 자동으로 모든 쿼리에 적용됨
- 개발자가 신경 쓸 필요 없음
- 영구적으로 보안 유지

---

## 🔄 **3단계가 함께 작동하는 예시**

### **시나리오: 사용자 A가 근로자 목록을 조회**

```
1️⃣ 인증 레벨 (Authentication Level)
   사용자 A 로그인 → 토큰 발급 → "이 사람은 사용자 A입니다" ✅

2️⃣ 애플리케이션 레벨 (Application Level)
   const user = await getCurrentUser()  // user.id = 'aaa-111'
   .eq('user_id', user.id)  // WHERE user_id = 'aaa-111'
   → "사용자 A의 데이터만 요청합니다" ✅

3️⃣ 데이터베이스 레벨 (Database Level)
   RLS 정책 자동 적용:
   WHERE user_id = auth.uid()  // AND user_id = 'aaa-111'
   → "데이터베이스에서도 사용자 A의 데이터만 반환합니다" ✅
```

### **시나리오: 해커가 사용자 B의 데이터를 훔치려고 시도**

```
1️⃣ 인증 레벨
   해커가 사용자 A의 토큰으로 로그인 → ✅ 통과 (정상 사용자처럼 보임)

2️⃣ 애플리케이션 레벨
   해커가 코드를 우회하거나 Postman으로 직접 API 호출
   .eq('user_id', 'bbb-222')  // 사용자 B의 데이터 요청
   → ⚠️ 통과 가능 (코드를 우회했으므로)

3️⃣ 데이터베이스 레벨
   RLS 정책 자동 적용:
   WHERE user_id = 'bbb-222' AND user_id = 'aaa-111'  // 모순!
   → ❌ 차단! 빈 결과 반환
```

**결론: 레벨 2를 우회해도 레벨 3에서 막힘!**

---

## 📋 **요약표**

| 레벨   | 이름              | 역할                    | 설정 위치                        | 설정 시점               | 자동 적용                           |
| ------ | ----------------- | ----------------------- | -------------------------------- | ----------------------- | ----------------------------------- |
| **1️⃣** | 인증 레벨         | 누구인지 확인           | `utils/supabaseAuth.ts`          | 로그인/회원가입 구현 시 | ❌ 수동                             |
| **2️⃣** | 애플리케이션 레벨 | 자기 데이터만 접근      | `database/supabaseRepository.ts` | 모든 DB 작업 시         | ❌ 수동 (`.eq('user_id', user.id)`) |
| **3️⃣** | 데이터베이스 레벨 | 어떤 접근이든 강제 차단 | Supabase SQL Editor              | 프로젝트 초기 1회       | ✅ 자동 (RLS)                       |

---

## 🎯 **결론**

### **왜 3단계가 모두 필요한가?**

- **레벨 1 (인증)**: 로그인하지 않은 사용자 차단
- **레벨 2 (앱)**: 정상적인 사용 시 빠른 필터링
- **레벨 3 (DB)**: 코드 우회 시도 차단 (최후의 방어선)

### **우리 프로젝트 현황:**

- ✅ **레벨 1 (인증)**: Supabase Auth로 완료
- ✅ **레벨 2 (앱)**: `.eq('user_id', user.id)` 모든 메서드에 추가 완료
- ⚠️ **레벨 3 (DB)**: SQL 준비 완료, **Supabase에 실행 필요**

### **다음 할 일:**

`DATABASE_LEVEL_SECURITY_SETUP_GUIDE.md`를 보고 Supabase에서 SQL 실행하면 **완벽한 3단계 보안 완성!** 🎉
