-- Add client_id column to schedules table
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS client_id TEXT;

-- Add foreign key constraint
ALTER TABLE schedules 
ADD CONSTRAINT fk_schedules_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_schedules_client_id ON schedules(client_id);
