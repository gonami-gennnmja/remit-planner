-- =====================================================
-- 실제 사용자 ID를 사용한 테스트 데이터
-- =====================================================
-- 이 파일을 사용하기 전에 다음을 확인하세요:
-- 1. Supabase에서 실제 사용자 ID를 확인하세요
-- 2. 아래의 'YOUR_ACTUAL_USER_ID_1'과 'YOUR_ACTUAL_USER_ID_2'를 실제 UUID로 교체하세요

-- =====================================================
-- 사용자 ID 확인 방법:
-- =====================================================
-- 1. Supabase 대시보드 → Authentication → Users
-- 2. 또는 SQL Editor에서 다음 쿼리 실행:
-- SELECT id, email FROM auth.users;

-- =====================================================
-- 1. 사용자 프로필 데이터 (실제 사용자 ID로 교체 필요)
-- =====================================================

-- 사용자 1: 김철수 (사업체 운영자)
-- 'YOUR_ACTUAL_USER_ID_1'을 실제 사용자 ID로 교체하세요
INSERT INTO user_profiles (
  id, business_name, business_number, business_address, 
  business_phone, business_email, business_card_image_url, business_license_image_url
) VALUES (
  'YOUR_ACTUAL_USER_ID_1', 
  '김철수 건설', 
  '123-45-67890', 
  '서울특별시 강남구 테헤란로 123', 
  '02-1234-5678', 
  'kim@example.com',
  'https://storage.supabase.co/remit-planner-files/users/YOUR_ACTUAL_USER_ID_1/business_card.jpg',
  'https://storage.supabase.co/remit-planner-files/users/YOUR_ACTUAL_USER_ID_1/business_license.pdf'
);

-- 사용자 2: 이영희 (개인 사업자) - 선택사항
-- 'YOUR_ACTUAL_USER_ID_2'를 실제 사용자 ID로 교체하세요 (또는 주석 처리)
/*
INSERT INTO user_profiles (
  id, business_name, business_number, business_address, 
  business_phone, business_email
) VALUES (
  'YOUR_ACTUAL_USER_ID_2', 
  '이영희 청소 서비스', 
  '987-65-43210', 
  '경기도 성남시 분당구 판교로 456', 
  '031-9876-5432', 
  'lee@example.com'
);
*/

-- =====================================================
-- 2. 근로자 데이터
-- =====================================================

-- 김철수 사업체의 근로자들
INSERT INTO workers (
  id, user_id, name, phone, resident_number, bank_account, 
  hourly_wage, fuel_allowance, other_allowance, id_card_image_url, memo
) VALUES 
-- 정규 근로자
('worker_1', 'YOUR_ACTUAL_USER_ID_1', '박민수', '010-1111-2222', '900101-1234567', '1002-123-456789', 15000, 5000, 0, 'https://storage.supabase.co/remit-planner-files/workers/박민수/id_card.jpg', '경력 5년, 믿을만한 근로자'),
('worker_2', 'YOUR_ACTUAL_USER_ID_1', '최영희', '010-3333-4444', '880215-2345678', '1002-987-654321', 16000, 5000, 2000, 'https://storage.supabase.co/remit-planner-files/workers/최영희/id_card.jpg', '야간 근무 가능'),
('worker_3', 'YOUR_ACTUAL_USER_ID_1', '정수진', '010-5555-6666', '920310-3456789', '1002-456-789123', 14000, 3000, 0, 'https://storage.supabase.co/remit-planner-files/workers/정수진/id_card.jpg', '신입, 열심히 배우는 중');

-- =====================================================
-- 3. 거래처 데이터
-- =====================================================

-- 김철수 사업체의 거래처들
INSERT INTO clients (
  id, user_id, name, phone, email, address, business_number, 
  contact_person, documents_folder_path, memo, total_revenue, unpaid_amount
) VALUES 
('client_1', 'YOUR_ACTUAL_USER_ID_1', 'ABC 건설', '02-1111-2222', 'contact@abc-construction.com', '서울특별시 송파구 올림픽로 300', '123-45-67890', '김부장', 'clients/ABC_건설/', '대형 건설사, 안정적인 거래처', 50000000, 0),
('client_2', 'YOUR_ACTUAL_USER_ID_1', 'XYZ 아파트', '02-3333-4444', 'manager@xyz-apt.com', '경기도 성남시 분당구 정자동 123', '987-65-43210', '이과장', 'clients/XYZ_아파트/', '신축 아파트 단지', 30000000, 5000000),
('client_3', 'YOUR_ACTUAL_USER_ID_1', 'DEF 오피스텔', '02-5555-6666', 'admin@def-officetel.com', '서울특별시 강남구 역삼동 456', '456-78-90123', '박대리', 'clients/DEF_오피스텔/', '오피스텔 리모델링', 15000000, 0);

-- =====================================================
-- 4. 거래처 담당자 데이터
-- =====================================================

