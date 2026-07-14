const { pool } = require('../src/config/db');

async function columnExists(tableName, columnName) {
  const [rows] = await pool.query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName]);
  return rows.length > 0;
}

async function main() {
  if (!(await columnExists('users', 'gender'))) {
    await pool.query('ALTER TABLE users ADD COLUMN gender VARCHAR(40) NULL AFTER earnings');
    console.log('Added users.gender');
  } else {
    console.log('users.gender already exists');
  }

  if (!(await columnExists('users', 'online_status'))) {
    await pool.query('ALTER TABLE users ADD COLUMN online_status BOOLEAN NOT NULL DEFAULT FALSE AFTER gender');
    console.log('Added users.online_status');
  } else {
    console.log('users.online_status already exists');
  }

  if (!(await columnExists('users', 'last_seen_at'))) {
    await pool.query('ALTER TABLE users ADD COLUMN last_seen_at TIMESTAMP NULL AFTER online_status');
    console.log('Added users.last_seen_at');
  } else {
    console.log('users.last_seen_at already exists');
  }

  if (!(await columnExists('wallet_transactions', 'payment_gateway'))) {
    await pool.query("ALTER TABLE wallet_transactions ADD COLUMN payment_gateway VARCHAR(50) NULL AFTER status");
    console.log('Added wallet_transactions.payment_gateway');
  } else {
    await pool.query("ALTER TABLE wallet_transactions MODIFY COLUMN payment_gateway VARCHAR(50) NULL");
    console.log('Modified wallet_transactions.payment_gateway to VARCHAR(50)');
  }

  if (!(await columnExists('wallet_transactions', 'payment_reference'))) {
    await pool.query('ALTER TABLE wallet_transactions ADD COLUMN payment_reference VARCHAR(190) NULL AFTER payment_gateway');
    console.log('Added wallet_transactions.payment_reference');
  } else {
    console.log('wallet_transactions.payment_reference already exists');
  }

  await pool.query("ALTER TABLE wallet_transactions MODIFY COLUMN type ENUM('welcome_bonus','purchase','earning','withdrawal','chat_charge','commission') NOT NULL");

  await pool.query(`
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
    )
  `);
  await pool.query(`
    INSERT IGNORE INTO wallets (user_id, balance, total_earned, withdrawal_balance)
    SELECT id, coins, earnings, earnings FROM users
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS platform_commission_ledger (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      chat_session_id BIGINT UNSIGNED NULL,
      amount INT NOT NULL,
      description VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_platform_commission_created (created_at),
      CONSTRAINT fk_platform_commission_session FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id) ON DELETE SET NULL
    )
  `);
  if (!(await columnExists('chat_sessions', 'last_charged_at'))) {
    await pool.query('ALTER TABLE chat_sessions ADD COLUMN last_charged_at TIMESTAMP NULL AFTER started_at');
  }
  console.log('wallet economy tables ready');

  await pool.query(`
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
    )
  `);
  console.log('notifications table ready');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
