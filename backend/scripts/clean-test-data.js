const { pool } = require('../src/config/db');

async function cleanTestData() {
  console.log('====================================================');
  console.log('  SAATHIKA PLATFORM - CLEANING TEST DATA FOR LAUNCH');
  console.log('====================================================\n');

  const connection = await pool.getConnection();

  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    const tablesToTruncate = [
      'user_gifts',
      'messages',
      'chat_sessions',
      'chat_requests',
      'chats',
      'likes',
      'matches',
      'notifications',
      'wallet_transactions',
      'withdrawals',
      'payment_requests',
      'bank_accounts',
      'wallets',
      'profile_photos',
      'profiles',
      'platform_commission_ledger',
    ];

    for (const table of tablesToTruncate) {
      try {
        await connection.query(`TRUNCATE TABLE ${table}`);
        console.log(`  ✔ Cleaned table: ${table}`);
      } catch (err) {
        console.log(`  ⚠ Table ${table} skip/empty (${err.message})`);
      }
    }

    // Delete non-admin test users while keeping admin user intact
    const [result] = await connection.query("DELETE FROM users WHERE role != 'admin'");
    console.log(`  ✔ Deleted ${result.affectedRows} non-admin test user account(s).`);

    // Reset admin counters
    await connection.query("UPDATE users SET coins = 0, earnings = 0 WHERE role = 'admin'");
    console.log('  ✔ Reset admin balance & earnings.');

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n====================================================');
    console.log('  SUCCESS: Database cleaned and ready for Launch!');
    console.log('====================================================\n');

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    connection.release();
    await pool.end();
  }
}

cleanTestData();
