-- notifications 테이블의 id 컬럼에 UUID 기본값 추가
ALTER TABLE notifications 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- notification_settings 테이블의 id 컬럼에도 UUID 기본값 추가
ALTER TABLE notification_settings 
ALTER COLUMN id SET DEFAULT gen_random_uuid();
