-- 알림 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('wage_overdue', 'revenue_overdue', 'schedule_reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 2 CHECK (priority IN (1, 2, 3)), -- 1: 높음, 2: 보통, 3: 낮음
  related_id TEXT, -- 관련 스케줄/근로자 ID
  scheduled_at TEXT, -- 예약된 알림 시간 (스케줄 리마인더용)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 사용자별 알림 설정 테이블
CREATE TABLE IF NOT EXISTS notification_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  wage_overdue_enabled BOOLEAN DEFAULT true,
  revenue_overdue_enabled BOOLEAN DEFAULT true,
  schedule_reminder_enabled BOOLEAN DEFAULT false,
  schedule_reminder_unit TEXT DEFAULT 'days' CHECK (schedule_reminder_unit IN ('hours', 'days')),
  schedule_reminder_value INTEGER DEFAULT 1, -- 1일 전, 2일 전 등
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- RLS 정책 설정
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- 사용자별 데이터 접근 정책
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view own notification settings" ON notification_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notification settings" ON notification_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notification settings" ON notification_settings
  FOR UPDATE USING (user_id = auth.uid());
