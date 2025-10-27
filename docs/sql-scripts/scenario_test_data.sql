-- =====================================================
-- 시나리오별 테스트 데이터
-- =====================================================

-- =====================================================
-- 시나리오 1: 야간 근무가 포함된 스케줄
-- =====================================================

-- 야간 근무 스케줄 (22:00-06:00)
INSERT INTO schedules (id, user_id, title, start_date, end_date, category, location, memo) 
VALUES ('night_schedule', 'test_user_1', '야간 공사 작업', '2024-01-25', '2024-01-25', 'construction', '야간 현장', '야간 근무 포함');

INSERT INTO schedule_workers (id, user_id, schedule_id, worker_id, work_start_date, work_end_date, hourly_wage, night_shift_enabled) 
VALUES ('night_sw', 'test_user_1', 'night_schedule', 'worker_1', '2024-01-25', '2024-01-25', 15000, true);

INSERT INTO work_periods (id, schedule_worker_id, start_time, end_time, overtime_hours, daily_wage) 
VALUES ('night_wp', 'night_sw', '22:00', '06:00', 8, 200000); -- 야간 8시간

INSERT INTO payroll_calculations (id, schedule_worker_id, base_pay, night_shift_pay, total_pay, net_pay) 
VALUES ('night_payroll', 'night_sw', 120000, 80000, 200000, 193400); -- 야간수당 50% 추가

-- =====================================================
-- 시나리오 2: 연장 근무가 포함된 스케줄
-- =====================================================

-- 연장 근무 스케줄 (9시간 근무)
INSERT INTO schedules (id, user_id, title, start_date, end_date, category, location, memo) 
VALUES ('overtime_schedule', 'test_user_1', '긴급 작업', '2024-01-26', '2024-01-26', 'construction', '긴급 현장', '연장 근무 필요');

INSERT INTO schedule_workers (id, user_id, schedule_id, worker_id, work_start_date, work_end_date, hourly_wage, overtime_enabled) 
VALUES ('overtime_sw', 'test_user_1', 'overtime_schedule', 'worker_2', '2024-01-26', '2024-01-26', 16000, true);

INSERT INTO work_periods (id, schedule_worker_id, start_time, end_time, overtime_hours, daily_wage) 
VALUES ('overtime_wp', 'overtime_sw', '09:00', '19:00', 1, 160000); -- 1시간 연장

INSERT INTO payroll_calculations (id, schedule_worker_id, base_pay, overtime_pay, total_pay, net_pay) 
VALUES ('overtime_payroll', 'overtime_sw', 144000, 16000, 160000, 154720); -- 연장수당 1.5배

-- =====================================================
-- 시나리오 3: 유류비와 기타수당이 있는 스케줄
-- =====================================================

-- 유류비/기타수당 스케줄
INSERT INTO schedules (id, user_id, title, start_date, end_date, category, location, memo) 
VALUES ('allowance_schedule', 'test_user_1', '원거리 작업', '2024-01-27', '2024-01-27', 'construction', '원거리 현장', '유류비 지급');

INSERT INTO schedule_workers (id, user_id, schedule_id, worker_id, work_start_date, work_end_date, hourly_wage, fuel_allowance, other_allowance) 
VALUES ('allowance_sw', 'test_user_1', 'allowance_schedule', 'worker_1', '2024-01-27', '2024-01-27', 15000, 10000, 5000);

INSERT INTO work_periods (id, schedule_worker_id, start_time, end_time, daily_wage) 
VALUES ('allowance_wp', 'allowance_sw', '09:00', '18:00', 120000);

INSERT INTO payroll_calculations (id, schedule_worker_id, base_pay, fuel_allowance, other_allowance, total_pay, net_pay) 
VALUES ('allowance_payroll', 'allowance_sw', 120000, 10000, 5000, 135000, 130545); -- 유류비/기타수당은 3.3% 공제 제외

-- =====================================================
-- 시나리오 4: 일별 다른 시간 설정 (다중일)
-- =====================================================

-- 일별 다른 시간 스케줄
INSERT INTO schedules (id, user_id, title, start_date, end_date, category, location, uniform_time, schedule_times) 
VALUES ('varying_schedule', 'test_user_1', '유연한 작업', '2024-01-28', '2024-01-30', 'renovation', '유연 현장', false, 
'[{"workDate":"2024-01-28","startTime":"08:00","endTime":"17:00","breakDuration":60},{"workDate":"2024-01-29","startTime":"10:00","endTime":"19:00","breakDuration":60},{"workDate":"2024-01-30","startTime":"07:00","endTime":"16:00","breakDuration":60}]');

INSERT INTO schedule_workers (id, user_id, schedule_id, worker_id, work_start_date, work_end_date, uniform_time, hourly_wage) 
VALUES ('varying_sw', 'test_user_1', 'varying_schedule', 'worker_2', '2024-01-28', '2024-01-30', false, 16000);

