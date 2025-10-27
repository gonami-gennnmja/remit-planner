# Supabase Storage 설정 가이드

## 1. Storage 버킷 생성

Supabase 대시보드에서 다음 버킷들을 생성해야 합니다:

### 필수 버킷

- `remit-planner-files`: 모든 파일 저장용

## 2. 버킷 설정

### remit-planner-files 버킷

- **Public**: `true` (파일 URL로 직접 접근 가능)
- **File size limit**: `50MB`
- **Allowed MIME types**:
  - `image/*` (이미지 파일)
  - `application/pdf` (PDF 문서)
  - `application/msword` (Word 문서)
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (Word 2007+)
  - `application/vnd.ms-excel` (Excel 문서)
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (Excel 2007+)
  - `text/plain` (텍스트 파일)

## 3. RLS (Row Level Security) 정책 설정

### 파일 접근 정책

```sql
-- 사용자는 자신의 파일만 접근 가능
CREATE POLICY "Users can access their own files" ON storage.objects
FOR ALL USING (
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 사용자는 자신의 파일만 업로드 가능
CREATE POLICY "Users can upload their own files" ON storage.objects
FOR INSERT WITH CHECK (
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 사용자는 자신의 파일만 수정 가능
CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 사용자는 자신의 파일만 삭제 가능
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 4. 폴더 구조

```
remit-planner-files/
├── users/
│   └── {user_id}/
│       ├── business-card.jpg
│       └── business-license.pdf
├── workers/
│   └── {worker_name}/
│       └── id-card.jpg
├── schedules/
│   └── {schedule_title}/
│       ├── manual.pdf
│       └── contract.pdf
└── clients/
    └── {client_name}/
        ├── contract.pdf
        └── invoice.pdf
```

## 5. 환경 변수 설정

`.env` 파일에 다음 변수들이 설정되어 있는지 확인:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 6. 테스트

1. 앱에서 파일 업로드 기능 테스트
2. 업로드된 파일이 올바른 폴더에 저장되는지 확인
3. 파일 URL이 정상적으로 생성되는지 확인
4. 파일 삭제 기능이 정상 작동하는지 확인

## 7. 주의사항

- 파일 크기 제한을 준수하세요
- 민감한 정보가 포함된 파일은 암호화를 고려하세요
- 정기적으로 사용하지 않는 파일을 정리하세요
- 백업 정책을 수립하세요
