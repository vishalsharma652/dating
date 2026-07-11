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
