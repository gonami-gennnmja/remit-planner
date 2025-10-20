-- Fix triggers - only create if they don't exist
-- This migration safely creates triggers without conflicts

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_workers_updated_at ON workers;
DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
DROP TRIGGER IF EXISTS update_schedule_workers_updated_at ON schedule_workers;
DROP TRIGGER IF EXISTS update_work_periods_updated_at ON work_periods;

-- Recreate triggers
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_workers_updated_at BEFORE UPDATE ON schedule_workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_periods_updated_at BEFORE UPDATE ON work_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
