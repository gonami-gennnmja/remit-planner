-- Remit Planner Database Schema for Supabase
-- Run this in your Supabase SQL Editor to create all tables

-- Clients table (거래처)
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  business_number TEXT,
  memo TEXT,
  total_revenue INTEGER DEFAULT 0,
  unpaid_amount INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Client contacts table (거래처 담당자)
CREATE TABLE IF NOT EXISTS client_contacts (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT,
  phone TEXT NOT NULL,
  memo TEXT,
  is_primary INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
-- For now, allow all operations (you can modify this later)
CREATE POLICY "Enable all operations for clients" ON clients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for client_contacts" ON client_contacts
  FOR ALL USING (true) WITH CHECK (true);

