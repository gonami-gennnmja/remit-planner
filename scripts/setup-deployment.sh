#!/bin/bash

set -e

echo "🚀 배포 파이프라인 설정 시작..."
echo ""

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. EAS CLI 설치 확인
echo -e "${BLUE}1. EAS CLI 설치 확인 중...${NC}"
if ! command -v eas &> /dev/null; then
    echo "📦 EAS CLI 설치 중..."
    npm install -g eas-cli
else
    echo -e "${GREEN}✅ EAS CLI가 이미 설치되어 있습니다.${NC}"
fi
echo ""

# 2. EAS 로그인 확인
echo -e "${BLUE}2. EAS 계정 확인 중...${NC}"
if ! eas whoami &> /dev/null; then
    echo "🔐 EAS 로그인이 필요합니다..."
    eas login
else
    echo -e "${GREEN}✅ EAS에 로그인되어 있습니다.${NC}"
    eas whoami
fi
echo ""

# 3. 프로젝트 설정
echo -e "${BLUE}3. EAS 프로젝트 설정 중...${NC}"
if [ ! -f "eas.json" ]; then
    eas build:configure
    echo -e "${GREEN}✅ eas.json 파일이 생성되었습니다.${NC}"
else
    echo -e "${GREEN}✅ eas.json 파일이 이미 존재합니다.${NC}"
fi
echo ""

# 4. GitHub Actions 설정 확인
echo -e "${BLUE}4. GitHub Actions 워크플로우 확인 중...${NC}"
if [ -d ".github/workflows" ]; then
    echo -e "${GREEN}✅ GitHub Actions 워크플로우가 설정되어 있습니다.${NC}"
else
    echo -e "${RED}❌ GitHub Actions 워크플로우가 없습니다.${NC}"
fi
echo ""

# 5. 환경 변수 확인
echo -e "${BLUE}5. 환경 변수 확인 중...${NC}"
if grep -q "YOUR_SUPABASE_URL" eas.json 2>/dev/null || grep -q "YOUR_SUPABASE_URL" app.json 2>/dev/null; then
    echo -e "${RED}⚠️  환경 변수를 실제 값으로 변경해야 합니다.${NC}"
    echo "   eas.json 또는 app.json의 환경 변수를 확인하세요."
else
    echo -e "${GREEN}✅ 환경 변수가 설정되어 있습니다.${NC}"
fi
echo ""

# 6. 완료 메시지
echo -e "${GREEN}✅ 설정 완료!${NC}"
echo ""
echo "📝 다음 단계:"
echo ""
echo "1. eas.json 파일 확인 및 수정"
echo "   - bundleIdentifier 설정"
echo "   - 환경 변수 설정"
echo ""
echo "2. GitHub Secrets 설정"
echo "   - Settings > Secrets and variables > Actions"
echo "   - EXPO_TOKEN 추가"
echo "   - VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID (Web 배포 시)"
echo ""
echo "3. EAS Secrets 설정 (선택사항)"
echo "   eas secret:create --scope project --name SUPABASE_URL --value your_url"
echo "   eas secret:create --scope project --name SUPABASE_ANON_KEY --value your_key"
echo ""
echo "4. 첫 번째 빌드 실행"
echo "   eas build --platform android --profile preview"
echo "   eas build --platform ios --profile preview"
echo ""
echo "5. 프로덕션 빌드 (준비되면)"
echo "   eas build --platform all --profile production"
echo ""
echo "📚 자세한 가이드: docs/DEPLOYMENT_PIPELINE_GUIDE.md"
echo ""

