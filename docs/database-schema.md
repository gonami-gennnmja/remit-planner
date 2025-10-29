# 데이터베이스 스키마 문서

## 📋 개요

이 문서는 Remit Planner 애플리케이션의 데이터베이스 스키마를 설명합니다. 계약서 관리 및 서류 분류 시스템이 추가된 최신 스키마입니다.

## 🗄️ 테이블 구조

### 1. 기본 테이블

#### `workers` - 근로자 관리

| 컬럼명             | 타입    | 제약조건                  | 설명             | 사용처                 |
| ------------------ | ------- | ------------------------- | ---------------- | ---------------------- |
| id                 | TEXT    | PRIMARY KEY               | 근로자 고유 ID   | 모든 근로자 관련 기능  |
| user_id            | TEXT    | NOT NULL                  | 사용자 ID        | 사용자별 근로자 관리   |
| name               | TEXT    | NOT NULL                  | 근로자 이름      | 근로자 목록, 급여 계산 |
| phone              | TEXT    | NOT NULL                  | 연락처           | 연락 기능              |
| resident_number    | TEXT    | -                         | 주민등록번호     | 급여 지급 시 필수      |
| bank_account       | TEXT    | -                         | 계좌번호         | 급여 지급 시 필수      |
| hourly_wage        | INTEGER | DEFAULT 15000             | 기본 시급        | 급여 계산              |
| fuel_allowance     | INTEGER | DEFAULT 0                 | 유류비           | 급여 계산              |
| other_allowance    | INTEGER | DEFAULT 0                 | 기타비용         | 급여 계산              |
| id_card_image_url  | TEXT    | -                         | 신분증 사진 URL  | 신분 확인              |
| id_card_image_path | TEXT    | -                         | 신분증 사진 경로 | 로컬 저장              |
| memo               | TEXT    | -                         | 메모             | 추가 정보              |
| created_at         | TEXT    | DEFAULT CURRENT_TIMESTAMP | 생성일시         | 로그 추적              |
| updated_at         | TEXT    | DEFAULT CURRENT_TIMESTAMP | 수정일시         | 로그 추적              |

#### `schedules` - 스케줄 관리

| 컬럼명                | 타입        | 제약조건                  | 설명                | 사용처                |
| --------------------- | ----------- | ------------------------- | ------------------- | --------------------- |
| id                    | TEXT        | PRIMARY KEY               | 스케줄 고유 ID      | 모든 스케줄 관련 기능 |
| user_id               | TEXT        | NOT NULL                  | 사용자 ID           | 사용자별 스케줄 관리  |
| title                 | TEXT        | NOT NULL                  | 스케줄 제목         | 스케줄 목록, 상세보기 |
| description           | TEXT        | -                         | 스케줄 설명         | 상세 정보             |
| start_date            | TEXT        | NOT NULL                  | 시작 날짜           | 일정 관리             |
| end_date              | TEXT        | NOT NULL                  | 종료 날짜           | 일정 관리             |
| category              | TEXT        | NOT NULL                  | 카테고리            | 분류 관리             |
| location              | TEXT        | -                         | 위치 정보           | 장소 정보             |
| address               | TEXT        | -                         | 상세 주소           | 주소 정보             |
| uniform_time          | BOOLEAN     | DEFAULT true              | 일정 시간 동일 여부 | 시간 관리             |
| schedule_times        | TEXT        | DEFAULT '[]'              | 일정 시간 JSON      | 시간 설정             |
| documents_folder_path | TEXT        | -                         | 문서 폴더 경로      | 파일 관리             |
| has_attachments       | BOOLEAN     | DEFAULT false             | 첨부파일 여부       | 파일 관리             |
| all_wages_paid        | BOOLEAN     | DEFAULT false             | 모든 급여 지급 완료 | 급여 관리             |
| revenue_status        | TEXT        | DEFAULT 'pending'         | 수급 상태           | 수익 관리             |
| revenue_due_date      | TEXT        | -                         | 수급 마감일         | 수익 관리             |
| **contract_amount**   | **INTEGER** | **DEFAULT 0**             | **계약금액**        | **수익 계산**         |
| client_id             | TEXT        | -                         | 거래처 ID           | 거래처 연결           |
| memo                  | TEXT        | -                         | 메모                | 추가 정보             |
| created_at            | TEXT        | DEFAULT CURRENT_TIMESTAMP | 생성일시            | 로그 추적             |
| updated_at            | TEXT        | DEFAULT CURRENT_TIMESTAMP | 수정일시            | 로그 추적             |

