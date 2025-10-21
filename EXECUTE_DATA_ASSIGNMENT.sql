-- 기존 데이터를 admin 사용자에게 할당하는 SQL
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. Admin 사용자 ID 확인
SELECT id, email FROM auth.users WHERE email = 'admin@remit-planner.com';

-- 2. 기존 데이터를 admin 사용자에게 할당
UPDATE workers 
SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@remit-planner.com' LIMIT 1)
WHERE user_id IS NULL;

UPDATE schedules 
SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@remit-planner.com' LIMIT 1)
WHERE user_id IS NULL;

UPDATE schedule_workers 
SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@remit-planner.com' LIMIT 1)
WHERE user_id IS NULL;

UPDATE work_periods 
SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@remit-planner.com' LIMIT 1)
WHERE user_id IS NULL;

UPDATE activities 
SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@remit-planner.com' LIMIT 1)
WHERE user_id IS NULL;

UPDATE clients 
SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@remit-planner.com' LIMIT 1)
WHERE user_id IS NULL;

UPDATE client_contacts 
SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@remit-planner.com' LIMIT 1)
WHERE user_id IS NULL;

-- Categories 테이블이 존재한다면
UPDATE categories 
SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@remit-planner.com' LIMIT 1)
WHERE user_id IS NULL;

-- 3. 할당 결과 확인
SELECT 'workers' as table_name, COUNT(*) as total_count, COUNT(user_id) as assigned_count
FROM workers
UNION ALL
SELECT 'schedules', COUNT(*), COUNT(user_id)
FROM schedules
UNION ALL
SELECT 'clients', COUNT(*), COUNT(user_id)
FROM clients
UNION ALL
SELECT 'activities', COUNT(*), COUNT(user_id)
FROM activities;

-- 4. 할당되지 않은 데이터 삭제 (보안상 중요)
DELETE FROM workers WHERE user_id IS NULL;
DELETE FROM schedules WHERE user_id IS NULL;
DELETE FROM schedule_workers WHERE user_id IS NULL;
DELETE FROM work_periods WHERE user_id IS NULL;
DELETE FROM activities WHERE user_id IS NULL;
DELETE FROM clients WHERE user_id IS NULL;
DELETE FROM client_contacts WHERE user_id IS NULL;
DELETE FROM categories WHERE user_id IS NULL;
