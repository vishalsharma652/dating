const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const app = require('./app');
const env = require('./config/env');
const { pool } = require('./config/db');
const { startChatBillingScheduler } = require('./services/chatBillingScheduler');
const { setupCallSignaling } = require('./services/callSignaling');

async function start() {
  await pool.query('SELECT 1');
  try {
    await pool.query('ALTER TABLE users ADD COLUMN kyc_document_url TEXT NULL');
  } catch {}
  try {
    await pool.query('ALTER TABLE users ADD COLUMN unique_id VARCHAR(20) NULL UNIQUE AFTER id');
  } catch {}
  try {
    await pool.query("UPDATE users SET unique_id = LPAD(id, 6, '0') WHERE unique_id IS NULL OR unique_id = '' OR unique_id LIKE 'STK-%'");
  } catch {}
  try {
    await pool.query(`
      INSERT INTO coin_packages (name, coins, price, bonus, popular) VALUES
      ('Starter', 50, 250.00, 0, FALSE),
      ('Basic', 100, 550.00, 0, FALSE),
      ('Popular', 200, 1150.00, 0, TRUE),
      ('Pro', 400, 2350.00, 0, FALSE),
      ('VIP', 1000, 6500.00, 0, FALSE)
      ON DUPLICATE KEY UPDATE coins = VALUES(coins), price = VALUES(price), bonus = VALUES(bonus), popular = VALUES(popular), active = TRUE
    `);
    await pool.query("UPDATE coin_packages SET active = FALSE WHERE name NOT IN ('Starter', 'Basic', 'Popular', 'Pro', 'VIP')");
  } catch {}
  try {
    await pool.query("ALTER TABLE wallet_transactions MODIFY COLUMN type VARCHAR(50) NOT NULL DEFAULT 'chat_charge'");
  } catch {}
  try {
    await pool.query("ALTER TABLE withdrawals ADD COLUMN coins INT UNSIGNED NOT NULL DEFAULT 0 AFTER amount");
  } catch {}
  try {
    await pool.query("ALTER TABLE withdrawals ADD COLUMN screenshot_url TEXT NULL");
  } catch {}
  try {
    await pool.query("ALTER TABLE withdrawals ADD COLUMN admin_note TEXT NULL");
  } catch {}
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_gifts (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        sender_id BIGINT UNSIGNED NOT NULL,
        recipient_id BIGINT UNSIGNED NOT NULL,
        gift_name VARCHAR(100) NOT NULL,
        gift_icon VARCHAR(20) NOT NULL,
        coins INT UNSIGNED NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_gifts_recipient (recipient_id),
        INDEX idx_user_gifts_sender (sender_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } catch (err) {
    console.warn('user_gifts table create warning:', err.message);
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_requests (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        package_id BIGINT UNSIGNED NOT NULL,
        package_name VARCHAR(120) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        coins INT NOT NULL,
        bonus_coins INT NOT NULL DEFAULT 0,
        screenshot_url TEXT NOT NULL,
        transaction_ref VARCHAR(190) NULL,
        upi_id VARCHAR(120) NULL,
        admin_note TEXT NULL,
        status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        verified_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_payment_requests_user (user_id),
        INDEX idx_payment_requests_status (status),
        CONSTRAINT fk_payment_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } catch (err) {
    console.warn('payment_requests table create warning:', err.message);
  }

  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.nodeEnv === 'production' ? [env.appUrl] : '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  global.io = io;
  setupCallSignaling(io);
  startChatBillingScheduler();

  httpServer.listen(env.port, () => {
    console.log(`Ember API listening on ${env.apiUrl}`);
    console.log(`Socket.IO signaling active on ws://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start API:', error);
  process.exit(1);
});