INSERT INTO client_contacts (
  id, client_id, name, position, phone, memo, is_primary
) VALUES 
-- ABC 건설 담당자들
('contact_1', 'client_1', '김부장', '현장소장', '010-1111-1111', '현장 총괄', 1),
('contact_2', 'client_1', '이과장', '안전관리자', '010-2222-2222', '안전 관련 업무', 0),

-- XYZ 아파트 담당자들
('contact_3', 'client_2', '이과장', '관리과장', '010-3333-3333', '아파트 관리', 1),
('contact_4', 'client_2', '박대리', '시설담당', '010-4444-4444', '시설 점검', 0);

-- =====================================================
-- 5. 스케줄 데이터
-- =====================================================

-- 케이스 1: 단일일 스케줄 (동일 시간)
INSERT INTO schedules (
  id, user_id, title, description, start_date, end_date, category, 
  location, address, uniform_time, schedule_times, documents_folder_path, 
  has_attachments, memo
) VALUES (
  'schedule_1', 'YOUR_ACTUAL_USER_ID_1', 'ABC 건설 현장 작업', 
  '철근 배근 및 콘크리트 타설 작업', '2024-01-15', '2024-01-15', 'construction',
  'ABC 건설 현장', '서울특별시 송파구 올림픽로 300', true, '[]',
  'schedules/ABC_건설_현장_작업/', false, '날씨가 좋을 때 진행 예정'
);

-- 케이스 2: 다중일 스케줄 (동일 시간)
INSERT INTO schedules (
  id, user_id, title, description, start_date, end_date, category, 
  location, address, uniform_time, schedule_times, documents_folder_path, 
  has_attachments, memo
) VALUES (
  'schedule_2', 'YOUR_ACTUAL_USER_ID_1', 'XYZ 아파트 리모델링', 
  '주방 및 화장실 리모델링 작업', '2024-01-20', '2024-01-25', 'renovation',
  'XYZ 아파트 101동', '경기도 성남시 분당구 정자동 123', true, '[]',
  'schedules/XYZ_아파트_리모델링/', true, '6일간 연속 작업'
);

-- =====================================================
-- 6. 스케줄-근로자 관계 데이터
-- =====================================================

-- ABC 건설 현장 작업 (단일일, 2명 근로자)
INSERT INTO schedule_workers (
  id, user_id, schedule_id, worker_id, work_start_date, work_end_date,
  uniform_time, hourly_wage, fuel_allowance, other_allowance,
  overtime_enabled, night_shift_enabled, tax_withheld, wage_paid
) VALUES 
('schedule_worker_1', 'YOUR_ACTUAL_USER_ID_1', 'schedule_1', 'worker_1', '2024-01-15', '2024-01-15', true, 15000, 5000, 0, true, true, true, false),
('schedule_worker_2', 'YOUR_ACTUAL_USER_ID_1', 'schedule_1', 'worker_2', '2024-01-15', '2024-01-15', true, 16000, 5000, 2000, true, true, true, false);

-- XYZ 아파트 리모델링 (다중일, 3명 근로자)
INSERT INTO schedule_workers (
  id, user_id, schedule_id, worker_id, work_start_date, work_end_date,
  uniform_time, hourly_wage, fuel_allowance, other_allowance,
  overtime_enabled, night_shift_enabled, tax_withheld, wage_paid
) VALUES 
('schedule_worker_3', 'YOUR_ACTUAL_USER_ID_1', 'schedule_2', 'worker_1', '2024-01-20', '2024-01-25', true, 15000, 5000, 0, true, true, true, false),
('schedule_worker_4', 'YOUR_ACTUAL_USER_ID_1', 'schedule_2', 'worker_2', '2024-01-20', '2024-01-25', true, 16000, 5000, 2000, true, true, true, false),
('schedule_worker_5', 'YOUR_ACTUAL_USER_ID_1', 'schedule_2', 'worker_3', '2024-01-22', '2024-01-25', true, 14000, 3000, 0, true, true, true, false);

-- =====================================================
-- 7. 작업 기간 데이터
-- =====================================================

