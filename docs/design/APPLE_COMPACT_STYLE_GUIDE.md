# 🍎 Apple Compact Style Guide

반반 앱의 새로운 메인 화면 디자인 가이드

## 📋 개요

Apple 디자인 언어를 기반으로, 데이터 밀도가 높은 비즈니스 앱에 최적화된 컴팩트한 스타일입니다.

### 디자인 철학

- **깔끔한 미니멀리즘**: Apple의 큰 타이포그래피 유지
- **정보 밀도**: 데이터가 많아도 압도적이지 않게 표현
- **친근한 사용성**: 이모지를 활용한 귀여움 유지

---

## 🎨 컬러 시스템

### 주요 컬러

```typescript
const colors = {
  // 텍스트
  primary: "#1d1d1f", // 메인 텍스트 (거의 검정)
  secondary: "#86868b", // 보조 텍스트 (회색)

  // 배경
  background: "#f5f5f7", // 전체 배경 (부드러운 회색)
  surface: "#ffffff", // 카드 배경 (순백)

  // 이모지 배경
  calendarBg: "#e8f0fe", // 캘린더 이모지 배경 (파란색)
  peopleBg: "#fef3e7", // 근로자 이모지 배경 (주황색)

  // 그림자
  shadow: "rgba(0, 0, 0, 0.04)", // 매우 연한 그림자
};
```

---

## 📝 타이포그래피

### 폰트 크기 체계

```typescript
const typography = {
  // 헤더
  headerTitle: 32, // "반반" - 대형 제목
  headerSubtitle: 15, // "김철수님" - 부제목

  // 카드 라벨
  cardLabel: 12, // "📅 오늘 일정" - 작은 라벨
  cardNumber: 28, // "3건" - 큰 숫자
  cardNumberBig: 32, // "8" - 작은 카드 숫자

  // 일정 카드
  scheduleTitle: 16, // "🔧 제품 A 설비 점검"
  scheduleText: 14, // "09:00 - 12:00"
  scheduleLocation: 14, // "📍 서울시 강남구..."

  // 섹션 제목
  sectionTitle: 20, // "오늘 일정"
};
```

### 폰트 굵기

- **700 (Bold)**: 제목, 큰 숫자
- **600 (Semibold)**: 부제목, 카드 제목
- **400 (Regular)**: 본문 텍스트

---

## 🎯 레이아웃 시스템

### 간격 (Spacing)

```typescript
const spacing = {
  // 외부 여백
  containerPadding: 20, // 화면 양옆
  headerPadding: 60, // 헤더 상단
  sectionSpacing: 24, // 섹션 간격

  // 카드 내부
  cardPadding: 16, // 카드 패딩
  cardGap: 10, // 카드 사이 간격
  contentGap: 12, // 컨텐츠 요소 간격

  // 이모지 박스
  emojiBoxSize: 56, // 이모지 박스 크기
  emojiBoxRadius: 12, // 이모지 박스 라운드
  emojiSize: 28, // 이모지 크기
};
```

### 카드 라운드

```typescript
const borderRadius = {
  card: 14, // 모든 카드
  emojiBox: 12, // 이모지 박스
  button: 50, // 버튼 (원형)
};
```

### 카드 그림자 (Shadow)

**Apple Compact의 그림자는 매우 연하게 설정됩니다:**

```typescript
const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04, // 매우 연한 그림자
  shadowRadius: 4,
  elevation: 2, // Android
};
```

**특징:**

- `shadowOpacity: 0.04` - 거의 보이지 않을 정도의 연한 그림자
- `shadowOffset: { width: 0, height: 1 }` - 아래로 1px 그림자
- `shadowRadius: 4` - 부드러운 그림자
- 모든 카드는 동일한 그림자 스타일 사용

---

## 📐 컴포넌트 가이드

### 1. 메인 화면 헤더

**구조:**

```
┌─────────────────────────────┐
│ 반반            [설정 아이콘] │
│ 김철수님                    │
└─────────────────────────────┘
```

**스타일:**

- 배경: 투명 (`transparent`)
- 상단 패딩: `60px`
- 양옆 패딩: `20px`
- 제목: 32px, Bold, 다크모드 지원
- 부제목: 15px, Regular, 다크모드 지원

**코드:**

```tsx
<View
  style={{
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: "transparent",
  }}
>
  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
    <View>
      <Text style={{ fontSize: 32, fontWeight: "700", color: colors.text }}>
        반반
      </Text>
      <Text style={{ fontSize: 15, color: colors.textSecondary }}>
        김철수님
      </Text>
    </View>
    <Pressable onPress={onSettings}>
      <Ionicons name="settings-outline" size={22} color={colors.text} />
    </Pressable>
  </View>
</View>
```

---

### 2. 공통 헤더 (Navigation Header)

**구조:**

```
┌─────────────────────────────────┐
│ [←]         오늘 일정        [×] │
├─────────────────────────────────┤
```

**스타일:**

