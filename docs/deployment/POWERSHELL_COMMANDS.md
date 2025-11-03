# 💻 PowerShell 명령어 가이드

Windows PowerShell에서 사용할 명령어 모음입니다.

---

## 🔄 파일 삭제

### macOS/Linux

```bash
rm -rf node_modules package-lock.json
```

### PowerShell ⭐

```powershell
Remove-Item -Recurse -Force node_modules,package-lock.json -ErrorAction SilentlyContinue
```

---

## 📦 패키지 관리

### 재설치

```powershell
# 삭제
Remove-Item -Recurse -Force node_modules,package-lock.json -ErrorAction SilentlyContinue

# 설치
npm install
```

### 의존성 업데이트

```powershell
npm install
npm update
```

---

## 🚀 배포 명령어

### EAS 빌드

```powershell
eas build --platform android --profile preview --clear-cache
```

### Expo 실행

```powershell
npm start
```

### 타입 체크

```powershell
npx tsc --noEmit
```

---

## 📁 파일 관리

### 파일 복사

```powershell
Copy-Item source.txt destination.txt
```

### 디렉토리 생성

```powershell
New-Item -ItemType Directory -Force -Path "folder-name"
```

### 파일 찾기

```powershell
Get-ChildItem -Recurse -Filter "*.ts"
```

---

## 🐛 문제 해결

### 포트 종료

```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 8081).OwningProcess | Stop-Process
```

### 캐시 클리어

```powershell
npm start -- --clear
```

---

## 📝 Git 명령어

### 상태 확인

```powershell
git status
```

### 커밋

```powershell
git add .
git commit -m "message"
git push origin main
```

---

## 🔗 유용한 링크

- [PowerShell 문서](https://docs.microsoft.com/powershell/)
- [NPM 문서](https://docs.npmjs.com/)

---

**요약**: PowerShell에서는 `rm -rf` 대신 `Remove-Item -Recurse -Force` 사용! ✅
