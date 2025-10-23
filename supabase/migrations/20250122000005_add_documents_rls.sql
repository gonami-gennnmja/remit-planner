-- Add RLS policies for client_documents and schedule_documents tables
-- This migration ensures proper user isolation for document management

-- Enable RLS on client_documents table if not already enabled
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

-- Add user_id column to client_documents if it doesn't exist
ALTER TABLE client_documents 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing records to have user_id (if not already set)
-- This assumes we can get user_id from the related client
UPDATE client_documents 
SET user_id = (
  SELECT user_id 
  FROM clients 
  WHERE clients.id = client_documents.client_id
)
WHERE user_id IS NULL;

-- Make user_id NOT NULL after updating existing records
ALTER TABLE client_documents 
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own client documents" ON client_documents;
DROP POLICY IF EXISTS "Users can insert their own client documents" ON client_documents;
DROP POLICY IF EXISTS "Users can update their own client documents" ON client_documents;
DROP POLICY IF EXISTS "Users can delete their own client documents" ON client_documents;

-- Create RLS policies for client_documents
CREATE POLICY "Users can view their own client documents" ON client_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own client documents" ON client_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own client documents" ON client_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own client documents" ON client_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on schedule_documents table if not already enabled
ALTER TABLE schedule_documents ENABLE ROW LEVEL SECURITY;

-- Add user_id column to schedule_documents if it doesn't exist
ALTER TABLE schedule_documents 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing records to have user_id (if not already set)
-- This assumes we can get user_id from the related schedule
UPDATE schedule_documents 
SET user_id = (
  SELECT user_id 
  FROM schedules 
  WHERE schedules.id = schedule_documents.schedule_id
)
WHERE user_id IS NULL;

-- Make user_id NOT NULL after updating existing records
ALTER TABLE schedule_documents 
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own schedule documents" ON schedule_documents;
DROP POLICY IF EXISTS "Users can insert their own schedule documents" ON schedule_documents;
DROP POLICY IF EXISTS "Users can update their own schedule documents" ON schedule_documents;
DROP POLICY IF EXISTS "Users can delete their own schedule documents" ON schedule_documents;

-- Create RLS policies for schedule_documents
CREATE POLICY "Users can view their own schedule documents" ON schedule_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedule documents" ON schedule_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule documents" ON schedule_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule documents" ON schedule_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_documents_user_id ON client_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_documents_user_id ON schedule_documents(user_id);