-- ABC 건설 현장 작업의 작업 기간
INSERT INTO work_periods (
  id, user_id, schedule_worker_id, work_date, start_time, end_time, break_duration, 
  overtime_hours, daily_wage, memo
) VALUES 
('work_period_1', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_1', '2024-01-15', '09:00', '18:00', 60, 0, 120000, '철근 배근 작업'),
('work_period_2', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_2', '2024-01-15', '09:00', '18:00', 60, 0, 128000, '콘크리트 타설 작업');

-- XYZ 아파트 리모델링의 작업 기간 (6일간)
INSERT INTO work_periods (
  id, user_id, schedule_worker_id, work_date, start_time, end_time, break_duration, 
  overtime_hours, daily_wage, memo
) VALUES 
-- 박민수 (worker_1) - 6일간
('work_period_3', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_3', '2024-01-20', '09:00', '18:00', 60, 0, 120000, '주방 리모델링'),
('work_period_4', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_3', '2024-01-21', '09:00', '18:00', 60, 0, 120000, '주방 리모델링'),
('work_period_5', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_3', '2024-01-22', '09:00', '18:00', 60, 0, 120000, '주방 리모델링'),
('work_period_6', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_3', '2024-01-23', '09:00', '18:00', 60, 0, 120000, '주방 리모델링'),
('work_period_7', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_3', '2024-01-24', '09:00', '18:00', 60, 0, 120000, '주방 리모델링'),
('work_period_8', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_3', '2024-01-25', '09:00', '18:00', 60, 0, 120000, '주방 리모델링'),

-- 최영희 (worker_2) - 6일간
('work_period_9', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_4', '2024-01-20', '09:00', '18:00', 60, 0, 128000, '화장실 리모델링'),
('work_period_10', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_4', '2024-01-21', '09:00', '18:00', 60, 0, 128000, '화장실 리모델링'),
('work_period_11', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_4', '2024-01-22', '09:00', '18:00', 60, 0, 128000, '화장실 리모델링'),
('work_period_12', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_4', '2024-01-23', '09:00', '18:00', 60, 0, 128000, '화장실 리모델링'),
('work_period_13', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_4', '2024-01-24', '09:00', '18:00', 60, 0, 128000, '화장실 리모델링'),
('work_period_14', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_4', '2024-01-25', '09:00', '18:00', 60, 0, 128000, '화장실 리모델링'),

-- 정수진 (worker_3) - 4일간 (1월 22일부터)
('work_period_15', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_5', '2024-01-22', '09:00', '18:00', 60, 0, 112000, '마감 작업'),
('work_period_16', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_5', '2024-01-23', '09:00', '18:00', 60, 0, 112000, '마감 작업'),
('work_period_17', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_5', '2024-01-24', '09:00', '18:00', 60, 0, 112000, '마감 작업'),
('work_period_18', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_5', '2024-01-25', '09:00', '18:00', 60, 0, 112000, '마감 작업');

-- =====================================================
-- 8. 급여 계산 데이터
-- =====================================================

-- ABC 건설 현장 작업의 급여 계산
INSERT INTO payroll_calculations (
  id, user_id, schedule_worker_id, total_hours, regular_hours, overtime_hours, night_hours,
  regular_pay, overtime_pay, night_shift_pay, fuel_allowance, other_allowance, 
  total_gross_pay, tax_amount, net_pay
) VALUES 
('payroll_1', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_1', 8.0, 8.0, 0, 0, 120000, 0, 0, 5000, 0, 125000, 4125, 120875),
('payroll_2', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_2', 8.0, 8.0, 0, 0, 128000, 0, 0, 5000, 2000, 135000, 4455, 130545);

-- XYZ 아파트 리모델링의 급여 계산 (6일간)
INSERT INTO payroll_calculations (
  id, user_id, schedule_worker_id, total_hours, regular_hours, overtime_hours, night_hours,
  regular_pay, overtime_pay, night_shift_pay, fuel_allowance, other_allowance, 
  total_gross_pay, tax_amount, net_pay
) VALUES 
('payroll_3', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_3', 48.0, 48.0, 0, 0, 720000, 0, 0, 30000, 0, 750000, 24750, 725250),
('payroll_4', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_4', 48.0, 48.0, 0, 0, 768000, 0, 0, 30000, 12000, 810000, 26730, 783270),
('payroll_5', 'YOUR_ACTUAL_USER_ID_1', 'schedule_worker_5', 32.0, 32.0, 0, 0, 448000, 0, 0, 12000, 0, 460000, 15180, 444820);

-- =====================================================
-- 9. 카테고리 데이터
-- =====================================================

INSERT INTO categories (
  id, name, color, user_id
) VALUES 
('category_1', '건설', '#FF6B6B', 'YOUR_ACTUAL_USER_ID_1'),
('category_2', '리모델링', '#4ECDC4', 'YOUR_ACTUAL_USER_ID_1'),
('category_3', '전기공사', '#45B7D1', 'YOUR_ACTUAL_USER_ID_1'),
('category_4', '청소', '#96CEB4', 'YOUR_ACTUAL_USER_ID_1'),
('category_5', '정비', '#FFEAA7', 'YOUR_ACTUAL_USER_ID_1'),
('category_6', '기타', '#DDA0DD', 'YOUR_ACTUAL_USER_ID_1');

-- =====================================================
-- 사용법:
-- =====================================================
-- 1. Supabase에서 실제 사용자 ID를 확인하세요
-- 2. 'YOUR_ACTUAL_USER_ID_1'을 실제 UUID로 교체하세요
-- 3. 필요에 따라 'YOUR_ACTUAL_USER_ID_2'도 교체하세요
-- 4. 이 파일을 Supabase SQL Editor에서 실행하세요
