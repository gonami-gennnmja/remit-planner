-- Fix RLS policies for client_contacts table
-- This migration ensures proper user isolation for client contacts
-- without dropping existing data

-- Add user_id column if it doesn't exist
ALTER TABLE client_contacts 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing records to have user_id (if not already set)
-- This assumes we can get user_id from the related client
UPDATE client_contacts 
SET user_id = (
  SELECT user_id 
  FROM clients 
  WHERE clients.id = client_contacts.client_id
)
WHERE user_id IS NULL;

-- Make user_id NOT NULL after updating existing records
ALTER TABLE client_contacts 
ALTER COLUMN user_id SET NOT NULL;

-- Enable RLS on client_contacts table if not already enabled
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only access their own client contacts" ON client_contacts;
DROP POLICY IF EXISTS "Users can insert their own client contacts" ON client_contacts;
DROP POLICY IF EXISTS "Users can update their own client contacts" ON client_contacts;
DROP POLICY IF EXISTS "Users can delete their own client contacts" ON client_contacts;

-- Create RLS policies for client_contacts
CREATE POLICY "Users can only access their own client contacts" ON client_contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own client contacts" ON client_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own client contacts" ON client_contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own client contacts" ON client_contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_contacts_user_id ON client_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);

-- Add foreign key constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_client_contacts_client_id'
  ) THEN
    ALTER TABLE client_contacts 
    ADD CONSTRAINT fk_client_contacts_client_id 
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
  END IF;
END $$;
