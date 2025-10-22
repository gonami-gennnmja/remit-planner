# 데이터베이스 마이그레이션 가이드

## 현재 구조: SQLite

현재 앱은 **SQLite** 데이터베이스를 사용하여 로컬에 데이터를 저장합니다.

### 장점

- ✅ 오프라인 작동
- ✅ 빠른 성능
- ✅ 추가 비용 없음
- ✅ 설정 간단

### 단점

- ❌ 디바이스 간 동기화 불가
- ❌ 백업 기능 없음 (디바이스 분실 시 데이터 손실)
- ❌ 웹과 앱 간 데이터 공유 불가

---

## 미래 구조: Supabase로 전환

나중에 클라우드 동기화가 필요할 때 **Supabase**로 쉽게 전환할 수 있습니다.

### Supabase 장점

- ✅ 실시간 동기화
- ✅ 자동 백업
- ✅ 디바이스 간 데이터 공유
- ✅ 웹과 앱 모두 지원
- ✅ 인증 내장 (로그인/회원가입)
- ✅ PostgreSQL 기반 (강력한 쿼리)

### 전환 방법

#### 1. Supabase 프로젝트 생성

```bash
# Supabase 웹사이트에서 프로젝트 생성
# https://supabase.com/
```

#### 2. 라이브러리 설치

```bash
npm install @supabase/supabase-js
```

#### 3. 데이터베이스 스키마 생성

Supabase SQL 에디터에서 `database/schema.sql` 파일의 내용을 실행합니다.

```sql
-- database/schema.sql 내용을 Supabase에서 실행
```

#### 4. Supabase Repository 구현

`database/supabaseRepository.ts` 파일을 만들고 `IDatabase` 인터페이스를 구현합니다.

```typescript
// database/supabaseRepository.ts
import { createClient } from "@supabase/supabase-js";
import { IDatabase } from "./interface";

const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseKey = "YOUR_SUPABASE_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseRepository implements IDatabase {
  // IDatabase 인터페이스의 모든 메서드 구현
  async init() {
    // 초기화 로직
  }

  async createWorker(worker: Worker) {
    const { data, error } = await supabase.from("workers").insert([worker]);
    // ...
  }

  // ... 나머지 메서드 구현
}

export const database = new SupabaseRepository();
```

#### 5. 데이터베이스 전환

`database/index.ts` 파일 한 줄만 변경하면 됩니다:

```typescript
// Before: SQLite 사용
export { database } from "./sqliteRepository";

// After: Supabase 사용
export { database } from "./supabaseRepository";
```

#### 6. 데이터 마이그레이션

기존 SQLite 데이터를 Supabase로 옮기는 스크립트:

```typescript
// scripts/migrate-to-supabase.ts
import { sqliteDb } from "../database/sqlite";
import { database as supabase } from "../database/supabaseRepository";

async function migrate() {
  // 1. SQLite에서 모든 데이터 가져오기
  const workers = await sqliteDb.executeQuery("SELECT * FROM workers");
  const schedules = await sqliteDb.executeQuery("SELECT * FROM schedules");

  // 2. Supabase에 업로드
  for (const worker of workers) {
    await supabase.createWorker(worker);
  }

  for (const schedule of schedules) {
    await supabase.createSchedule(schedule);
  }

  console.log("✅ Migration complete!");
}

migrate();
```

---

## 파일 구조

```
database/
├── index.ts                 # 메인 export (여기서 DB 전환)
├── interface.ts             # 데이터베이스 인터페이스 정의
├── schema.ts                # SQLite 스키마
├── sqlite.ts                # SQLite 연결 관리
├── sqliteRepository.ts      # SQLite 구현 (현재 사용 중)
└── supabaseRepository.ts    # Supabase 구현 (나중에 추가)
```

---

## 테이블 구조

### workers

- id (TEXT PRIMARY KEY)
- name (TEXT)
- phone (TEXT)
- bank_account (TEXT)
- hourly_wage (INTEGER)
- tax_withheld (INTEGER: 0 or 1)

### schedules

- id (TEXT PRIMARY KEY)
- title (TEXT)
- description (TEXT)
- date (TEXT: YYYY-MM-DD)
- category (TEXT: education, event, meeting, others)

### schedule_workers

- id (TEXT PRIMARY KEY)
- schedule_id (TEXT)
- worker_id (TEXT)
- paid (INTEGER: 0 or 1)
- work_hours (REAL)

### work_periods

- id (TEXT PRIMARY KEY)
- schedule_worker_id (TEXT)
- start_time (TEXT: ISO 8601)
- end_time (TEXT: ISO 8601)

---

## 추가 고려사항

### 오프라인 우선 (Offline-First)

Supabase로 전환 후에도 오프라인 기능을 유지하려면:

1. SQLite는 로컬 캐시로 계속 사용
2. Supabase는 백그라운드 동기화용
3. 충돌 해결 로직 추가

### 인증 (Authentication)

Supabase로 전환 시 사용자 인증 추가:

```typescript
// 로그인
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password",
});

// Row Level Security로 사용자별 데이터 격리
```

---

## 비용 예상

### SQLite (현재)

- **무료**

### Supabase

- **무료 플랜**:

  - 500MB 데이터베이스
  - 50,000명 MAU (월간 활성 사용자)
  - 2GB 파일 스토리지
  - 충분히 시작할 수 있는 수준

- **Pro 플랜** ($25/월):
  - 8GB 데이터베이스
  - 100,000명 MAU
  - 100GB 파일 스토리지

---

## 결론

현재는 SQLite로 시작하되, 나중에 필요할 때 `database/index.ts` 파일 한 줄만 바꾸면 Supabase로 전환할 수 있도록 설계되어 있습니다!

**다음 단계**: 사용자가 늘어나거나 디바이스 간 동기화가 필요할 때 이 가이드를 참고하여 Supabase로 전환하세요.