- **배경**: `colors.surface` (다크모드 지원)
- **하단 경계선**: 얇은 border (그림자 없음)
- **패딩**: 상단 `60px`, 하단 `20px`, 양옆 `20px`
- **아이콘**: 24px, 배경 없음, 터치 피드백
- **제목**: 17px, Semi-bold, 중앙 정렬
- **클릭 영역**: 44x44px (Apple 권장)

**특징:**

- ❌ 그림자 사용하지 않음 (Apple 미니멀리즘)
- ✅ 얇은 경계선으로 섹션 구분
- ✅ 터치 피드백: `opacity: 0.6` + `hitSlop: 10`
- ✅ 라이트/다크모드 자동 전환

**코드:**

```tsx
<View
  style={[
    styles.header,
    {
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
    },
  ]}
>
  <View style={styles.headerContent}>
    {/* 왼쪽 버튼 */}
    <Pressable
      style={({ pressed }) => [
        styles.backButton,
        { opacity: pressed ? 0.6 : 1 },
      ]}
      onPress={onBack}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="arrow-back" size={24} color={colors.text} />
    </Pressable>

    {/* 제목 */}
    <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>

    {/* 오른쪽 버튼 */}
    <View style={styles.rightButton} />
  </View>
</View>;

const styles = {
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1, // 얇은 구분선
    // 그림자 사용하지 않음 - Apple 미니멀리즘
  },
  backButton: {
    width: 44, // Apple 권장 터치 영역
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  rightButton: {
    minWidth: 44,
    height: 44,
  },
};
```

---

### 3. 주요 기능 카드 (큰 카드)

**구조:**

```
┌─────────────────────────────────┐
│ 📅 오늘 일정        [📅 이모지]  │
│ 3건                            │
└─────────────────────────────────┘
```

**특징:**

- 전체 너비 사용
- 왼쪽: 텍스트 정보
- 오른쪽: 이모지 박스
- 라벨 + 큰 숫자 구조

**코드:**

```tsx
<Pressable
  style={{
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  }}
>
  <View style={{ flexDirection: "row", gap: 12 }}>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 12, color: "#86868b" }}>📅 오늘 일정</Text>
      <Text style={{ fontSize: 28, fontWeight: "700", color: "#1d1d1f" }}>
        3건
      </Text>
    </View>
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: "#e8f0fe",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 28 }}>📅</Text>
    </View>
  </View>
</Pressable>
```

---

### 4. 주요 기능 카드 (작은 카드, 2열)

**구조:**

```
┌──────────┬──────────┐
│ 🏢 거래처│💰 급여 관리│
│ 8        │ 월별 관리 │
└──────────┴──────────┘
```

**특징:**

- 2열 그리드
- 간격: `10px`
- 숫자가 더 크거나 (32px) 텍스트만 표시

**코드:**

```tsx
<View style={{ flexDirection: "row", gap: 10 }}>
  <View style={{ flex: 1 }}>
    <Pressable style={cardStyle}>
      <Text style={{ fontSize: 12, color: "#86868b" }}>🏢 거래처</Text>
      <Text style={{ fontSize: 32, fontWeight: "700" }}>8</Text>
    </Pressable>
  </View>
  <View style={{ flex: 1 }}>
    <Pressable style={cardStyle}>
      <Text style={{ fontSize: 12, color: "#86868b" }}>💰 이번 달 급여</Text>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>₩2.4M</Text>
    </Pressable>
  </View>
</View>
```

---

### 5. 일정 카드

**구조:**

```
┌───────────────────────────────┐
│ 🔧 제품 A 설비 점검           │
│ 09:00 - 12:00                 │
│ 📍 서울시 강남구 테헤란로     │
└───────────────────────────────┘
```

**특징:**

- 이모지 + 제목
- 시간 정보
- 위치 정보 (이모지 포함)

**코드:**

```tsx
<View
  style={{
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  }}
>
  <Text style={{ fontSize: 16, fontWeight: "600" }}>🔧 제품 A 설비 점검</Text>
  <Text style={{ fontSize: 14, color: "#86868b" }}>09:00 - 12:00</Text>
  <Text style={{ fontSize: 14, color: "#86868b" }}>
    📍 서울시 강남구 테헤란로
  </Text>
</View>
```

---

## 🌈 이모지 사용 가이드

### 이모지 맵핑

```typescript
const emojiMapping = {
  // 카테고리
  "오늘 일정": "📅",
  "등록 근로자": "👥",
  거래처: "🏢",
  "급여 관리": "💰",

  // 일정 타입
  "설비 점검": "🔧",
  냉난방: "❄️",
  전기: "⚡",
  수도: "💧",
  청소: "🧹",

  // 아이콘
  위치: "📍",
  시간: "🕐",
  파일: "📎",
};
```

### 이모지 박스 컬러

```typescript
const emojiBoxColors = {
  calendar: "#e8f0fe", // 파란색
  people: "#fef3e7", // 주황색
  building: "#f0fdf4", // 초록색
  money: "#fef2f2", // 빨간색
};
```

---

## 📱 반응형 규칙

### 모바일 (< 768px)

- 모든 카드는 전체 너비
- 큰 카드: 수직 스택
- 작은 카드: 2열 그리드

### 태블릿 (768px - 1024px)

