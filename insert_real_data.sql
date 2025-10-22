-- 실제 사용자 ID로 데이터 INSERT
-- 사용자 ID: a2d5ac96-ddc8-4745-be2d-c9b182924081

-- 1. 근로자 데이터
INSERT INTO workers (
    id, user_id, name, phone, resident_number, bank_account,
    hourly_wage, fuel_allowance, other_allowance, id_card_image_url, memo
) VALUES
('worker_real_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', '박민수', '010-1111-2222', '900101-1234567', '1002-123-456789', 15000, 5000, 0, 'https://storage.supabase.co/remit-planner-files/workers/박민수/id_card.jpg', '경력 5년, 믿을만한 근로자'),
('worker_real_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', '최영희', '010-3333-4444', '880215-2345678', '1002-987-654321', 16000, 5000, 2000, 'https://storage.supabase.co/remit-planner-files/workers/최영희/id_card.jpg', '야간 근무 가능'),
('worker_real_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', '정수진', '010-5555-6666', '920310-3456789', '1002-456-789123', 14000, 3000, 0, 'https://storage.supabase.co/remit-planner-files/workers/정수진/id_card.jpg', '신입, 열심히 배우는 중'),
('worker_real_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', '김대호', '010-7777-8888', '870512-4567890', '1002-789-123456', 18000, 6000, 3000, 'https://storage.supabase.co/remit-planner-files/workers/김대호/id_card.jpg', '고급 기술자'),
('worker_real_5', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', '이소영', '010-9999-0000', '930825-5678901', '1002-321-654987', 15000, 4000, 1000, 'https://storage.supabase.co/remit-planner-files/workers/이소영/id_card.jpg', '청소 전문가');

-- 2. 거래처 데이터
INSERT INTO clients (
    id, user_id, name, phone, email, address, business_number,
    contact_person, documents_folder_path, memo, total_revenue, unpaid_amount
) VALUES
('client_real_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'ABC 건설', '02-1111-2222', 'contact@abc-construction.com', '서울특별시 송파구 올림픽로 300', '123-45-67890', '김부장', 'clients/ABC_건설/', '대형 건설사, 안정적인 거래처', 50000000, 0),
('client_real_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'XYZ 아파트', '02-3333-4444', 'manager@xyz-apt.com', '경기도 성남시 분당구 정자동 123', '987-65-43210', '이과장', 'clients/XYZ_아파트/', '신축 아파트 단지', 30000000, 5000000),
('client_real_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'DEF 오피스텔', '02-5555-6666', 'admin@def-officetel.com', '서울특별시 강남구 역삼동 456', '456-78-90123', '박대리', 'clients/DEF_오피스텔/', '오피스텔 리모델링', 15000000, 0),
('client_real_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'GHI 호텔', '031-1111-2222', 'housekeeping@ghi-hotel.com', '경기도 수원시 영통구 월드컵로 200', '111-22-33333', '최팀장', 'clients/GHI_호텔/', '5성급 호텔', 25000000, 0),
('client_real_5', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'JKL 병원', '031-3333-4444', 'admin@jkl-hospital.com', '경기도 안양시 동안구 시민대로 100', '444-55-66666', '한과장', 'clients/JKL_병원/', '종합병원', 20000000, 2000000);

-- 3. 스케줄 데이터
INSERT INTO schedules (
    id, user_id, title, description, start_date, end_date, category,
    location, address, uniform_time, documents_folder_path,
    has_attachments, memo
) VALUES
('schedule_real_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'ABC 건설 현장 작업',
 '철근 배근 및 콘크리트 타설 작업', '2024-01-15', '2024-01-15', 'ABC 건설',
 'ABC 건설 현장', '서울특별시 송파구 올림픽로 300', true,
 'schedules/ABC_건설_현장_작업/', false, '날씨가 좋을 때 진행 예정'),
('schedule_real_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'XYZ 아파트 청소',
 '신축 아파트 단지 청소 작업', '2024-01-20', '2024-01-22', 'XYZ 아파트',
 'XYZ 아파트 단지', '경기도 성남시 분당구 정자동 123', false,
 'schedules/XYZ_아파트_청소/', true, '3일간 작업'),
('schedule_real_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'DEF 오피스텔 전기 공사',
 '오피스텔 전기 설비 설치 및 점검', '2024-01-30', '2024-02-02', 'DEF 오피스텔',
 'DEF 오피스텔', '서울특별시 강남구 역삼동 456', false,
 'schedules/DEF_오피스텔_전기_공사/', true, '전기 설계도 참고'),
('schedule_real_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'GHI 호텔 하우스키핑',
 '5성급 호텔 객실 및 공용구역 청소', '2024-02-05', '2024-02-05', 'GHI 호텔',
 'GHI 호텔', '경기도 수원시 영통구 월드컵로 200', true,
 'schedules/GHI_호텔_하우스키핑/', false, 'VIP 객실 주의'),
('schedule_real_5', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'JKL 병원 소독 작업',
 '종합병원 소독 및 방역 작업', '2024-02-10', '2024-02-12', 'JKL 병원',
 'JKL 병원', '경기도 안양시 동안구 시민대로 100', true,
 'schedules/JKL_병원_소독_작업/', false, '의료진 안전 수칙 준수');

-- 4. 스케줄 시간 데이터 (일별 시간 설정)
INSERT INTO schedule_times (
    id, user_id, schedule_id, work_date, start_time, end_time, break_duration
) VALUES
('schedule_time_real_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_real_3', '2024-01-30', '09:00:00', '18:00:00', 60),
('schedule_time_real_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_real_3', '2024-01-31', '08:00:00', '17:00:00', 60),
('schedule_time_real_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_real_3', '2024-02-01', '10:00:00', '19:00:00', 60),
('schedule_time_real_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_real_3', '2024-02-02', '07:00:00', '16:00:00', 60);

-- 5. 스케줄-근로자 관계 데이터
INSERT INTO schedule_workers (
    id, user_id, schedule_id, worker_id, work_start_date, work_end_date, uniform_time,
    hourly_wage, fuel_allowance, other_allowance, overtime_enabled, night_shift_enabled, tax_withheld, wage_paid, fuel_paid, other_paid
) VALUES
('schedule_worker_real_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_real_1', 'worker_real_1', '2024-01-15', '2024-01-15', true, 15000, 5000, 0, true, true, true, false, false, false),
('schedule_worker_real_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_real_1', 'worker_real_2', '2024-01-15', '2024-01-15', true, 16000, 5000, 2000, true, true, true, true, true, true),
('schedule_worker_real_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_real_2', 'worker_real_1', '2024-01-20', '2024-01-22', false, 15000, 3000, 0, true, false, true, false, false, false),
('schedule_worker_real_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_real_2', 'worker_real_3', '2024-01-20', '2024-01-22', false, 14000, 3000, 0, true, false, true, false, false, false),
('schedule_worker_real_5', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_real_3', 'worker_real_4', '2024-01-30', '2024-02-02', false, 18000, 6000, 3000, true, true, true, false, false, false),
('schedule_worker_real_6', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_real_4', 'worker_real_5', '2024-02-05', '2024-02-05', true, 15000, 4000, 1000, true, false, true, true, true, true),
('schedule_worker_real_7', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_real_5', 'worker_real_2', '2024-02-10', '2024-02-12', true, 16000, 5000, 2000, true, true, true, false, false, false),
('schedule_worker_real_8', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_real_5', 'worker_real_3', '2024-02-10', '2024-02-12', true, 14000, 3000, 0, true, true, true, false, false, false);

-- 6. 근로자별 시간 설정 데이터 (일별 다른 시간인 경우)
INSERT INTO worker_times (
    id, user_id, schedule_worker_id, work_date, start_time, end_time, break_duration
) VALUES
-- 박민수 (worker_real_1)의 시간 설정
('worker_time_real_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_3', '2024-01-20', '09:00:00', '18:00:00', 60),
('worker_time_real_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_3', '2024-01-21', '08:00:00', '17:00:00', 60),
('worker_time_real_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_3', '2024-01-22', '10:00:00', '19:00:00', 60),

-- 정수진 (worker_real_3)의 시간 설정 (다른 시간)
('worker_time_real_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_4', '2024-01-20', '10:00:00', '19:00:00', 60),
('worker_time_real_5', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_4', '2024-01-21', '09:00:00', '18:00:00', 60),
('worker_time_real_6', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_4', '2024-01-22', '11:00:00', '20:00:00', 60);

-- 7. 작업 기간 데이터
INSERT INTO work_periods (
    id, user_id, schedule_worker_id, work_date, start_time, end_time, break_duration,
    overtime_hours, daily_wage, memo
) VALUES
('work_period_real_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_1', '2024-01-15', '09:00:00', '18:00:00', 60, 0, 120000, '철근 배근 작업'),
('work_period_real_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_2', '2024-01-15', '09:00:00', '18:00:00', 60, 0, 128000, '콘크리트 타설 작업'),
('work_period_real_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_3', '2024-01-20', '09:00:00', '18:00:00', 60, 0, 120000, '청소 작업 1일차'),
('work_period_real_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_3', '2024-01-21', '08:00:00', '17:00:00', 60, 0, 120000, '청소 작업 2일차'),
('work_period_real_5', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_3', '2024-01-22', '10:00:00', '19:00:00', 60, 0, 120000, '청소 작업 3일차'),
('work_period_real_6', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_4', '2024-01-20', '10:00:00', '19:00:00', 60, 0, 112000, '청소 작업 1일차'),
('work_period_real_7', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_4', '2024-01-21', '09:00:00', '18:00:00', 60, 0, 112000, '청소 작업 2일차'),
('work_period_real_8', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_4', '2024-01-22', '11:00:00', '20:00:00', 60, 0, 112000, '청소 작업 3일차'),
('work_period_real_9', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_5', '2024-01-30', '09:00:00', '18:00:00', 60, 0, 144000, '전기 설비 설치'),
('work_period_real_10', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_5', '2024-01-31', '08:00:00', '17:00:00', 60, 0, 144000, '전기 설비 점검'),
('work_period_real_11', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_5', '2024-02-01', '10:00:00', '19:00:00', 60, 0, 144000, '전기 설비 테스트'),
('work_period_real_12', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_5', '2024-02-02', '07:00:00', '16:00:00', 60, 0, 144000, '전기 설비 완료'),
('work_period_real_13', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_6', '2024-02-05', '09:00:00', '18:00:00', 60, 0, 120000, '호텔 하우스키핑'),
('work_period_real_14', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_7', '2024-02-10', '09:00:00', '18:00:00', 60, 0, 128000, '병원 소독 작업 1일차'),
('work_period_real_15', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_7', '2024-02-11', '09:00:00', '18:00:00', 60, 0, 128000, '병원 소독 작업 2일차'),
('work_period_real_16', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_7', '2024-02-12', '09:00:00', '18:00:00', 60, 0, 128000, '병원 소독 작업 3일차'),
('work_period_real_17', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_8', '2024-02-10', '09:00:00', '18:00:00', 60, 0, 112000, '병원 소독 작업 1일차'),
('work_period_real_18', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_8', '2024-02-11', '09:00:00', '18:00:00', 60, 0, 112000, '병원 소독 작업 2일차'),
('work_period_real_19', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_8', '2024-02-12', '09:00:00', '18:00:00', 60, 0, 112000, '병원 소독 작업 3일차');

-- 8. 급여 계산 데이터
INSERT INTO payroll_calculations (
    id, user_id, schedule_worker_id, total_hours, regular_hours, overtime_hours, night_hours,
    regular_pay, overtime_pay, night_shift_pay, fuel_allowance, other_allowance,
    total_gross_pay, tax_amount, net_pay
) VALUES
('payroll_real_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_1', 8.0, 8.0, 0, 0, 120000, 0, 0, 5000, 0, 125000, 4125, 120875),
('payroll_real_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_2', 8.0, 8.0, 0, 0, 128000, 0, 0, 5000, 2000, 135000, 4455, 130545),
('payroll_real_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_3', 24.0, 24.0, 0, 0, 360000, 0, 0, 9000, 0, 369000, 12177, 356823),
('payroll_real_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_4', 24.0, 24.0, 0, 0, 336000, 0, 0, 9000, 0, 345000, 11385, 333615),
('payroll_real_5', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_5', 32.0, 32.0, 0, 0, 576000, 0, 0, 19200, 9600, 604800, 19958, 584842),
('payroll_real_6', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_6', 8.0, 8.0, 0, 0, 120000, 0, 0, 4000, 1000, 125000, 4125, 120875),
('payroll_real_7', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_7', 24.0, 24.0, 0, 0, 384000, 0, 0, 15000, 6000, 405000, 13365, 391635),
('payroll_real_8', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule_worker_real_8', 24.0, 24.0, 0, 0, 336000, 0, 0, 9000, 0, 345000, 11385, 333615);

-- 9. 거래처 담당자 데이터
INSERT INTO client_contacts (
    id, user_id, client_id, name, position, phone, memo, is_primary
) VALUES
('contact_real_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'client_real_1', '김부장', '현장소장', '010-1111-1111', '현장 총괄', 1),
('contact_real_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'client_real_1', '이과장', '안전관리자', '010-2222-2222', '안전 관련 업무', 0),
('contact_real_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'client_real_2', '이과장', '관리과장', '010-3333-3333', '아파트 관리', 1),
('contact_real_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'client_real_2', '박대리', '시설담당', '010-4444-4444', '시설 점검', 0),
('contact_real_5', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'client_real_4', '최팀장', '하우스키핑팀장', '010-5555-5555', '청소 업무 총괄', 1),
('contact_real_6', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'client_real_4', '한대리', '객실담당', '010-6666-6666', '객실 청소', 0);

-- 10. 활동 로그 데이터
INSERT INTO activities (
    id, user_id, type, title, description, related_id, icon, color
) VALUES
('activity_real_1', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule', '새 스케줄 생성', 'ABC 건설 현장 작업 스케줄이 생성되었습니다.', 'schedule_real_1', 'calendar', 'blue'),
('activity_real_2', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'worker', '근로자 등록', '박민수 근로자가 등록되었습니다.', 'worker_real_1', 'person-add', 'green'),
('activity_real_3', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'payment', '급여 지급', '최영희님의 급여가 지급되었습니다.', 'schedule_worker_real_2', 'card', 'purple'),
('activity_real_4', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'schedule', '스케줄 완료', 'XYZ 아파트 청소 작업이 완료되었습니다.', 'schedule_real_2', 'checkmark-circle', 'orange'),
('activity_real_5', 'a2d5ac96-ddc8-4745-be2d-c9b182924081', 'client', '거래처 추가', '새로운 거래처 DEF 오피스텔이 추가되었습니다.', 'client_real_3', 'business', 'teal');
