-- =====================================================
-- 실제 사용자 ID 확인 및 테스트 데이터 생성
-- =====================================================

-- 1. 먼저 사용자 ID를 확인하세요


-- =====================================================
-- 2. 위 쿼리 결과로 나온 UUID를 복사해서 아래 쿼리에서 사용하세요
-- =====================================================
-- 예시: 만약 사용자 ID가 '12345678-1234-1234-1234-123456789abc'라면
-- 아래의 'a2d5ac96-ddc8-4745-be2d-c9b182924081'를 '12345678-1234-1234-1234-123456789abc'로 교체하세요

-- =====================================================
-- 3. 사용자 프로필 데이터
-- =====================================================

INSERT INTO user_profiles (
  id, business_name, business_number, business_address, 
  business_phone, business_email, business_card_image_url, business_license_image_url
) VALUES (
  'a2d5ac96-ddc8-4745-be2d-c9b182924081', 
  'Remit Planner 관리자', 
  '123-45-67890', 
  '서울특별시 강남구 테헤란로 123', 
  '02-1234-5678', 
  'admin@remit-planner.com',
  'https://storage.supabase.co/remit-planner-files/users/a2d5ac96-ddc8-4745-be2d-c9b182924081/business_card.jpg',
  'https://storage.supabase.co/remit-planner-files/users/a2d5ac96-ddc8-4745-be2d-c9b182924081/business_license.pdf'
);

-- =====================================================
-- 4. 근로자 데이터
-- =====================================================

