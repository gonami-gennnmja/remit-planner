# 반반 (Half&Half)

> 일도 반반, 여유도 반반

반반(Half&Half)은 사업자들이 스케줄과 급여를 효율적으로 관리할 수 있도록 도와주는 스마트 매니저 앱입니다.

## 🎯 주요 기능

### 📅 일정 관리

- 직관적인 캘린더 인터페이스
- 근로자별 일정 배정
- 실시간 일정 확인

### 💰 급여 관리

- 자동 급여 계산
- 근로자별 급여 이력
- 지급 상태 관리

### 👥 근로자 관리

- 근로자 정보 관리
- 시급 및 근무 시간 설정
- 연락처 및 계좌 정보 관리

### 🏢 거래처 관리

- 거래처 정보 관리
- 담당자 연락처 관리
- 거래 이력 추적

### 📊 보고서

- 월별 급여 보고서
- 근무 시간 분석
- 수익성 분석

## 🚀 시작하기

### 설치

```bash
npm install
```

### 실행

```bash
# 개발 서버 시작
npm start

# iOS 실행
npm run ios

# Android 실행
npm run android

# 웹 실행
npm run web
```

## 🛠️ 기술 스택

- **Frontend**: React Native, Expo
- **Backend**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **State Management**: React Context
- **Styling**: NativeWind (Tailwind CSS)

## 🔒 보안

반반은 3단계 보안 체계를 통해 사용자 데이터를 보호합니다:

1. **인증 레벨**: Supabase Auth를 통한 안전한 로그인
2. **애플리케이션 레벨**: 사용자별 데이터 필터링
3. **데이터베이스 레벨**: Row Level Security (RLS) 정책

## 📱 지원 플랫폼

- iOS
- Android
- Web

## 📚 문서

프로젝트의 모든 기술 문서는 `/docs` 폴더에 체계적으로 정리되어 있습니다.

### 빠른 링크

- **[📖 문서 가이드](./docs/README.md)** - 상황별 문서 찾기
- **[🔐 인증 문서](./docs/auth/)** - 로그인, 회원가입, 소셜 로그인
- **[🗄️ 데이터베이스 문서](./docs/database/)** - 스키마, 마이그레이션, Supabase
- **[🔒 보안 문서](./docs/security/)** - RLS, 사용자 격리, 보안 검증
- **[⚙️ 설정 문서](./docs/setup/)** - 초기 설정, 앱 아이콘, 약관
- **[🔄 업데이트 문서](./docs/updates/)** - 최신 변경사항, 버그 수정

### 처음 시작하시나요?

1. [빠른 시작 가이드](./docs/setup/QUICK_SETUP_GUIDE.md)
2. [Supabase 설정](./docs/database/SUPABASE_SETUP.md)
3. [인증 시스템 개요](./docs/auth/AUTH_IMPLEMENTATION_SUMMARY.md)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

---

**반반(Half&Half)** - 당신의 비즈니스 관리가 절반으로 줄어드는 경험을 만나보세요! 🎉
