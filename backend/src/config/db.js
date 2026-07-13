const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool(env.db);

async function query(sql, params = {}) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function transaction(work) {
  const connection = await pool.getConnection();
  // mysql2: pool.getConnection() does NOT inherit namedPlaceholders from the pool
  // config, so we must set it explicitly on every acquired connection.
  connection.config.namedPlaceholders = true;
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { pool, query, transaction };
