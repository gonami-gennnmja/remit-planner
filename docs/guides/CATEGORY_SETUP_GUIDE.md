# 카테고리 시스템 설정 가이드

## 📋 개요

이 앱의 카테고리 시스템은 **시스템 기본 카테고리**와 **사용자별 커스텀 카테고리**로 구성됩니다.

## 🏗️ 테이블 구조

### `categories` 테이블

| 필드         | 타입      | 설명                                 |
| ------------ | --------- | ------------------------------------ |
| `id`         | TEXT      | 카테고리 고유 ID (PK)                |
| `name`       | TEXT      | 카테고리 이름                        |
| `color`      | TEXT      | 카테고리 색상 (hex)                  |
| `user_id`    | UUID      | 사용자 ID (NULL이면 시스템 카테고리) |
| `is_system`  | BOOLEAN   | 시스템 카테고리 여부                 |
| `created_at` | TIMESTAMP | 생성일시                             |

### 제약 조건

- `UNIQUE(user_id, name)`: 같은 사용자는 중복된 카테고리명 사용 불가
- 시스템 카테고리는 `user_id = NULL`, `is_system = TRUE`

## 🔒 Row Level Security (RLS)

### 조회 (SELECT)

- ✅ 모든 사용자는 **시스템 카테고리** 조회 가능
- ✅ 사용자는 **자신의 카테고리**만 조회 가능

### 생성 (INSERT)

- ✅ 사용자는 **자신의 카테고리**만 생성 가능
- ❌ 시스템 카테고리는 생성 불가

### 수정/삭제 (UPDATE/DELETE)

- ✅ 사용자는 **자신의 카테고리**만 수정/삭제 가능
- ❌ 시스템 카테고리는 수정/삭제 불가

## 🎯 시스템 기본 카테고리

모든 사용자에게 기본으로 제공되는 카테고리:

1. **교육** (#8b5cf6 - 보라색)
2. **업무** (#06b6d4 - 청록색)

## 🚀 설정 방법

### 1. 마이그레이션 실행

Supabase 대시보드 → SQL Editor에서 실행:

```sql
-- 파일: supabase/migrations/20251021060000_update_categories_user_based.sql
```

또는 Supabase CLI 사용:

```bash
supabase db push
```

### 2. 스크립트로 초기화 (선택사항)

```bash
npx ts-node scripts/init-categories.ts
```

## 💡 사용 방법

### 카테고리 조회

```typescript
const db = getDatabase();
const categories = await db.getAllCategories();

// 결과:
// - 시스템 카테고리 (교육, 업무)
// - 현재 사용자의 커스텀 카테고리
```

### 카테고리 추가

앱에서:

1. 일정 추가 모달 열기
2. 카테고리 섹션의 "추가" 버튼 클릭
3. 카테고리 이름 입력
4. 자동으로 랜덤 색상 할당됨

코드:

```typescript
const db = getDatabase();
await db.createCategory({
  id: `cat-${Date.now()}`,
  name: "새 카테고리",
  color: "#10b981",
});
```

## 🔍 데이터 확인

### Supabase 대시보드

1. Table Editor → `categories` 테이블
2. 시스템 카테고리: `user_id = NULL`, `is_system = TRUE`
3. 사용자 카테고리: `user_id = (사용자 UUID)`, `is_system = FALSE`

### 브라우저 콘솔

일정 추가 모달을 열면:

```
📊 로드된 카테고리: [
  { id: 'cat-education', name: '교육', isSystem: true, ... },
  { id: 'cat-work', name: '업무', isSystem: true, ... },
  { id: 'cat-1234567890', name: '내 카테고리', isSystem: false, userId: '...' }
]
```

## 🐛 문제 해결

### 카테고리가 안 보여요

1. **시스템 카테고리 확인**

   ```sql
   SELECT * FROM categories WHERE is_system = TRUE;
   ```

   비어있다면:

   ```sql
   INSERT INTO categories (id, name, color, user_id, is_system) VALUES
     ('cat-education', '교육', '#8b5cf6', NULL, TRUE),
     ('cat-work', '업무', '#06b6d4', NULL, TRUE);
   ```

2. **RLS 정책 확인**

   - Supabase 대시보드 → Authentication → Policies
   - `categories` 테이블의 정책 활성화 여부 확인

3. **로그인 상태 확인**
   - 사용자가 로그인되어 있어야 조회 가능

### 카테고리 추가가 안 돼요

1. **중복 이름 확인**

   - 같은 이름의 카테고리가 이미 존재하는지 확인

2. **인증 상태 확인**

   ```typescript
   const {
     data: { user },
   } = await supabase.auth.getUser();
   console.log("현재 사용자:", user);
   ```

3. **에러 로그 확인**
   - 브라우저 콘솔에서 에러 메시지 확인

## 📝 주의사항

- ⚠️ 시스템 카테고리는 **수정/삭제 불가**
- ⚠️ 카테고리 이름은 **사용자별로 unique**
- ⚠️ 카테고리 삭제 시 해당 카테고리를 사용하는 일정 확인 필요 (cascade 설정 필요 시 별도 처리)
