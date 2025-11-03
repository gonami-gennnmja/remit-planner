# 🖼️ 이미지 파일 형식 문제 해결

## 🚨 문제

빌드가 실패하는 원인:
```
ERROR: assets_images_favicon.png: AAPT: error: file failed to compile.
```

**원인**: `icon.png`와 `favicon.png`가 실제로는 JPEG 파일입니다.

---

## ✅ 해결 방법

### 방법 1: PNG로 변환 (권장)

**온라인 도구 사용**:
1. https://cloudconvert.com/jpg-to-png 접속
2. 또는 https://imageresizer.com/jpg-to-png 접속
3. `assets/images/icon.png` 업로드
4. PNG로 변환 후 다운로드
5. 원본 파일 교체

**PowerShell 사용** (ImageMagick 필요):
```powershell
# ImageMagick 설치 필요
magick convert assets/images/icon.png assets/images/icon_real.png
```

---

### 방법 2: 임시 해결 (빠른 테스트용)

**app.json 수정**:

```json
{
  "expo": {
    "icon": "./assets/images/icon.jpg",  // .png → .jpg
    "web": {
      // favicon 제거
    }
  }
}
```

**주의**: 이 방법은 임시입니다. 나중에 반드시 PNG로 변환해야 합니다.

---

### 방법 3: 마스크 처리 (권장)

JavaScript에서 이미지 참조 수정:

```typescript
// LoginScreen.tsx
<Image
  source={require("@/assets/images/favicon.png")}
  // favicon.jpg로 변경하거나
  // 또는 코드에서 제거
/>
```

---

## 📋 체크리스트

- [ ] `assets/images/icon.png`가 실제 PNG인지 확인
- [ ] `assets/images/favicon.png`가 실제 PNG인지 확인
- [ ] `assets/images/adaptive-icon.png` 확인
- [ ] `assets/images/splash-icon.png` 확인

---

## 🔍 이미지 형식 확인 방법

```powershell
# PNG 여부 확인 (PNG는 첫 바이트가 89 50 4E 47)
Get-Content assets/images/icon.png -TotalCount 5 -Encoding Byte | ForEach-Object { "{0:X2}" -f $_ }

# PNG가 맞으면: 89 50 4E 47 ...
# JPEG면: FF D8 FF E0 ...
```

---

## 🎯 권장 작업 순서

1. **온라인 도구로 PNG 변환** (30초)
2. **변환된 파일로 교체**
3. **빌드 재시도**

---

**원본 이미지가 있으시면 PNG로 다시 저장하세요!** 

JPEG → PNG 변환은 무손실로 가능합니다.

