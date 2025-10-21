-- 기존 데이터를 admin 사용자에게 할당
-- 주의: 이 스크립트는 기존 데이터를 admin 사용자에게 할당합니다

-- Admin 사용자 ID 확인 및 할당
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

-- 할당되지 않은 데이터 삭제 (보안상 중요)
DELETE FROM workers WHERE user_id IS NULL;
DELETE FROM schedules WHERE user_id IS NULL;
DELETE FROM schedule_workers WHERE user_id IS NULL;
DELETE FROM work_periods WHERE user_id IS NULL;
DELETE FROM activities WHERE user_id IS NULL;
DELETE FROM clients WHERE user_id IS NULL;
DELETE FROM client_contacts WHERE user_id IS NULL;
DELETE FROM categories WHERE user_id IS NULL;
