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
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