### 2. 계약서 관리 테이블 (신규)

#### `document_categories` - 서류 분류

| 컬럼명      | 타입    | 제약조건                   | 설명         | 사용처         |
| ----------- | ------- | -------------------------- | ------------ | -------------- |
| id          | TEXT    | PRIMARY KEY                | 분류 고유 ID | 서류 분류 관리 |
| name        | TEXT    | NOT NULL                   | 분류명       | UI 표시        |
| description | TEXT    | -                          | 분류 설명    | 상세 정보      |
| color       | TEXT    | DEFAULT '#3b82f6'          | 색상 코드    | UI 표시        |
| icon        | TEXT    | DEFAULT 'document-outline' | 아이콘명     | UI 표시        |
| sort_order  | INTEGER | DEFAULT 0                  | 정렬 순서    | UI 정렬        |
| created_at  | TEXT    | DEFAULT CURRENT_TIMESTAMP  | 생성일시     | 로그 추적      |
| updated_at  | TEXT    | DEFAULT CURRENT_TIMESTAMP  | 수정일시     | 로그 추적      |

**기본 분류 데이터:**

- 계약서 (빨간색, document-text-outline)
- 안내사항 (파란색, information-circle-outline)
- 안전관리 (초록색, shield-checkmark-outline)
- 장비/도구 (주황색, construct-outline)
- 보고서 (보라색, bar-chart-outline)
- 기타 (회색, folder-outline)

#### `schedule_contracts` - 계약서 관리

| 컬럼명             | 타입    | 제약조건                  | 설명           | 사용처           |
| ------------------ | ------- | ------------------------- | -------------- | ---------------- |
| id                 | TEXT    | PRIMARY KEY               | 계약서 고유 ID | 계약서 관리      |
| schedule_id        | TEXT    | NOT NULL                  | 스케줄 ID      | 스케줄 연결      |
| contract_type      | TEXT    | NOT NULL                  | 계약 타입      | 계약서 분류      |
| contract_direction | TEXT    | NOT NULL                  | 계약 방향      | 발송/수신 구분   |
| contract_amount    | INTEGER | NOT NULL                  | 계약금액       | 수익 계산        |
| contract_content   | TEXT    | -                         | 계약 내용      | 구두/텍스트 계약 |
| contract_status    | TEXT    | DEFAULT 'draft'           | 계약 상태      | 상태 추적        |
| sent_date          | TEXT    | -                         | 발송일         | 일정 관리        |
| received_date      | TEXT    | -                         | 수신일         | 일정 관리        |
| approved_date      | TEXT    | -                         | 승인일         | 일정 관리        |
| rejected_date      | TEXT    | -                         | 거절일         | 일정 관리        |
| rejection_reason   | TEXT    | -                         | 거절 사유      | 거절 관리        |
| created_at         | TEXT    | DEFAULT CURRENT_TIMESTAMP | 생성일시       | 로그 추적        |
| updated_at         | TEXT    | DEFAULT CURRENT_TIMESTAMP | 수정일시       | 로그 추적        |

**제약조건:**

- `contract_type`: 'written', 'verbal', 'text'
- `contract_direction`: 'sent', 'received'
- `contract_status`: 'draft', 'sent', 'received', 'approved', 'rejected'

#### `contract_documents` - 계약서 첨부파일