INSERT INTO workers (
  id, user_id, name, phone, resident_number, bank_account, 
  hourly_wage, fuel_allowance, other_allowance, id_card_image_url, memo
) VALUES 
('worker_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', '박민수', '010-1111-2222', '900101-1234567', '1002-123-456789', 15000, 5000, 0, 'https://storage.supabase.co/remit-planner-files/workers/박민수/id_card.jpg', '경력 5년, 믿을만한 근로자'),
('worker_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', '최영희', '010-3333-4444', '880215-2345678', '1002-987-654321', 16000, 5000, 2000, 'https://storage.supabase.co/remit-planner-files/workers/최영희/id_card.jpg', '야간 근무 가능'),
('worker_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', '정수진', '010-5555-6666', '920310-3456789', '1002-456-789123', 14000, 3000, 0, 'https://storage.supabase.co/remit-planner-files/workers/정수진/id_card.jpg', '신입, 열심히 배우는 중'),
('worker_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', '김대호', '010-7777-8888', '870512-4567890', '1002-789-123456', 18000, 6000, 3000, 'https://storage.supabase.co/remit-planner-files/workers/김대호/id_card.jpg', '고급 기술자'),
('worker_5', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', '이소영', '010-9999-0000', '930825-5678901', '1002-321-654987', 15000, 4000, 1000, 'https://storage.supabase.co/remit-planner-files/workers/이소영/id_card.jpg', '청소 전문가');

-- =====================================================
-- 5. 거래처 데이터
-- =====================================================

INSERT INTO clients (
  id, user_id, name, phone, email, address, business_number, 
  contact_person, documents_folder_path, memo, total_revenue, unpaid_amount
) VALUES 
('client_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'ABC 건설', '02-1111-2222', 'contact@abc-construction.com', '서울특별시 송파구 올림픽로 300', '123-45-67890', '김부장', 'clients/ABC_건설/', '대형 건설사, 안정적인 거래처', 50000000, 0),
('client_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'XYZ 아파트', '02-3333-4444', 'manager@xyz-apt.com', '경기도 성남시 분당구 정자동 123', '987-65-43210', '이과장', 'clients/XYZ_아파트/', '신축 아파트 단지', 30000000, 5000000),
('client_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'DEF 오피스텔', '02-5555-6666', 'admin@def-officetel.com', '서울특별시 강남구 역삼동 456', '456-78-90123', '박대리', 'clients/DEF_오피스텔/', '오피스텔 리모델링', 15000000, 0),
('client_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'GHI 호텔', '031-1111-2222', 'housekeeping@ghi-hotel.com', '경기도 수원시 영통구 월드컵로 200', '111-22-33333', '최팀장', 'clients/GHI_호텔/', '5성급 호텔', 25000000, 0),
('client_5', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'JKL 병원', '031-3333-4444', 'admin@jkl-hospital.com', '경기도 안양시 동안구 시민대로 100', '444-55-66666', '한과장', 'clients/JKL_병원/', '종합병원', 20000000, 2000000);

-- =====================================================
-- 6. 거래처 담당자 데이터
-- =====================================================

INSERT INTO client_contacts (
  id, user_id, client_id, name, position, phone, memo, is_primary
) VALUES 
('contact_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'client_1', '김부장', '현장소장', '010-1111-1111', '현장 총괄', 1),
('contact_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'client_1', '이과장', '안전관리자', '010-2222-2222', '안전 관련 업무', 0),
('contact_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'client_2', '이과장', '관리과장', '010-3333-3333', '아파트 관리', 1),
('contact_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'client_2', '박대리', '시설담당', '010-4444-4444', '시설 점검', 0),
('contact_5', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'client_4', '최팀장', '하우스키핑팀장', '010-5555-5555', '청소 업무 총괄', 1),
('contact_6', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'client_4', '한대리', '객실담당', '010-6666-6666', '객실 청소', 0);

-- =====================================================
-- 7. 스케줄 데이터
-- =====================================================

-- 케이스 1: 단일일 스케줄 (동일 시간)
INSERT INTO schedules (
  id, user_id, title, description, start_date, end_date, category, 
  location, address, uniform_time, documents_folder_path, 
  has_attachments, memo
) VALUES (
  'schedule_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'ABC 건설 현장 작업', 
  '철근 배근 및 콘크리트 타설 작업', '2024-01-15', '2024-01-15', 'construction',
  'ABC 건설 현장', '서울특별시 송파구 올림픽로 300', true,
  'schedules/ABC_건설_현장_작업/', false, '날씨가 좋을 때 진행 예정'
);

-- 케이스 2: 다중일 스케줄 (동일 시간)
INSERT INTO schedules (
  id, user_id, title, description, start_date, end_date, category, 
  location, address, uniform_time, documents_folder_path, 
  has_attachments, memo
) VALUES (
  'schedule_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'XYZ 아파트 리모델링', 
  '주방 및 화장실 리모델링 작업', '2024-01-20', '2024-01-25', 'renovation',
  'XYZ 아파트 101동', '경기도 성남시 분당구 정자동 123', true,
  'schedules/XYZ_아파트_리모델링/', true, '6일간 연속 작업'
);

-- 케이스 3: 다중일 스케줄 (일별 다른 시간)
INSERT INTO schedules (
  id, user_id, title, description, start_date, end_date, category, 
  location, address, uniform_time, documents_folder_path, 
  has_attachments, memo
) VALUES (
  'schedule_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'DEF 오피스텔 전기 공사', 
  '전기 배선 및 조명 설치', '2024-01-30', '2024-02-02', 'electrical',
  'DEF 오피스텔 지하1층', '서울특별시 강남구 역삼동 456', false,
  'schedules/DEF_오피스텔_전기_공사/', true, '야간 작업 포함'
);

-- 케이스 4: 청소 스케줄
INSERT INTO schedules (
  id, user_id, title, description, start_date, end_date, category, 
  location, address, uniform_time, documents_folder_path, 
  has_attachments, memo
) VALUES (
  'schedule_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'GHI 호텔 특별 청소', 
  'VIP 객실 및 로비 특별 청소', '2024-02-05', '2024-02-05', 'cleaning',
  'GHI 호텔 5층', '경기도 수원시 영통구 월드컵로 200', true,
  'schedules/GHI_호텔_특별_청소/', false, 'VIP 고객 투숙 전'
);

-- =====================================================
-- 8. 스케줄 시간 데이터 (일별 시간 설정)
-- =====================================================

-- DEF 오피스텔 전기 공사의 일별 시간 설정
INSERT INTO schedule_times (
  id, user_id, schedule_id, work_date, start_time, end_time, break_duration
) VALUES 
('schedule_time_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_3', '2024-01-30', '09:00:00', '18:00:00', 60),
('schedule_time_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_3', '2024-01-31', '08:00:00', '17:00:00', 60),
('schedule_time_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_3', '2024-02-01', '10:00:00', '19:00:00', 60),
('schedule_time_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_3', '2024-02-02', '07:00:00', '16:00:00', 60);

-- =====================================================
-- 9. 스케줄-근로자 관계 데이터
-- =====================================================

-- ABC 건설 현장 작업 (단일일, 2명 근로자)
INSERT INTO schedule_workers (
  id, user_id, schedule_id, worker_id, work_start_date, work_end_date,
  uniform_time, hourly_wage, fuel_allowance, other_allowance,
  overtime_enabled, night_shift_enabled, tax_withheld, wage_paid
) VALUES 
('schedule_worker_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_1', 'worker_1', '2024-01-15', '2024-01-15', true, 15000, 5000, 0, true, true, true, false),
('schedule_worker_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_1', 'worker_2', '2024-01-15', '2024-01-15', true, 16000, 5000, 2000, true, true, true, false);

-- XYZ 아파트 리모델링 (다중일, 3명 근로자)
INSERT INTO schedule_workers (
  id, user_id, schedule_id, worker_id, work_start_date, work_end_date,
  uniform_time, hourly_wage, fuel_allowance, other_allowance,
  overtime_enabled, night_shift_enabled, tax_withheld, wage_paid
) VALUES 
('schedule_worker_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_2', 'worker_1', '2024-01-20', '2024-01-25', true, 15000, 5000, 0, true, true, true, false),
('schedule_worker_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_2', 'worker_2', '2024-01-20', '2024-01-25', true, 16000, 5000, 2000, true, true, true, false),
('schedule_worker_5', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_2', 'worker_3', '2024-01-22', '2024-01-25', true, 14000, 3000, 0, true, true, true, false);

-- DEF 오피스텔 전기 공사 (다중일, 일별 다른 시간, 2명 근로자)
INSERT INTO schedule_workers (
  id, user_id, schedule_id, worker_id, work_start_date, work_end_date,
  uniform_time, hourly_wage, fuel_allowance, other_allowance,
  overtime_enabled, night_shift_enabled, tax_withheld, wage_paid
) VALUES 
('schedule_worker_6', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_3', 'worker_1', '2024-01-30', '2024-02-02', false, 15000, 5000, 0, true, true, true, false),
('schedule_worker_7', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_3', 'worker_2', '2024-01-30', '2024-02-02', false, 16000, 5000, 2000, true, true, true, false);

-- GHI 호텔 특별 청소 (단일일, 2명 근로자)
INSERT INTO schedule_workers (
  id, user_id, schedule_id, worker_id, work_start_date, work_end_date,
  uniform_time, hourly_wage, fuel_allowance, other_allowance,
  overtime_enabled, night_shift_enabled, tax_withheld, wage_paid
) VALUES 
('schedule_worker_8', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_4', 'worker_4', '2024-02-05', '2024-02-05', true, 18000, 6000, 3000, true, true, true, false),
('schedule_worker_9', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_4', 'worker_5', '2024-02-05', '2024-02-05', true, 15000, 4000, 1000, true, true, true, false);

-- =====================================================
-- 10. 근로자별 시간 설정 데이터 (일별 다른 시간인 경우)
-- =====================================================

-- DEF 오피스텔 전기 공사의 근로자별 시간 설정
INSERT INTO worker_times (
  id, user_id, schedule_worker_id, work_date, start_time, end_time, break_duration
) VALUES 
-- 박민수 (worker_1)의 시간 설정
('worker_time_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_6', '2024-01-30', '09:00:00', '18:00:00', 60),
('worker_time_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_6', '2024-01-31', '08:00:00', '17:00:00', 60),
('worker_time_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_6', '2024-02-01', '10:00:00', '19:00:00', 60),
('worker_time_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_6', '2024-02-02', '07:00:00', '16:00:00', 60),

-- 최영희 (worker_2)의 시간 설정 (다른 시간)
('worker_time_5', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_7', '2024-01-30', '10:00:00', '19:00:00', 60),
('worker_time_6', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_7', '2024-01-31', '09:00:00', '18:00:00', 60),
('worker_time_7', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_7', '2024-02-01', '11:00:00', '20:00:00', 60),
('worker_time_8', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_7', '2024-02-02', '08:00:00', '17:00:00', 60);

-- =====================================================
-- 11. 작업 기간 데이터
-- =====================================================

-- ABC 건설 현장 작업의 작업 기간
INSERT INTO work_periods (
  id, user_id, schedule_worker_id, work_date, start_time, end_time, break_duration, 
  overtime_hours, daily_wage, memo
) VALUES 
('work_period_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_1', '2024-01-15', '09:00:00', '18:00:00', 60, 0, 120000, '철근 배근 작업'),
('work_period_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_2', '2024-01-15', '09:00:00', '18:00:00', 60, 0, 128000, '콘크리트 타설 작업');

-- XYZ 아파트 리모델링의 작업 기간 (6일간)
INSERT INTO work_periods (
  id, user_id, schedule_worker_id, work_date, start_time, end_time, break_duration, 
  overtime_hours, daily_wage, memo
) VALUES 
-- 박민수 (worker_1) - 6일간
('work_period_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_3', '2024-01-20', '09:00:00', '18:00:00', 60, 0, 120000, '주방 리모델링'),
('work_period_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_3', '2024-01-21', '09:00:00', '18:00:00', 60, 0, 120000, '주방 리모델링'),
('work_period_5', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_3', '2024-01-22', '09:00:00', '18:00:00', 60, 0, 120000, '주방 리모델링'),
('work_period_6', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_3', '2024-01-23', '09:00:00', '18:00:00', 60, 0, 120000, '주방 리모델링'),
('work_period_7', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_3', '2024-01-24', '09:00:00', '18:00:00', 60, 0, 120000, '주방 리모델링'),
('work_period_8', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_3', '2024-01-25', '09:00:00', '18:00:00', 60, 0, 120000, '주방 리모델링'),

-- 최영희 (worker_2) - 6일간
('work_period_9', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_4', '2024-01-20', '09:00:00', '18:00:00', 60, 0, 128000, '화장실 리모델링'),
('work_period_10', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_4', '2024-01-21', '09:00:00', '18:00:00', 60, 0, 128000, '화장실 리모델링'),
('work_period_11', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_4', '2024-01-22', '09:00:00', '18:00:00', 60, 0, 128000, '화장실 리모델링'),
('work_period_12', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_4', '2024-01-23', '09:00:00', '18:00:00', 60, 0, 128000, '화장실 리모델링'),
('work_period_13', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_4', '2024-01-24', '09:00:00', '18:00:00', 60, 0, 128000, '화장실 리모델링'),
('work_period_14', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_4', '2024-01-25', '09:00:00', '18:00:00', 60, 0, 128000, '화장실 리모델링'),

-- 정수진 (worker_3) - 4일간 (1월 22일부터)
('work_period_15', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_5', '2024-01-22', '09:00:00', '18:00:00', 60, 0, 112000, '마감 작업'),
('work_period_16', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_5', '2024-01-23', '09:00:00', '18:00:00', 60, 0, 112000, '마감 작업'),
('work_period_17', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_5', '2024-01-24', '09:00:00', '18:00:00', 60, 0, 112000, '마감 작업'),
('work_period_18', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_5', '2024-01-25', '09:00:00', '18:00:00', 60, 0, 112000, '마감 작업');

-- GHI 호텔 특별 청소의 작업 기간
INSERT INTO work_periods (
  id, user_id, schedule_worker_id, work_date, start_time, end_time, break_duration, 
  overtime_hours, daily_wage, memo
) VALUES 
('work_period_19', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_8', '2024-02-05', '09:00:00', '18:00:00', 60, 0, 144000, 'VIP 객실 청소'),
('work_period_20', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_9', '2024-02-05', '09:00:00', '18:00:00', 60, 0, 120000, '로비 청소');

-- =====================================================
-- 12. 급여 계산 데이터
-- =====================================================

-- ABC 건설 현장 작업의 급여 계산
INSERT INTO payroll_calculations (
  id, user_id, schedule_worker_id, total_hours, regular_hours, overtime_hours, night_hours,
  regular_pay, overtime_pay, night_shift_pay, fuel_allowance, other_allowance, 
  total_gross_pay, tax_amount, net_pay
) VALUES 
('payroll_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_1', 8.0, 8.0, 0, 0, 120000, 0, 0, 5000, 0, 125000, 4125, 120875),
('payroll_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_2', 8.0, 8.0, 0, 0, 128000, 0, 0, 5000, 2000, 135000, 4455, 130545);

-- XYZ 아파트 리모델링의 급여 계산 (6일간)
INSERT INTO payroll_calculations (
  id, user_id, schedule_worker_id, total_hours, regular_hours, overtime_hours, night_hours,
  regular_pay, overtime_pay, night_shift_pay, fuel_allowance, other_allowance, 
  total_gross_pay, tax_amount, net_pay
) VALUES 
('payroll_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_3', 48.0, 48.0, 0, 0, 720000, 0, 0, 30000, 0, 750000, 24750, 725250),
('payroll_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_4', 48.0, 48.0, 0, 0, 768000, 0, 0, 30000, 12000, 810000, 26730, 783270),
('payroll_5', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_5', 32.0, 32.0, 0, 0, 448000, 0, 0, 12000, 0, 460000, 15180, 444820);

-- GHI 호텔 특별 청소의 급여 계산
INSERT INTO payroll_calculations (
  id, user_id, schedule_worker_id, total_hours, regular_hours, overtime_hours, night_hours,
  regular_pay, overtime_pay, night_shift_pay, fuel_allowance, other_allowance, 
  total_gross_pay, tax_amount, net_pay
) VALUES 
('payroll_6', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_8', 8.0, 8.0, 0, 0, 144000, 0, 0, 6000, 3000, 153000, 5049, 147951),
('payroll_7', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_9', 8.0, 8.0, 0, 0, 120000, 0, 0, 4000, 1000, 125000, 4125, 120875);

-- =====================================================
-- 13. 거래처 문서 데이터
-- =====================================================

-- ABC 건설 관련 문서
INSERT INTO client_documents (
  id, user_id, client_id, file_name, file_url, file_path, file_type, file_size
) VALUES 
('client_doc_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'client_1', '계약서.pdf', 'https://storage.supabase.co/remit-planner-files/clients/ABC_건설/계약서.pdf', 'clients/ABC_건설/계약서.pdf', 'application/pdf', 2048576),
('client_doc_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'client_1', '현장사진1.jpg', 'https://storage.supabase.co/remit-planner-files/clients/ABC_건설/현장사진1.jpg', 'clients/ABC_건설/현장사진1.jpg', 'image/jpeg', 1024000);

-- XYZ 아파트 관련 문서
INSERT INTO client_documents (
  id, user_id, client_id, file_name, file_url, file_path, file_type, file_size
) VALUES 
('client_doc_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'client_2', '리모델링_계약서.pdf', 'https://storage.supabase.co/remit-planner-files/clients/XYZ_아파트/리모델링_계약서.pdf', 'clients/XYZ_아파트/리모델링_계약서.pdf', 'application/pdf', 1536000),
('client_doc_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'client_2', '현장_측량도.pdf', 'https://storage.supabase.co/remit-planner-files/clients/XYZ_아파트/현장_측량도.pdf', 'clients/XYZ_아파트/현장_측량도.pdf', 'application/pdf', 3072000);

-- =====================================================
-- 14. 스케줄 문서 데이터
-- =====================================================

-- DEF 오피스텔 전기 공사 관련 문서
INSERT INTO schedule_documents (
  id, user_id, schedule_id, file_name, file_url, file_path, file_type, file_size, document_type
) VALUES 
('schedule_doc_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_3', '전기_설계도.pdf', 'https://storage.supabase.co/remit-planner-files/schedules/DEF_오피스텔_전기_공사/전기_설계도.pdf', 'schedules/DEF_오피스텔_전기_공사/전기_설계도.pdf', 'application/pdf', 4096000, 'manual'),
('schedule_doc_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_3', '안전수칙.pdf', 'https://storage.supabase.co/remit-planner-files/schedules/DEF_오피스텔_전기_공사/안전수칙.pdf', 'schedules/DEF_오피스텔_전기_공사/안전수칙.pdf', 'application/pdf', 512000, 'guide'),
('schedule_doc_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_3', '현장사진.jpg', 'https://storage.supabase.co/remit-planner-files/schedules/DEF_오피스텔_전기_공사/현장사진.jpg', 'schedules/DEF_오피스텔_전기_공사/현장사진.jpg', 'image/jpeg', 2048000, 'photo');

-- =====================================================
-- 15. 활동 로그 데이터
-- =====================================================

INSERT INTO activities (
  id, user_id, type, title, description, related_id, icon, color
) VALUES 
('activity_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule', '새 일정 추가', 'ABC 건설 현장 작업 일정이 추가되었습니다', 'schedule_1', 'calendar', '#007AFF'),
('activity_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'worker', '근로자 등록', '박민수 근로자가 등록되었습니다', 'worker_1', 'person', '#34C759'),
('activity_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule', '일정 수정', 'XYZ 아파트 리모델링 일정이 수정되었습니다', 'schedule_2', 'create', '#FF9500'),
('activity_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'payment', '급여 지급', 'ABC 건설 현장 작업 급여가 지급되었습니다', 'payroll_1', 'card', '#FF3B30'),
('activity_5', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule', '일정 완료', 'GHI 호텔 특별 청소가 완료되었습니다', 'schedule_4', 'checkmark-circle', '#30D158');

-- =====================================================
-- 16. 카테고리 데이터
-- =====================================================

INSERT INTO categories (
  id, name, color, user_id
) VALUES 
('category_1', '건설', '#FF6B6B', 'a2d5ac96-ddc8-4745-be2d-c9b182924081'),
('category_2', '리모델링', '#4ECDC4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081'),
('category_3', '전기공사', '#45B7D1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081'),
('category_4', '청소', '#96CEB4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081'),
('category_5', '정비', '#FFEAA7', 'a2d5ac96-ddc8-4745-be2d-c9b182924081'),
('category_6', '기타', '#DDA0DD', 'a2d5ac96-ddc8-4745-be2d-c9b182924081');

-- =====================================================
-- 사용법:
-- =====================================================
-- 1. 먼저 첫 번째 쿼리를 실행해서 사용자 ID를 확인하세요
-- 2. 결과로 나온 UUID를 복사하세요
-- 3. 아래 모든 'a2d5ac96-ddc8-4745-be2d-c9b182924081'를 실제 UUID로 교체하세요
-- 4. 이 파일을 Supabase SQL Editor에서 실행하세요
