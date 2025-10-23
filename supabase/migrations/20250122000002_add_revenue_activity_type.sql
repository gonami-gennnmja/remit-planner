-- Add revenue activity type support
-- This migration adds support for revenue-related activities

-- Update the activities table to support 'revenue' type
-- Note: If you have a CHECK constraint on the type column, you may need to drop and recreate it

-- First, let's check if there are any constraints on the type column
-- If there's a CHECK constraint, we'll need to drop it first
DO $$ 
BEGIN
    -- Drop existing check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%type%' 
        AND table_name = 'activities'
    ) THEN
        ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;
    END IF;
END $$;

-- Add the new check constraint that includes 'revenue'
ALTER TABLE activities ADD CONSTRAINT activities_type_check 
CHECK (type IN ('schedule', 'worker', 'payment', 'revenue'));

-- Add comment to document the change
COMMENT ON COLUMN activities.type IS 'Activity type: schedule, worker, payment, or revenue';