-- 일별 시간 설정
INSERT INTO schedule_times (id, schedule_id, work_date, start_time, end_time, break_duration) 
VALUES 
('varying_st_1', 'varying_schedule', '2024-01-28', '08:00', '17:00', 60),
('varying_st_2', 'varying_schedule', '2024-01-29', '10:00', '19:00', 60),
('varying_st_3', 'varying_schedule', '2024-01-30', '07:00', '16:00', 60);

-- 근로자별 시간 설정
INSERT INTO worker_times (id, schedule_worker_id, work_date, start_time, end_time, break_duration) 
VALUES 
('varying_wt_1', 'varying_sw', '2024-01-28', '08:00', '17:00', 60),
('varying_wt_2', 'varying_sw', '2024-01-29', '10:00', '19:00', 60),
('varying_wt_3', 'varying_sw', '2024-01-30', '07:00', '16:00', 60);

-- =====================================================
-- 시나리오 5: 첨부파일이 있는 스케줄
-- =====================================================

-- 첨부파일 스케줄
INSERT INTO schedules (id, user_id, title, start_date, end_date, category, location, has_attachments, documents_folder_path) 
VALUES ('attachment_schedule', 'test_user_1', '문서 작업', '2024-01-31', '2024-01-31', 'construction', '문서 현장', true, 'schedules/문서_작업/');

-- 첨부파일 문서들
INSERT INTO schedule_documents (id, schedule_id, file_name, file_url, file_path, file_type, file_size) 
VALUES 
('doc_1', 'attachment_schedule', '설계도.pdf', 'https://storage.supabase.co/remit-planner-files/schedules/문서_작업/설계도.pdf', 'schedules/문서_작업/설계도.pdf', 'application/pdf', 2048576),
('doc_2', 'attachment_schedule', '안전수칙.pdf', 'https://storage.supabase.co/remit-planner-files/schedules/문서_작업/안전수칙.pdf', 'schedules/문서_작업/안전수칙.pdf', 'application/pdf', 512000),
('doc_3', 'attachment_schedule', '현장사진.jpg', 'https://storage.supabase.co/remit-planner-files/schedules/문서_작업/현장사진.jpg', 'schedules/문서_작업/현장사진.jpg', 'image/jpeg', 1024000);

-- =====================================================
-- 시나리오 6: 이미 지급된 급여
-- =====================================================

-- 지급 완료 스케줄
INSERT INTO schedules (id, user_id, title, start_date, end_date, category, location, memo) 
VALUES ('paid_schedule', 'test_user_1', '완료된 작업', '2024-01-10', '2024-01-10', 'construction', '완료 현장', '급여 지급 완료');

INSERT INTO schedule_workers (id, user_id, schedule_id, worker_id, work_start_date, work_end_date, hourly_wage, paid) 
VALUES ('paid_sw', 'test_user_1', 'paid_schedule', 'worker_1', '2024-01-10', '2024-01-10', 15000, true);

INSERT INTO work_periods (id, schedule_worker_id, start_time, end_time, daily_wage) 
VALUES ('paid_wp', 'paid_sw', '09:00', '18:00', 120000);

INSERT INTO payroll_calculations (id, schedule_worker_id, base_pay, total_pay, net_pay) 
VALUES ('paid_payroll', 'paid_sw', 120000, 120000, 116040);

-- =====================================================
-- 시나리오 7: 복잡한 급여 구조 (모든 수당 포함)
-- =====================================================

-- 복합 수당 스케줄
INSERT INTO schedules (id, user_id, title, start_date, end_date, category, location, memo) 
VALUES ('complex_schedule', 'test_user_1', '복합 수당 작업', '2024-02-01', '2024-02-01', 'construction', '복합 현장', '모든 수당 포함');

INSERT INTO schedule_workers (id, user_id, schedule_id, worker_id, work_start_date, work_end_date, hourly_wage, fuel_allowance, other_allowance, overtime_enabled, night_shift_enabled) 
VALUES ('complex_sw', 'test_user_1', 'complex_schedule', 'worker_2', '2024-02-01', '2024-02-01', 16000, 8000, 3000, true, true);

INSERT INTO work_periods (id, schedule_worker_id, start_time, end_time, overtime_hours, daily_wage) 
VALUES ('complex_wp', 'complex_sw', '20:00', '06:00', 2, 200000); -- 야간 8시간 + 연장 2시간

INSERT INTO payroll_calculations (id, schedule_worker_id, base_pay, overtime_pay, night_shift_pay, fuel_allowance, other_allowance, total_pay, net_pay) 
VALUES ('complex_payroll', 'complex_sw', 128000, 32000, 64000, 8000, 3000, 235000, 227275); -- 복합 계산
