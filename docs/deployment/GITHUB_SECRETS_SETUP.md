# 🔐 GitHub Secrets 설정 방법

Expo에서 만든 토큰을 GitHub에 등록하는 방법입니다.

---

## 📍 등록 위치

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**

---

## 🎬 단계별 가이드

### 1단계: GitHub 저장소 접속

브라우저에서:

```
https://github.com/[사용자명]/remit-planner
```

### 2단계: Settings 클릭

저장소 상단 메뉴에서 **Settings** 탭 클릭

### 3단계: Secrets 메뉴 접근

왼쪽 사이드바에서:

```
Settings
  └─ Secrets and variables
      └─ Actions ← 여기 클릭!
```

### 4단계: New repository secret 클릭

상단 우측에 **"New repository secret"** 버튼 클릭

### 5단계: 토큰 등록

다음 정보 입력:

**Name (변수 이름):**

```
EXPO_TOKEN
```

⚠️ 정확히 `EXPO_TOKEN`로 입력 (대문자, 언더스코어)

**Secret (값):**

```
여기에_Expo에서_복사한_토큰_붙여넣기
```

⚠️ Expo에서 만든 토큰 전체를 붙여넣기

### 6단계: Add secret 클릭

우측 하단 **"Add secret"** 버튼 클릭

---

## ✅ 확인 방법

등록 후:

- Secrets 목록에 `EXPO_TOKEN`이 보이면 성공!
- 값을 다시 볼 수 없으니 백업해두세요 (필요시)

---

## 🔗 참고 링크

- GitHub Secrets 문서: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- Expo Access Tokens: https://expo.dev/accounts/[계정명]/settings/access-tokens

---

## 🎉 완료!

이제 GitHub Actions가 자동으로 빌드할 때 이 토큰을 사용합니다.

다음 단계는 `NEXT_STEPS.md`를 확인하세요! 🚀
