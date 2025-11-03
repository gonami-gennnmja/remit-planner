# 🔐 환경 변수 설정 가이드

## ❓ app.json에 실제 값을 넣어야 하나요?

**아니요!** `app.json`에는 placeholder를 그대로 두는 것이 안전합니다.

---

## 📊 환경 변수 우선순위

코드에서 다음과 같이 확인됩니다:

```typescript
// lib/supabase.ts
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || // 1순위: .env 파일
  Constants.expoConfig?.extra?.supabaseUrl || // 2순위: app.json
  "YOUR_SUPABASE_URL"; // 3순위: 기본값
```

**1순위 → 2순위 → 3순위 순서로 사용됩니다!**

---

## ✅ 올바른 설정 방법

### 개발 환경 (.env 파일)

프로젝트 루트에 `.env` 파일 생성:

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**이 파일은 Git에 커밋하지 마세요!**

- `.gitignore`에 이미 추가되어 있음
- 로컬 개발용으로만 사용

---

### 프로덕션 환경 (EAS Secrets)

실제 배포 시에는 EAS Secrets 사용:

```bash
# EAS Secrets에 저장
eas secret:create --scope project --name SUPABASE_URL --value https://your-project.supabase.co
eas secret:create --scope project --name SUPABASE_ANON_KEY --value eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**이것도 EAS 빌드 시에만 사용됩니다.**

---

### app.json (fallback)

`app.json`에는 placeholder를 그대로 둡니다:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "YOUR_SUPABASE_URL",
      "supabaseAnonKey": "YOUR_SUPABASE_ANON_KEY"
    }
  }
}
```

이것은 3순위 fallback입니다.

---

## 🔍 왜 이렇게 하나요?

### ❌ app.json에 실제 값을 넣으면 안 되는 이유:

1. **보안 위험**: `app.json`은 Git에 커밋됨

   - 실제 API 키가 GitHub에 노출됨
   - 저장소가 public이면 누구나 볼 수 있음

2. **환경 분리 불가**:

   - 개발/스테이징/프로덕션 환경을 구분할 수 없음
   - 각 환경마다 다른 Supabase 프로젝트 사용 불가

3. **유지보수 어려움**:
   - 실제 값을 변경할 때마다 파일 수정 필요
   - 자동화 어려움

---

## ✅ 올바른 흐름

### 개발 시:

```
.env 파일 (로컬)
  ↓
EXPO_PUBLIC_* 환경 변수
  ↓
앱 실행
```

### 프로덕션 배포 시:

```
EAS Secrets (클라우드)
  ↓
빌드 시 환경 변수로 주입
  ↓
앱 빌드 완료
```

---

## 📝 체크리스트

### 로컬 개발 환경

- [x] `.env` 파일에 실제 값 설정
- [x] `.env`는 `.gitignore`에 포함 (이미 설정됨)
- [ ] `npm start` 실행 시 환경 변수 로드되는지 확인

### 배포 환경

- [ ] EAS Secrets에 실제 값 등록
- [ ] `eas.json`에 환경 변수 명시 (선택사항)
- [ ] 첫 빌드 테스트

### app.json

- [ ] placeholder를 그대로 유지 (YOUR_SUPABASE_URL 등)
- [ ] 절대 실제 값을 넣지 않음!

---

## 🎯 지금 해야 할 일

1. **.env 파일 확인**

   ```bash
   # .env 파일이 있는지 확인
   cat .env
   # 또는
   type .env
   ```

2. **실제 값이 있는지 확인**

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://... (실제 URL)
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ... (실제 키)
   ```

3. **없으면 생성**

   ```bash
   # .env 파일 생성
   echo EXPO_PUBLIC_SUPABASE_URL=your_url_here > .env
   echo EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here >> .env
   ```

4. **app.json은 그대로 두기**
   - placeholder 유지 OK
   - 실제 값 넣으면 안 됨!

---

## ❓ FAQ

**Q: .env 파일이 작동하지 않아요**
A: 앱을 재시작해보세요. 환경 변수는 시작 시에만 로드됩니다.

**Q: 프로덕션 빌드 시 어떻게 설정하나요?**
A: EAS Secrets를 사용하세요. `eas secret:create` 명령어 사용.

**Q: app.json에 넣어도 되지 않나요?**
A: 기술적으로는 작동하지만, 보안상 매우 위험합니다. 절대 하지 마세요!

---

**요약**: **app.json은 placeholder 그대로, 실제 값은 .env 또는 EAS Secrets에!** ✅
