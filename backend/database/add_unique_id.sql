-- Migration: Add unique_id column to users table
-- Run this once on your database

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS unique_id VARCHAR(20) NULL UNIQUE AFTER id;

-- Assign unique_id to all existing KYC-approved users (if any)
UPDATE users
SET unique_id = CONCAT('STK-', LPAD(id, 6, '0'))
WHERE kyc_status = 'approved' AND unique_id IS NULL;

-- Index for fast lookup by unique_id
CREATE INDEX IF NOT EXISTS idx_users_unique_id ON users(unique_id);