| 컬럼명        | 타입    | 제약조건                  | 설명         | 사용처      |
| ------------- | ------- | ------------------------- | ------------ | ----------- |
| id            | TEXT    | PRIMARY KEY               | 문서 고유 ID | 파일 관리   |
| contract_id   | TEXT    | NOT NULL                  | 계약서 ID    | 계약서 연결 |
| file_name     | TEXT    | NOT NULL                  | 파일명       | 파일 관리   |
| file_url      | TEXT    | NOT NULL                  | 파일 URL     | 파일 접근   |
| file_path     | TEXT    | NOT NULL                  | 파일 경로    | 로컬 저장   |
| file_type     | TEXT    | NOT NULL                  | 파일 타입    | 파일 처리   |
| file_size     | INTEGER | -                         | 파일 크기    | 용량 관리   |
| document_type | TEXT    | NOT NULL                  | 문서 타입    | 문서 분류   |
| description   | TEXT    | -                         | 문서 설명    | 추가 정보   |
| uploaded_at   | TEXT    | DEFAULT CURRENT_TIMESTAMP | 업로드일시   | 로그 추적   |

**제약조건:**

- `document_type`: 'contract', 'amendment', 'attachment'

### 3. 기존 테이블 개선

#### `schedule_documents` - 스케줄 문서 (개선됨)

| 컬럼명            | 타입     | 제약조건                  | 설명          | 사용처        |
| ----------------- | -------- | ------------------------- | ------------- | ------------- |
| id                | TEXT     | PRIMARY KEY               | 문서 고유 ID  | 파일 관리     |
| schedule_id       | TEXT     | NOT NULL                  | 스케줄 ID     | 스케줄 연결   |
| **category_id**   | **TEXT** | **-**                     | **분류 ID**   | **서류 분류** |
| file_name         | TEXT     | NOT NULL                  | 파일명        | 파일 관리     |
| file_url          | TEXT     | NOT NULL                  | 파일 URL      | 파일 접근     |
| file_path         | TEXT     | NOT NULL                  | 파일 경로     | 로컬 저장     |
| file_type         | TEXT     | NOT NULL                  | 파일 타입     | 파일 처리     |
| file_size         | INTEGER  | -                         | 파일 크기     | 용량 관리     |
| **document_type** | **TEXT** | **NOT NULL**              | **문서 타입** | **문서 분류** |
| **description**   | **TEXT** | **-**                     | **문서 설명** | **추가 정보** |
| uploaded_at       | TEXT     | DEFAULT CURRENT_TIMESTAMP | 업로드일시    | 로그 추적     |

**제약조건:**

- `document_type`: 'contract', 'guidance', 'safety', 'equipment', 'other'

### 4. 기타 테이블

#### `clients` - 거래처 관리

| 컬럼명                | 타입    | 제약조건                  | 설명           | 사용처               |
| --------------------- | ------- | ------------------------- | -------------- | -------------------- |
| id                    | TEXT    | PRIMARY KEY               | 거래처 고유 ID | 거래처 관리          |
| user_id               | TEXT    | NOT NULL                  | 사용자 ID      | 사용자별 거래처 관리 |
| name                  | TEXT    | NOT NULL                  | 거래처명       | 거래처 목록          |
| phone                 | TEXT    | NOT NULL                  | 연락처         | 연락 기능            |
| email                 | TEXT    | -                         | 이메일         | 연락 기능            |
| address               | TEXT    | -                         | 주소           | 주소 정보            |
| business_number       | TEXT    | -                         | 사업자등록번호 | 사업자 정보          |
| contact_person        | TEXT    | -                         | 담당자명       | 담당자 정보          |
| documents_folder_path | TEXT    | -                         | 문서 폴더 경로 | 파일 관리            |
| memo                  | TEXT    | -                         | 메모           | 추가 정보            |
| total_revenue         | INTEGER | DEFAULT 0                 | 총 매출        | 수익 관리            |
| unpaid_amount         | INTEGER | DEFAULT 0                 | 미수금         | 수익 관리            |
| created_at            | TEXT    | DEFAULT CURRENT_TIMESTAMP | 생성일시       | 로그 추적            |
| updated_at            | TEXT    | DEFAULT CURRENT_TIMESTAMP | 수정일시       | 로그 추적            |

