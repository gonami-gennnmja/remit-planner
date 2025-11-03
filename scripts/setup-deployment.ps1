# PowerShell 배포 파이프라인 설정 스크립트

Write-Host "🚀 배포 파이프라인 설정 시작..." -ForegroundColor Cyan
Write-Host ""

# 1. EAS CLI 설치 확인
Write-Host "1. EAS CLI 설치 확인 중..." -ForegroundColor Blue
try {
    $easVersion = eas --version 2>$null
    Write-Host "✅ EAS CLI가 이미 설치되어 있습니다. (버전: $easVersion)" -ForegroundColor Green
} catch {
    Write-Host "📦 EAS CLI 설치 중..." -ForegroundColor Yellow
    npm install -g eas-cli
}
Write-Host ""

# 2. EAS 로그인 확인
Write-Host "2. EAS 계정 확인 중..." -ForegroundColor Blue
try {
    $user = eas whoami 2>$null
    if ($user) {
        Write-Host "✅ EAS에 로그인되어 있습니다." -ForegroundColor Green
    } else {
        Write-Host "🔐 EAS 로그인이 필요합니다..." -ForegroundColor Yellow
        eas login
    }
} catch {
    Write-Host "🔐 EAS 로그인이 필요합니다..." -ForegroundColor Yellow
    eas login
}
Write-Host ""

# 3. 프로젝트 설정
Write-Host "3. EAS 프로젝트 설정 중..." -ForegroundColor Blue
if (Test-Path "eas.json") {
    Write-Host "✅ eas.json 파일이 이미 존재합니다." -ForegroundColor Green
} else {
    eas build:configure
    Write-Host "✅ eas.json 파일이 생성되었습니다." -ForegroundColor Green
}
Write-Host ""

# 4. GitHub Actions 설정 확인
Write-Host "4. GitHub Actions 워크플로우 확인 중..." -ForegroundColor Blue
if (Test-Path ".github\workflows") {
    Write-Host "✅ GitHub Actions 워크플로우가 설정되어 있습니다." -ForegroundColor Green
} else {
    Write-Host "❌ GitHub Actions 워크플로우가 없습니다." -ForegroundColor Red
}
Write-Host ""

# 5. 환경 변수 확인
Write-Host "5. 환경 변수 확인 중..." -ForegroundColor Blue
$hasPlaceholder = $false
if (Test-Path "eas.json") {
    $easContent = Get-Content "eas.json" -Raw
    if ($easContent -match "YOUR_SUPABASE_URL") {
        $hasPlaceholder = $true
    }
}
if (Test-Path "app.json") {
    $appContent = Get-Content "app.json" -Raw
    if ($appContent -match "YOUR_SUPABASE_URL") {
        $hasPlaceholder = $true
    }
}

if ($hasPlaceholder) {
    Write-Host "⚠️  환경 변수를 실제 값으로 변경해야 합니다." -ForegroundColor Yellow
    Write-Host "   eas.json 또는 app.json의 환경 변수를 확인하세요."
} else {
    Write-Host "✅ 환경 변수가 설정되어 있습니다." -ForegroundColor Green
}
Write-Host ""

# 6. 완료 메시지
Write-Host "✅ 설정 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 다음 단계:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. eas.json 파일 확인 및 수정"
Write-Host "   - bundleIdentifier 설정"
Write-Host "   - 환경 변수 설정"
Write-Host ""
Write-Host "2. GitHub Secrets 설정"
Write-Host "   - Settings > Secrets and variables > Actions"
Write-Host "   - EXPO_TOKEN 추가"
Write-Host "   - VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID (Web 배포 시)"
Write-Host ""
Write-Host "3. EAS Secrets 설정 (선택사항)"
Write-Host "   eas secret:create --scope project --name SUPABASE_URL --value your_url"
Write-Host "   eas secret:create --scope project --name SUPABASE_ANON_KEY --value your_key"
Write-Host ""
Write-Host "4. 첫 번째 빌드 실행"
Write-Host "   eas build --platform android --profile preview"
Write-Host "   eas build --platform ios --profile preview"
Write-Host ""
Write-Host "5. 프로덕션 빌드 (준비되면)"
Write-Host "   eas build --platform all --profile production"
Write-Host ""
Write-Host "📚 자세한 가이드: docs\DEPLOYMENT_PIPELINE_GUIDE.md"
Write-Host ""

