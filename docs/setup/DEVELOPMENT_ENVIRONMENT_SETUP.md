# 🖥️ 개발 환경 설정 가이드 (macOS / Windows)

이 문서는 macOS와 Windows를 오가며 개발할 때 필요한 환경 설정을 안내합니다.

## 📋 목차

- [공통 요구사항](#공통-요구사항)
- [macOS 설정](#macos-설정)
- [Windows 설정](#windows-설정)
- [크로스 플랫폼 팁](#크로스-플랫폼-팁)
- [문제 해결](#문제-해결)

---

## 🔧 공통 요구사항

### 필수 소프트웨어

#### 1. Node.js & npm

- **권장 버전**: Node.js v18 이상 (LTS)
- **설치 방법**: nvm(macOS) 또는 nvm-windows(Windows) 사용 권장

#### 2. Git

- **macOS**: Xcode Command Line Tools 또는 Homebrew
- **Windows**: [Git for Windows](https://git-scm.com/download/win)

#### 3. 코드 에디터

- **VS Code** (권장) - 모든 플랫폼에서 동일한 경험
- 필수 확장:
  - ESLint
  - Prettier
  - React Native Tools
  - Expo Tools

#### 4. Expo CLI

```bash
npm install -g expo-cli
```

---

## 🍎 macOS 설정

### 1. Homebrew 설치 (패키지 관리자)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. nvm 설치 및 설정

#### nvm 설치

```bash
brew install nvm
```

#### zsh 설정 (.zshrc에 추가)

**중요**: 터미널을 열 때마다 nvm이 자동으로 로드되도록 설정

1. `.zshrc` 파일 열기:

```bash
nano ~/.zshrc
# 또는
code ~/.zshrc
```

2. 다음 내용 추가:

```bash
# NVM 설정
export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"  # nvm 로드
[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"  # nvm bash_completion 로드
```

3. 설정 적용:

```bash
source ~/.zshrc
```

#### bash 사용자의 경우 (.bash_profile에 추가)

```bash
# .bash_profile 편집
nano ~/.bash_profile

# 다음 내용 추가
export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"

# 적용
source ~/.bash_profile
```

### 3. Node.js 설치

```bash
# LTS 버전 설치
nvm install --lts

# 특정 버전 설치 (프로젝트 권장: v20)
nvm install 20

# 기본 버전 설정
nvm alias default 20

# 현재 세션에서 사용
nvm use 20

# 설치 확인
node --version
npm --version
```

### 4. iOS 개발 환경 (선택사항)

#### Xcode 설치

```bash
# App Store에서 Xcode 설치 후
xcode-select --install

# CocoaPods 설치
sudo gem install cocoapods
```

### 5. Watchman 설치 (권장)

React Native 파일 변경 감지 성능 향상:

```bash
brew install watchman
```

---

## 🪟 Windows 설정

### 1. Node.js 설치

#### 방법 1: nvm-windows 사용 (권장)

1. **nvm-windows 설치**

   - [nvm-windows 릴리스 페이지](https://github.com/coreybutler/nvm-windows/releases)
   - `nvm-setup.exe` 다운로드 및 설치

2. **관리자 권한으로 PowerShell 또는 CMD 실행**

3. **Node.js 설치**

```powershell
# LTS 버전 설치
nvm install lts

# 특정 버전 설치
nvm install 20.19.2

# 사용할 버전 설정
nvm use 20.19.2

# 설치 확인
node --version
npm --version
```

#### 방법 2: 직접 설치

- [Node.js 공식 사이트](https://nodejs.org/)에서 LTS 버전 다운로드

### 2. Git 설정

```powershell
# Git 설치 확인
git --version

# 줄바꿈 설정 (중요!)
git config --global core.autocrlf true
```

### 3. Windows Terminal 설치 (권장)

- Microsoft Store에서 "Windows Terminal" 설치
- PowerShell 또는 WSL2 사용 가능

### 4. Android 개발 환경 (선택사항)

#### Android Studio 설치

1. [Android Studio 다운로드](https://developer.android.com/studio)
2. Android SDK 설치
3. 환경 변수 설정:
   - `ANDROID_HOME`: `C:\Users\YourName\AppData\Local\Android\Sdk`
   - Path에 추가: `%ANDROID_HOME%\platform-tools`

### 5. WSL2 사용 (선택사항, 추천)

Linux 환경에서 개발하고 싶다면:

```powershell
# 관리자 권한 PowerShell에서
wsl --install

# Ubuntu 설치 후 macOS와 동일한 방식으로 설정 가능
```

---

## 🔄 크로스 플랫폼 팁

### 1. 줄바꿈 문제 해결

#### .gitattributes 파일 생성

프로젝트 루트에 `.gitattributes` 파일 생성:

```gitattributes
# 텍스트 파일 자동 감지 및 정규화
* text=auto

# 특정 확장자 명시적 설정
*.js text eol=lf
*.jsx text eol=lf
*.ts text eol=lf
*.tsx text eol=lf
*.json text eol=lf
*.md text eol=lf
*.css text eol=lf
*.html text eol=lf

# 바이너리 파일
*.png binary
*.jpg binary
*.gif binary
*.ico binary
*.ttf binary
```

#### Git 전역 설정

```bash
# macOS/Linux
git config --global core.autocrlf input

# Windows
git config --global core.autocrlf true
```

### 2. 환경 변수 관리

#### .env 파일 사용

- 민감한 정보는 `.env` 파일에 저장
- `.gitignore`에 `.env` 추가
- `.env.example` 파일로 템플릿 제공

```bash
# .env.example
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. 패키지 버전 동기화

#### package-lock.json 사용

```bash
# 패키지 설치 시 항상 lock 파일 사용
npm ci  # 대신 npm install

# lock 파일 커밋
git add package-lock.json
```

### 4. 경로 문제 해결

#### 절대 경로 대신 상대 경로 사용

```javascript
// ❌ 나쁜 예
import Component from "C:/Users/gain/project/components/Component";

// ✅ 좋은 예
import Component from "@/components/Component";
```

#### tsconfig.json 경로 설정

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@components/*": ["./components/*"],
      "@utils/*": ["./utils/*"]
    }
  }
}
```

### 5. 일관된 코드 스타일

#### Prettier 설정 (.prettierrc)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

#### ESLint 설정

- 팀 전체가 동일한 ESLint 규칙 사용
- VS Code에서 저장 시 자동 포맷팅 설정

### 6. VS Code 설정 공유

#### .vscode/settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.eol": "\n"
}
```

---

## 🚀 프로젝트 시작하기

### 처음 시작 (양쪽 환경 공통)

```bash
# 1. 저장소 클론
git clone <repository-url>
cd remit-planner

# 2. Node.js 버전 확인
node --version  # v20 이상 확인

# 3. 의존성 설치
npm install

# 4. 환경 변수 설정
cp .env.example .env
# .env 파일 수정

# 5. 개발 서버 시작
npm start
```

### macOS에서 개발 서버가 안 시작될 때

```bash
# nvm이 로드되지 않은 경우
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 그 다음 서버 시작
npm start
```

### Windows에서 개발 서버가 안 시작될 때

```powershell
# nvm 버전 확인
nvm list

# Node.js 활성화
nvm use 20.19.2

# 그 다음 서버 시작
npm start
```

---

## 🐛 문제 해결

### 문제 1: "npm: command not found" (macOS)

**원인**: nvm이 셸에 로드되지 않음

**해결**:

```bash
# 1. .zshrc 확인
cat ~/.zshrc | grep NVM

# 2. 없으면 추가
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc

# 3. 적용
source ~/.zshrc
```

### 문제 2: "npm ERR! code ELIFECYCLE"

**해결**:

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
rm package-lock.json
npm install
```

### 문제 3: 포트 충돌 (8081 already in use)

**해결**:

```bash
# macOS/Linux
lsof -ti:8081 | xargs kill -9

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 8081).OwningProcess | Stop-Process

# 또는 다른 포트 사용
npx expo start --port 8082
```

### 문제 4: "Module not found"

**해결**:

```bash
# 1. 캐시 클리어
npm cache clean --force

# 2. 재설치
rm -rf node_modules package-lock.json
npm install

# 3. Expo 캐시 클리어
npx expo start -c
```

### 문제 5: Windows에서 긴 경로 오류

**해결** (관리자 PowerShell):

```powershell
# 긴 경로 활성화
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

### 문제 6: Watchman 경고 (macOS)

**해결**:

```bash
brew install watchman
```

### 문제 7: 줄바꿈 문자 차이로 인한 Git 충돌

**해결**:

```bash
# 전체 파일 재정규화
git add --renormalize .
git commit -m "Normalize line endings"
```

### 문제 8: "expo: command not found"

**원인**: 의존성이 설치되지 않았거나 글로벌 expo-cli 사용 시도

**해결**:

```bash
# 1. 프로젝트 의존성 먼저 설치
npm install

# 2. 최신 방법 (권장): npx 사용
npx expo start

# 3. 또는 package.json의 scripts 사용
npm start
```

**참고**:

- 글로벌 `expo-cli`는 deprecated되었습니다
- Expo SDK 46 이상부터는 로컬 expo 패키지 사용 권장
- `npx expo <command>` 형태로 사용하세요

### 문제 9: "Unable to find expo in this project"

**원인**: node_modules가 설치되지 않음

**해결**:

```bash
# 의존성 설치
npm install

# 또는 클린 인스톨
rm -rf node_modules package-lock.json
npm install
```

### 문제 10: Node.js 버전 경고 (Unsupported engine)

**경고 예시**: `required: { node: '>= 20.19.4' }, current: { node: 'v20.19.2' }`

**해결**:

```bash
# 최신 LTS 버전으로 업데이트
nvm install 20
nvm use 20

# 또는 특정 버전 설치
nvm install 20.19.4
nvm use 20.19.4

# 기본 버전으로 설정
nvm alias default 20.19.4
```

**참고**: 경고만 뜨고 실제로는 동작할 수 있지만, 권장 버전 사용을 추천합니다.

---

## 📝 환경별 체크리스트

### ✅ macOS 체크리스트

- [ ] Homebrew 설치됨
- [ ] nvm 설치됨
- [ ] `.zshrc`에 nvm 설정 추가됨
- [ ] Node.js v20 이상 설치됨
- [ ] Watchman 설치됨 (권장)
- [ ] Xcode 설치됨 (iOS 개발 시)
- [ ] Git 설정: `core.autocrlf input`

### ✅ Windows 체크리스트

- [ ] nvm-windows 설치됨
- [ ] Node.js v20 이상 설치됨
- [ ] Git for Windows 설치됨
- [ ] Git 설정: `core.autocrlf true`
- [ ] Windows Terminal 설치됨 (권장)
- [ ] Android Studio 설치됨 (Android 개발 시)
- [ ] 긴 경로 지원 활성화됨

### ✅ 공통 체크리스트

- [ ] VS Code 설치 및 확장 설치됨
- [ ] `.gitattributes` 파일 생성됨
- [ ] `.env.example` → `.env` 복사 및 설정됨
- [ ] `npm install` 성공
- [ ] `npm start` 성공
- [ ] Prettier, ESLint 설정됨

---

## 🔗 관련 문서

- [빠른 시작 가이드](./QUICK_SETUP_GUIDE.md)
- [Supabase 설정](../database/SUPABASE_SETUP.md)
- [전체 문서 가이드](../README.md)

---

## 💡 추가 팁

### 터미널 별칭 (Alias) 설정

개발 효율성을 위한 유용한 별칭:

#### macOS/Linux (.zshrc 또는 .bashrc)

```bash
# 프로젝트 바로가기
alias remit='cd ~/vscodeProjects/remit-planner'

# 자주 쓰는 명령어
alias ns='npm start'
alias ni='npm install'
alias nci='npm ci'
alias nrd='npm run dev'

# Git 단축키
alias gs='git status'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline'
```

#### Windows (PowerShell Profile)

```powershell
# Profile 열기
notepad $PROFILE

# 추가할 내용
function remit { cd C:\Users\gain\vscodeProjects\remit-planner }
function ns { npm start }
function ni { npm install }
```

### VS Code 동기화 설정

- VS Code의 Settings Sync 기능 활성화
- GitHub 계정으로 로그인
- 모든 설정, 확장, 키바인딩이 자동 동기화됨

---

**최종 업데이트**: 2025-10-21
