-- =====================================================
-- 테스트용 사용자 생성 및 데이터 삽입
-- =====================================================
-- 이 방법은 테스트용 사용자를 먼저 생성한 후 데이터를 삽입합니다.

-- =====================================================
-- 1. 테스트용 사용자 생성 (auth.users에 직접 삽입)
-- =====================================================
-- 주의: 이 방법은 개발/테스트 환경에서만 사용하세요.

-- 테스트 사용자 1: 김철수
INSERT INTO auth.users (
  id, 
  instance_id, 
  aud, 
  role, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  recovery_sent_at, 
  last_sign_in_at, 
  raw_app_meta_data, 
  raw_user_meta_data, 
  created_at, 
  updated_at, 
  confirmation_token, 
  email_change, 
  email_change_token, 
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'kim@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NULL,
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "김철수"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 테스트 사용자 2: 이영희
INSERT INTO auth.users (
  id, 
  instance_id, 
  aud, 
  role, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  recovery_sent_at, 
  last_sign_in_at, 
  raw_app_meta_data, 
  raw_user_meta_data, 
  created_at, 
  updated_at, 
  confirmation_token, 
  email_change, 
  email_change_token, 
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'lee@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NULL,
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "이영희"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- =====================================================
-- 2. 사용자 프로필 데이터
-- =====================================================

-- 사용자 1: 김철수 (사업체 운영자)
INSERT INTO user_profiles (
  id, business_name, business_number, business_address, 
  business_phone, business_email, business_card_image_url, business_license_image_url
) VALUES (
  '00000000-0000-0000-0000-000000000001', 
  '김철수 건설', 
  '123-45-67890', 
  '서울특별시 강남구 테헤란로 123', 
  '02-1234-5678', 
  'kim@test.com',
  'https://storage.supabase.co/remit-planner-files/users/00000000-0000-0000-0000-000000000001/business_card.jpg',
  'https://storage.supabase.co/remit-planner-files/users/00000000-0000-0000-0000-000000000001/business_license.pdf'
);

-- 사용자 2: 이영희 (개인 사업자)
INSERT INTO user_profiles (
  id, business_name, business_number, business_address, 
  business_phone, business_email
) VALUES (
  '00000000-0000-0000-0000-000000000002', 
  '이영희 청소 서비스', 
  '987-65-43210', 
  '경기도 성남시 분당구 판교로 456', 
  '031-9876-5432', 
  'lee@test.com'
);

-- =====================================================
-- 3. 근로자 데이터
-- =====================================================

-- 김철수 사업체의 근로자들
INSERT INTO workers (
  id, user_id, name, phone, resident_number, bank_account, 
  hourly_wage, fuel_allowance, other_allowance, id_card_image_url, memo
) VALUES 
('worker_1', '00000000-0000-0000-0000-000000000001', '박민수', '010-1111-2222', '900101-1234567', '1002-123-456789', 15000, 5000, 0, 'https://storage.supabase.co/remit-planner-files/workers/박민수/id_card.jpg', '경력 5년, 믿을만한 근로자'),
('worker_2', '00000000-0000-0000-0000-000000000001', '최영희', '010-3333-4444', '880215-2345678', '1002-987-654321', 16000, 5000, 2000, 'https://storage.supabase.co/remit-planner-files/workers/최영희/id_card.jpg', '야간 근무 가능'),
('worker_3', '00000000-0000-0000-0000-000000000001', '정수진', '010-5555-6666', '920310-3456789', '1002-456-789123', 14000, 3000, 0, 'https://storage.supabase.co/remit-planner-files/workers/정수진/id_card.jpg', '신입, 열심히 배우는 중'),

-- 이영희 사업체의 근로자들
('worker_4', '00000000-0000-0000-0000-000000000002', '김대호', '010-7777-8888', '870512-4567890', '1002-789-123456', 18000, 6000, 3000, 'https://storage.supabase.co/remit-planner-files/workers/김대호/id_card.jpg', '고급 기술자'),
('worker_5', '00000000-0000-0000-0000-000000000002', '이소영', '010-9999-0000', '930825-5678901', '1002-321-654987', 15000, 4000, 1000, 'https://storage.supabase.co/remit-planner-files/workers/이소영/id_card.jpg', '청소 전문가');

-- =====================================================
-- 4. 거래처 데이터
-- =====================================================

-- 김철수 사업체의 거래처들
INSERT INTO clients (
  id, user_id, name, phone, email, address, business_number, 
  contact_person, documents_folder_path, memo, total_revenue, unpaid_amount
) VALUES 
('client_1', '00000000-0000-0000-0000-000000000001', 'ABC 건설', '02-1111-2222', 'contact@abc-construction.com', '서울특별시 송파구 올림픽로 300', '123-45-67890', '김부장', 'clients/ABC_건설/', '대형 건설사, 안정적인 거래처', 50000000, 0),
('client_2', '00000000-0000-0000-0000-000000000001', 'XYZ 아파트', '02-3333-4444', 'manager@xyz-apt.com', '경기도 성남시 분당구 정자동 123', '987-65-43210', '이과장', 'clients/XYZ_아파트/', '신축 아파트 단지', 30000000, 5000000),
('client_3', '00000000-0000-0000-0000-000000000001', 'DEF 오피스텔', '02-5555-6666', 'admin@def-officetel.com', '서울특별시 강남구 역삼동 456', '456-78-90123', '박대리', 'clients/DEF_오피스텔/', '오피스텔 리모델링', 15000000, 0);

-- 이영희 사업체의 거래처들
INSERT INTO clients (
  id, user_id, name, phone, email, address, business_number, 
  contact_person, documents_folder_path, memo, total_revenue, unpaid_amount
) VALUES 
('client_4', '00000000-0000-0000-0000-000000000002', 'GHI 호텔', '031-1111-2222', 'housekeeping@ghi-hotel.com', '경기도 수원시 영통구 월드컵로 200', '111-22-33333', '최팀장', 'clients/GHI_호텔/', '5성급 호텔', 25000000, 0),
('client_5', '00000000-0000-0000-0000-000000000002', 'JKL 병원', '031-3333-4444', 'admin@jkl-hospital.com', '경기도 안양시 동안구 시민대로 100', '444-55-66666', '한과장', 'clients/JKL_병원/', '종합병원', 20000000, 2000000);

-- =====================================================
-- 5. 스케줄 데이터
-- =====================================================

-- 케이스 1: 단일일 스케줄 (동일 시간)
INSERT INTO schedules (
  id, user_id, title, description, start_date, end_date, category, 
  location, address, uniform_time, schedule_times, documents_folder_path, 
  has_attachments, memo
) VALUES (
  'schedule_1', '00000000-0000-0000-0000-000000000001', 'ABC 건설 현장 작업', 
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
  'schedule_2', '00000000-0000-0000-0000-000000000001', 'XYZ 아파트 리모델링', 
  '주방 및 화장실 리모델링 작업', '2024-01-20', '2024-01-25', 'renovation',
  'XYZ 아파트 101동', '경기도 성남시 분당구 정자동 123', true, '[]',
  'schedules/XYZ_아파트_리모델링/', true, '6일간 연속 작업'
);

-- 케이스 3: 이영희 사업체의 청소 스케줄
INSERT INTO schedules (
  id, user_id, title, description, start_date, end_date, category, 
  location, address, uniform_time, schedule_times, documents_folder_path, 
  has_attachments, memo
) VALUES (
  'schedule_3', '00000000-0000-0000-0000-000000000002', 'GHI 호텔 특별 청소', 
  'VIP 객실 및 로비 특별 청소', '2024-02-05', '2024-02-05', 'cleaning',
  'GHI 호텔 5층', '경기도 수원시 영통구 월드컵로 200', true, '[]',
  'schedules/GHI_호텔_특별_청소/', false, 'VIP 고객 투숙 전'
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
('schedule_worker_1', '00000000-0000-0000-0000-000000000001', 'schedule_1', 'worker_1', '2024-01-15', '2024-01-15', true, 15000, 5000, 0, true, true, true, false),
('schedule_worker_2', '00000000-0000-0000-0000-000000000001', 'schedule_1', 'worker_2', '2024-01-15', '2024-01-15', true, 16000, 5000, 2000, true, true, true, false);

-- XYZ 아파트 리모델링 (다중일, 3명 근로자)
INSERT INTO schedule_workers (
  id, user_id, schedule_id, worker_id, work_start_date, work_end_date,
  uniform_time, hourly_wage, fuel_allowance, other_allowance,
  overtime_enabled, night_shift_enabled, tax_withheld, wage_paid
) VALUES 
('schedule_worker_3', '00000000-0000-0000-0000-000000000001', 'schedule_2', 'worker_1', '2024-01-20', '2024-01-25', true, 15000, 5000, 0, true, true, true, false),
('schedule_worker_4', '00000000-0000-0000-0000-000000000001', 'schedule_2', 'worker_2', '2024-01-20', '2024-01-25', true, 16000, 5000, 2000, true, true, true, false),
('schedule_worker_5', '00000000-0000-0000-0000-000000000001', 'schedule_2', 'worker_3', '2024-01-22', '2024-01-25', true, 14000, 3000, 0, true, true, true, false);

-- GHI 호텔 특별 청소 (단일일, 2명 근로자)
INSERT INTO schedule_workers (
  id, user_id, schedule_id, worker_id, work_start_date, work_end_date,
  uniform_time, hourly_wage, fuel_allowance, other_allowance,
  overtime_enabled, night_shift_enabled, tax_withheld, wage_paid
) VALUES 
('schedule_worker_6', '00000000-0000-0000-0000-000000000002', 'schedule_3', 'worker_4', '2024-02-05', '2024-02-05', true, 18000, 6000, 3000, true, true, true, false),
('schedule_worker_7', '00000000-0000-0000-0000-000000000002', 'schedule_3', 'worker_5', '2024-02-05', '2024-02-05', true, 15000, 4000, 1000, true, true, true, false);

-- =====================================================
-- 7. 작업 기간 데이터
-- =====================================================

-- ABC 건설 현장 작업의 작업 기간
INSERT INTO work_periods (
  id, user_id, schedule_worker_id, work_date, start_time, end_time, break_duration, 
  overtime_hours, daily_wage, memo
) VALUES 
('work_period_1', '00000000-0000-0000-0000-000000000001', 'schedule_worker_1', '2024-01-15', '09:00', '18:00', 60, 0, 120000, '철근 배근 작업'),
('work_period_2', '00000000-0000-0000-0000-000000000001', 'schedule_worker_2', '2024-01-15', '09:00', '18:00', 60, 0, 128000, '콘크리트 타설 작업');

-- XYZ 아파트 리모델링의 작업 기간 (6일간)
INSERT INTO work_periods (
  id, user_id, schedule_worker_id, work_date, start_time, end_time, break_duration, 
  overtime_hours, daily_wage, memo
) VALUES 
-- 박민수 (worker_1) - 6일간
('work_period_3', '00000000-0000-0000-0000-000000000001', 'schedule_worker_3', '2024-01-20', '09:00', '18:00', 60, 0, 120000, '주방 리모델링'),
('work_period_4', '00000000-0000-0000-0000-000000000001', 'schedule_worker_3', '2024-01-21', '09:00', '18:00', 60, 0, 120000, '주방 리모델링'),
('work_period_5', '00000000-0000-0000-0000-000000000001', 'schedule_worker_3', '2024-01-22', '09:00', '18:00', 60, 0, 120000, '주방 리모델링'),
('work_period_6', '00000000-0000-0000-0000-000000000001', 'schedule_worker_3', '2024-01-23', '09:00', '18:00', 60, 0, 120000, '주방 리모델링'),
('work_period_7', '00000000-0000-0000-0000-000000000001', 'schedule_worker_3', '2024-01-24', '09:00', '18:00', 60, 0, 120000, '주방 리모델링'),
('work_period_8', '00000000-0000-0000-0000-000000000001', 'schedule_worker_3', '2024-01-25', '09:00', '18:00', 60, 0, 120000, '주방 리모델링'),

-- 최영희 (worker_2) - 6일간
('work_period_9', '00000000-0000-0000-0000-000000000001', 'schedule_worker_4', '2024-01-20', '09:00', '18:00', 60, 0, 128000, '화장실 리모델링'),
('work_period_10', '00000000-0000-0000-0000-000000000001', 'schedule_worker_4', '2024-01-21', '09:00', '18:00', 60, 0, 128000, '화장실 리모델링'),
('work_period_11', '00000000-0000-0000-0000-000000000001', 'schedule_worker_4', '2024-01-22', '09:00', '18:00', 60, 0, 128000, '화장실 리모델링'),
('work_period_12', '00000000-0000-0000-0000-000000000001', 'schedule_worker_4', '2024-01-23', '09:00', '18:00', 60, 0, 128000, '화장실 리모델링'),
('work_period_13', '00000000-0000-0000-0000-000000000001', 'schedule_worker_4', '2024-01-24', '09:00', '18:00', 60, 0, 128000, '화장실 리모델링'),
('work_period_14', '00000000-0000-0000-0000-000000000001', 'schedule_worker_4', '2024-01-25', '09:00', '18:00', 60, 0, 128000, '화장실 리모델링'),

-- 정수진 (worker_3) - 4일간 (1월 22일부터)
('work_period_15', '00000000-0000-0000-0000-000000000001', 'schedule_worker_5', '2024-01-22', '09:00', '18:00', 60, 0, 112000, '마감 작업'),
('work_period_16', '00000000-0000-0000-0000-000000000001', 'schedule_worker_5', '2024-01-23', '09:00', '18:00', 60, 0, 112000, '마감 작업'),
('work_period_17', '00000000-0000-0000-0000-000000000001', 'schedule_worker_5', '2024-01-24', '09:00', '18:00', 60, 0, 112000, '마감 작업'),
('work_period_18', '00000000-0000-0000-0000-000000000001', 'schedule_worker_5', '2024-01-25', '09:00', '18:00', 60, 0, 112000, '마감 작업');

-- GHI 호텔 특별 청소의 작업 기간
INSERT INTO work_periods (
  id, user_id, schedule_worker_id, work_date, start_time, end_time, break_duration, 
  overtime_hours, daily_wage, memo
) VALUES 
('work_period_19', '00000000-0000-0000-0000-000000000002', 'schedule_worker_6', '2024-02-05', '09:00', '18:00', 60, 0, 144000, 'VIP 객실 청소'),
('work_period_20', '00000000-0000-0000-0000-000000000002', 'schedule_worker_7', '2024-02-05', '09:00', '18:00', 60, 0, 120000, '로비 청소');

-- =====================================================
-- 8. 급여 계산 데이터
-- =====================================================

-- ABC 건설 현장 작업의 급여 계산
INSERT INTO payroll_calculations (
  id, user_id, schedule_worker_id, total_hours, regular_hours, overtime_hours, night_hours,
  regular_pay, overtime_pay, night_shift_pay, fuel_allowance, other_allowance, 
  total_gross_pay, tax_amount, net_pay
) VALUES 
('payroll_1', '00000000-0000-0000-0000-000000000001', 'schedule_worker_1', 8.0, 8.0, 0, 0, 120000, 0, 0, 5000, 0, 125000, 4125, 120875),
('payroll_2', '00000000-0000-0000-0000-000000000001', 'schedule_worker_2', 8.0, 8.0, 0, 0, 128000, 0, 0, 5000, 2000, 135000, 4455, 130545);

-- XYZ 아파트 리모델링의 급여 계산 (6일간)
INSERT INTO payroll_calculations (
  id, user_id, schedule_worker_id, total_hours, regular_hours, overtime_hours, night_hours,
  regular_pay, overtime_pay, night_shift_pay, fuel_allowance, other_allowance, 
  total_gross_pay, tax_amount, net_pay
) VALUES 
('payroll_3', '00000000-0000-0000-0000-000000000001', 'schedule_worker_3', 48.0, 48.0, 0, 0, 720000, 0, 0, 30000, 0, 750000, 24750, 725250),
('payroll_4', '00000000-0000-0000-0000-000000000001', 'schedule_worker_4', 48.0, 48.0, 0, 0, 768000, 0, 0, 30000, 12000, 810000, 26730, 783270),
('payroll_5', '00000000-0000-0000-0000-000000000001', 'schedule_worker_5', 32.0, 32.0, 0, 0, 448000, 0, 0, 12000, 0, 460000, 15180, 444820);

-- GHI 호텔 특별 청소의 급여 계산
INSERT INTO payroll_calculations (
  id, user_id, schedule_worker_id, total_hours, regular_hours, overtime_hours, night_hours,
  regular_pay, overtime_pay, night_shift_pay, fuel_allowance, other_allowance, 
  total_gross_pay, tax_amount, net_pay
) VALUES 
('payroll_6', '00000000-0000-0000-0000-000000000002', 'schedule_worker_6', 8.0, 8.0, 0, 0, 144000, 0, 0, 6000, 3000, 153000, 5049, 147951),
('payroll_7', '00000000-0000-0000-0000-000000000002', 'schedule_worker_7', 8.0, 8.0, 0, 0, 120000, 0, 0, 4000, 1000, 125000, 4125, 120875);

-- =====================================================
-- 9. 카테고리 데이터
-- =====================================================

INSERT INTO categories (
  id, name, color, user_id
) VALUES 
('category_1', '건설', '#FF6B6B', '00000000-0000-0000-0000-000000000001'),
('category_2', '리모델링', '#4ECDC4', '00000000-0000-0000-0000-000000000001'),
('category_3', '전기공사', '#45B7D1', '00000000-0000-0000-0000-000000000001'),
('category_4', '청소', '#96CEB4', '00000000-0000-0000-0000-000000000002'),
('category_5', '정비', '#FFEAA7', '00000000-0000-0000-0000-000000000001'),
('category_6', '기타', '#DDA0DD', '00000000-0000-0000-0000-000000000001');

-- =====================================================
-- 완료!
-- =====================================================
-- 이제 테스트용 사용자와 데이터가 모두 생성되었습니다.
-- 로그인 정보:
-- 사용자 1: kim@test.com / password123
-- 사용자 2: lee@test.com / password123