- 큰 카드: 2열 가능
- 작은 카드: 2-3열

### 데스크톱 (> 1024px)

- 큰 카드: 최대 2열
- 섹션 너비: `max-width: 1200px`

---

## ✨ 애니메이션

### 카드 인터랙션

```typescript
// 탭 피드백
<TouchableOpacity
  activeOpacity={0.7}  // 탭 시 약간 투명해짐
>
```

### 스크롤

```typescript
<ScrollView
  showsVerticalScrollIndicator={false}  // 스크롤 바 숨김
>
```

---

## 🎯 Apple vs Apple Compact 비교

| 요소      | Apple 원본 | Apple Compact |
| --------- | ---------- | ------------- |
| 큰 숫자   | 48px       | 28px          |
| 작은 숫자 | 42px       | 32px          |
| 카드 패딩 | 24px       | 16px          |
| 카드 간격 | 12px       | 10px          |
| 라운드    | 20px       | 14px          |
| 그림자    | 약함       | 매우 약함     |
| 이모지    | 없음       | 있음          |

---

## 🔄 기존 스타일에서 변경 사항

### Before (기존 테마 기반)

- ✅ 파란색 헤더
- ❌ 큰 아이콘 + 배경색
- ❌ 그림자 과도
- ❌ 색상 과다

### After (Apple Compact)

- ✅ 투명 배경, 큰 타이포그래피
- ✅ 이모지 아이콘 + 배경색
- ✅ 매우 얕은 그림자
- ✅ 깔끔한 컬러 시스템

---

## 📊 사용 예시

### 완성된 레이아웃

```
┌─────────────────────────────────┐
│ 반반                     [⚙️]   │
│ 김철수님                        │
├─────────────────────────────────┤
│                                 │
│ 📅 오늘 일정        [📅]        │
│ 3건                            │
│                                 │
│ 👥 등록 근로자      [👥]        │
│ 12명                           │
│                                 │
│ 🏢 거래처    │  💰 급여 관리    │
│ 8          │  월별 관리        │
│                                 │
│ ── 오늘 일정 ──                 │
│                                 │
│ 🔧 제품 A 설비 점검             │
│ 09:00 - 12:00                   │
│ 📍 서울시 강남구...             │
│                                 │
│ ❄️ B 건물 냉난방 점검           │
│ 14:00 - 16:00                   │
│ 📍 서울시 서초구...             │
└─────────────────────────────────┘
```

---

## 🛠️ 구현 참고

### 전체 배경색

```typescript
backgroundColor: "#f5f5f7";
```

### 카드 기본 스타일

모든 카드는 다음 스타일을 사용합니다:

```typescript
const cardStyle = {
  backgroundColor: "#fff", // 순백
  padding: 16, // Apple Compact card padding
  borderRadius: 14, // Apple Compact card border radius
  marginBottom: 10, // Apple Compact card gap
  // 그림자 (모든 카드에 동일하게 적용)
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04, // 매우 연한 그림자
  shadowRadius: 4,
  elevation: 2, // Android
};
```

**중요:** 모든 화면의 모든 카드는 이 그림자 스타일을 유지해야 합니다.

- `shadowOpacity`는 항상 `0.04`로 유지
- `shadowRadius`는 항상 `4`로 유지
- `shadowOffset`은 항상 `{ width: 0, height: 1 }`로 유지

### 텍스트 순서

1. 이모지 + 라벨 (12px, 회색)
2. 큰 숫자/텍스트 (28-32px, Bold, 검정)
3. 보조 설명 (14px, 회색, 선택적)

---

## 📝 체크리스트

새 컴포넌트 추가 시 확인사항:

- [ ] 배경색이 `#fff`인가?
- [ ] 라운드가 `14px`인가?
- [ ] 그림자 스타일이 통일되었는가?
  - [ ] `shadowOpacity: 0.04`인가?
  - [ ] `shadowRadius: 4`인가?
  - [ ] `shadowOffset: { width: 0, height: 1 }`인가?
  - [ ] `elevation: 2`인가?
- [ ] 패딩이 `16px`인가?
- [ ] 카드 간격이 `10px`인가?
- [ ] 텍스트 크기가 가이드에 맞는가?
- [ ] 이모지가 적절히 사용되었는가?
- [ ] 색상이 컬러 시스템에 맞는가?

---

## 🎨 디자인 참고

이 스타일은 다음 디자인 시스템에서 영감을 받았습니다:

- **Apple Human Interface Guidelines**: 큰 타이포그래피, 넓은 여백
- **Material Design 3**: 얕은 그림자, 라운드 모서리
- **iOS 16+**: 블러 효과, 투명 배경
- **Custom**: 이모지 활용

---

## 📚 관련 문서

- [UI_REDESIGN_PROPOSAL.md](../UI_REDESIGN_PROPOSAL.md) - 초기 개선 제안
- [PERFORMANCE_ISSUES.md](../PERFORMANCE_ISSUES.md) - 성능 최적화 가이드

---

**마지막 업데이트**: 2024년 1월
**작성자**: AI Assistant
**버전**: 1.0.0
