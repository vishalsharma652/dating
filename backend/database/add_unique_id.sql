-- Migration: Add missing unique_id and wallet_id columns for MySQL 8.0
DROP PROCEDURE IF EXISTS MigrateColumns;

DELIMITER $$

CREATE PROCEDURE MigrateColumns()
BEGIN
  IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'unique_id'
  ) THEN
    ALTER TABLE users ADD COLUMN unique_id VARCHAR(20) NULL UNIQUE AFTER id;
  END IF;

  UPDATE users SET unique_id = CONCAT('STK-', LPAD(id, 6, '0')) WHERE unique_id IS NULL;

  IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wallets' AND COLUMN_NAME = 'wallet_id'
  ) THEN
    ALTER TABLE wallets ADD COLUMN wallet_id VARCHAR(30) NULL UNIQUE AFTER user_id;
  END IF;

  IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'kyc_document_url'
  ) THEN
    ALTER TABLE users ADD COLUMN kyc_document_url TEXT NULL AFTER kyc_status;
  END IF;

  UPDATE wallets SET wallet_id = CONCAT('WLT-', LPAD(id, 6, '0')) WHERE wallet_id IS NULL;

END $$

DELIMITER ;

CALL MigrateColumns();
DROP PROCEDURE IF EXISTS MigrateColumns;
