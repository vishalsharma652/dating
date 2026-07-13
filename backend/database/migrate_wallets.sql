USE ember_dating;

-- Migration: Add wallet-related tables
-- Run this if wallets / wallet_transactions / platform_commission_ledger are missing.

CREATE TABLE IF NOT EXISTS wallets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  balance INT NOT NULL DEFAULT 0,
  total_purchased INT NOT NULL DEFAULT 0,
  total_spent INT NOT NULL DEFAULT 0,
  total_earned INT NOT NULL DEFAULT 0,
  withdrawal_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  type ENUM('welcome_bonus','purchase','earning','withdrawal','chat_charge','commission') NOT NULL,
  title VARCHAR(160) NOT NULL,
  description VARCHAR(255) NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  coins INT NOT NULL DEFAULT 0,
  status ENUM('pending','completed','failed') NOT NULL DEFAULT 'completed',
  payment_gateway ENUM('razorpay','cashfree','phonepe') NULL,
  payment_reference VARCHAR(190) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform_commission_ledger (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chat_session_id BIGINT UNSIGNED NULL,
  amount INT NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_platform_commission_created (created_at),
  CONSTRAINT fk_platform_commission_session FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id) ON DELETE SET NULL
);
