CREATE DATABASE IF NOT EXISTS ember_dating CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ember_dating;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NULL UNIQUE,
  phone VARCHAR(30) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  status ENUM('active','inactive','blocked','deleted') NOT NULL DEFAULT 'active',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  dob DATE NULL,
  age_verified BOOLEAN NOT NULL DEFAULT FALSE,
  kyc_status ENUM('not_submitted','pending','approved','rejected') NOT NULL DEFAULT 'not_submitted',
  coins INT NOT NULL DEFAULT 0,
  earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
  gender VARCHAR(40) NULL,
  online_status BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  age INT NULL,
  gender VARCHAR(40) NULL,
  interested_in VARCHAR(40) NULL,
  city VARCHAR(120) NULL,
  occupation VARCHAR(160) NULL,
  education VARCHAR(120) NULL,
  bio VARCHAR(220) NULL,
  languages JSON NULL,
  interests JSON NULL,
  lifestyle JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile_photos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id BIGINT UNSIGNED NOT NULL,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_profile_photos_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS likes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  target_user_id BIGINT UNSIGNED NOT NULL,
  action ENUM('like','pass','super_like') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_like (user_id, target_user_id),
  CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_target FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_one_id BIGINT UNSIGNED NOT NULL,
  user_two_id BIGINT UNSIGNED NOT NULL,
  status ENUM('matched','unmatched') NOT NULL DEFAULT 'matched',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_match (user_one_id, user_two_id),
  CONSTRAINT fk_matches_one FOREIGN KEY (user_one_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_matches_two FOREIGN KEY (user_two_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chats (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_one_id BIGINT UNSIGNED NOT NULL,
  user_two_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_chat (user_one_id, user_two_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chat_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'text',
  delivery_status ENUM('sent','delivered','read') NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  type VARCHAR(40) NOT NULL,
  title VARCHAR(160) NOT NULL,
  message VARCHAR(255) NOT NULL,
  link_url VARCHAR(255) NULL,
  metadata JSON NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user_created (user_id, created_at),
  INDEX idx_notifications_user_read (user_id, read_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chat_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  requester_id BIGINT UNSIGNED NOT NULL,
  receiver_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','accepted','rejected','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_chat_request (requester_id, receiver_id),
  CONSTRAINT fk_chat_requests_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_requests_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chat_id BIGINT UNSIGNED NOT NULL,
  payer_user_id BIGINT UNSIGNED NOT NULL,
  earner_user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('active','ended') NOT NULL DEFAULT 'active',
  charge_per_minute INT NOT NULL DEFAULT 10,
  earner_share INT NOT NULL DEFAULT 7,
  platform_share INT NOT NULL DEFAULT 3,
  charged_minutes INT NOT NULL DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  CONSTRAINT fk_chat_sessions_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_sessions_payer FOREIGN KEY (payer_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_sessions_earner FOREIGN KEY (earner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coin_packages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  coins INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  bonus INT NOT NULL DEFAULT 0,
  popular BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  type ENUM('purchase','earning','withdrawal','chat_charge','commission') NOT NULL,
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

CREATE TABLE IF NOT EXISTS bank_accounts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  account_holder_name VARCHAR(160) NOT NULL,
  bank_name VARCHAR(120) NULL,
  account_number VARCHAR(80) NULL,
  ifsc_code VARCHAR(20) NULL,
  upi_id VARCHAR(120) NULL,
  status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bank_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method ENUM('upi','bank_transfer') NOT NULL,
  bank_name VARCHAR(120) NULL,
  account_number VARCHAR(80) NULL,
  status ENUM('pending','completed','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  CONSTRAINT fk_withdrawals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  description TEXT NULL,
  image_url TEXT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NULL,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  coins INT NOT NULL DEFAULT 0,
  image_url TEXT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  status ENUM('pending','paid','cancelled','refunded') NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(120) NOT NULL UNIQUE,
  setting_value TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO coin_packages (name, coins, price, bonus, popular) VALUES
('Starter', 100, 100, 0, FALSE),
('Value', 500, 450, 0, TRUE),
('Premium', 1000, 800, 0, FALSE)
ON DUPLICATE KEY UPDATE coins = VALUES(coins), price = VALUES(price), bonus = VALUES(bonus), popular = VALUES(popular), active = TRUE;

INSERT INTO settings (setting_key, setting_value) VALUES
('site_name', 'Saathika'),
('site_logo', '/uploads/saathika-logo.jpg'),
('coin_rate_inr', '0.70'),
('chat_charge_per_minute', '10'),
('female_earning_per_minute', '7'),
('platform_commission_per_minute', '3')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO categories (name, slug, description) VALUES
('Coin Packages', 'coin-packages', 'In-app coin bundles and premium purchases')
ON DUPLICATE KEY UPDATE name = VALUES(name);
