-- 스케줄 테이블에 수급 관련 컬럼 추가
ALTER TABLE schedules 
ADD COLUMN all_wages_paid BOOLEAN DEFAULT false,
ADD COLUMN revenue_status TEXT DEFAULT 'pending' CHECK (revenue_status IN ('received', 'pending', 'overdue')),
ADD COLUMN revenue_due_date TEXT;

-- 기존 데이터에 대해 revenue_due_date 업데이트 (end_date + 14일)
UPDATE schedules 
SET revenue_due_date = (end_date::date + interval '14 days')::text
WHERE revenue_due_date IS NULL;

-- 기존 데이터에 대해 revenue_status 업데이트
-- 현재 날짜가 revenue_due_date를 지났으면 'overdue', 아니면 'pending'
UPDATE schedules 
SET revenue_status = CASE 
  WHEN CURRENT_DATE > revenue_due_date::date THEN 'overdue'
  ELSE 'pending'
END
WHERE revenue_status = 'pending';

-- all_wages_paid 상태를 업데이트하는 함수 (트리거용)
-- 이 함수는 schedule_workers 테이블이 업데이트될 때마다 호출되어야 함
CREATE OR REPLACE FUNCTION update_schedule_wage_status()
RETURNS TRIGGER AS $$
BEGIN
  -- 해당 스케줄의 모든 근로자가 임금을 받았는지 확인
  UPDATE schedules 
  SET all_wages_paid = (
    SELECT COUNT(*) = 0 OR (
      SELECT COUNT(*) = COUNT(CASE WHEN wage_paid = true AND fuel_paid = true AND other_paid = true THEN 1 END)
      FROM schedule_workers 
      WHERE schedule_id = COALESCE(NEW.schedule_id, OLD.schedule_id)
    )
  )
  WHERE id = COALESCE(NEW.schedule_id, OLD.schedule_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- schedule_workers 테이블 변경 시 all_wages_paid 업데이트하는 트리거
DROP TRIGGER IF EXISTS trigger_update_wage_status ON schedule_workers;
CREATE TRIGGER trigger_update_wage_status
  AFTER INSERT OR UPDATE OR DELETE ON schedule_workers
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_wage_status();

-- 기존 데이터에 대해 all_wages_paid 상태 초기화
UPDATE schedules 
SET all_wages_paid = (
  SELECT COUNT(*) = 0 OR (
    SELECT COUNT(*) = COUNT(CASE WHEN wage_paid = true AND fuel_paid = true AND other_paid = true THEN 1 END)
    FROM schedule_workers 
    WHERE schedule_id = schedules.id
  )
);

-- revenue_status를 자동으로 업데이트하는 함수 (매일 실행될 수 있음)
CREATE OR REPLACE FUNCTION update_revenue_status()
RETURNS void AS $$
BEGIN
  -- 연체 상태 업데이트
  UPDATE schedules 
  SET revenue_status = 'overdue'
  WHERE revenue_status = 'pending' 
    AND CURRENT_DATE > revenue_due_date::date;
END;
$$ LANGUAGE plpgsql;
