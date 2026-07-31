-- Migration: Add missing unique_id and wallet_id columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS unique_id VARCHAR(20) NULL UNIQUE AFTER id;
UPDATE users SET unique_id = CONCAT('STK-', LPAD(id, 6, '0')) WHERE unique_id IS NULL;

ALTER TABLE wallets ADD COLUMN IF NOT EXISTS wallet_id VARCHAR(30) NULL UNIQUE AFTER user_id;
UPDATE wallets SET wallet_id = CONCAT('WLT-', LPAD(id, 6, '0')) WHERE wallet_id IS NULL;