## 🔗 관계 (Foreign Keys)

### 주요 관계

- `schedules.client_id` → `clients.id` (ON DELETE SET NULL)
- `schedule_contracts.schedule_id` → `schedules.id` (ON DELETE CASCADE)
- `contract_documents.contract_id` → `schedule_contracts.id` (ON DELETE CASCADE)
- `schedule_documents.schedule_id` → `schedules.id` (ON DELETE CASCADE)
- `schedule_documents.category_id` → `document_categories.id` (ON DELETE SET NULL)

## 📊 인덱스

### 성능 최적화를 위한 인덱스

- `idx_schedules_contract_amount` - 계약금액 조회 최적화
- `idx_document_categories_sort_order` - 분류 정렬 최적화
- `idx_schedule_contracts_schedule` - 스케줄별 계약서 조회 최적화
- `idx_schedule_contracts_status` - 계약 상태별 조회 최적화
- `idx_schedule_contracts_type` - 계약 타입별 조회 최적화
- `idx_contract_documents_contract` - 계약서별 첨부파일 조회 최적화
- `idx_schedule_documents_category` - 분류별 문서 조회 최적화
- `idx_schedule_documents_type` - 문서 타입별 조회 최적화

## 🎯 주요 기능

### 1. 계약서 관리

- **계약서 작성**: 사용자가 거래처에 계약서 작성/발송
- **계약서 수신**: 거래처로부터 계약서 수신
- **계약 타입**: 작성/구두/텍스트 계약 지원
- **계약 상태**: 초안→발송→수신→승인/거절 추적
- **계약금액**: 실제 계약금액 저장 및 수익 계산

### 2. 서류 분류 시스템

- **카테고리 관리**: 서류를 분류별로 관리
- **시각적 구분**: 색상 및 아이콘으로 구분
- **정렬 기능**: 사용자 정의 정렬 순서
- **문서 타입**: 계약서/안내사항/안전관리/장비/보고서/기타

### 3. 수익 관리 개선

- **실제 계약금액**: 스케줄별 실제 계약금액 저장
- **수익 계산**: 계약금액과 지급금액 차이 추적
- **수익 리포트**: 실제 계약금액 기반 수익 분석

## 🔄 마이그레이션 정보

### 적용된 마이그레이션

- **파일**: `database/migrations/add_contract_and_document_system.sql`
- **날짜**: 2024년 현재
- **주요 변경사항**:
  - `schedules` 테이블에 `contract_amount` 컬럼 추가
  - `document_categories` 테이블 생성
  - `schedule_contracts` 테이블 생성
  - `contract_documents` 테이블 생성
  - `schedule_documents` 테이블에 분류 기능 추가
  - 관련 인덱스 생성
  - 기본 분류 데이터 삽입

## 📝 사용 예시

### 계약서 생성

```sql
INSERT INTO schedule_contracts (
  id, schedule_id, contract_type, contract_direction,
  contract_amount, contract_status
) VALUES (
  'contract_001', 'schedule_001', 'written', 'sent',
  1000000, 'draft'
);
```

### 서류 분류별 문서 조회

```sql
SELECT sd.*, dc.name as category_name, dc.color
FROM schedule_documents sd
LEFT JOIN document_categories dc ON sd.category_id = dc.id
WHERE sd.schedule_id = 'schedule_001'
ORDER BY dc.sort_order, sd.uploaded_at DESC;
```

### 계약금액 기반 수익 계산

```sql
SELECT
  s.title,
  s.contract_amount,
  SUM(pc.total_gross_pay) as total_expenses,
  s.contract_amount - SUM(pc.total_gross_pay) as net_profit
FROM schedules s
LEFT JOIN schedule_workers sw ON s.id = sw.schedule_id
LEFT JOIN payroll_calculations pc ON sw.id = pc.schedule_worker_id
WHERE s.contract_amount > 0
GROUP BY s.id, s.title, s.contract_amount;
```
