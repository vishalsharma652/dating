const { query } = require('./src/config/db');

async function main() {
  const sessions = await query('SELECT id, status, payer_user_id, earner_user_id, charged_minutes, last_charged_at, started_at FROM chat_sessions ORDER BY id DESC LIMIT 10');
  console.log('RECENT SESSIONS:', JSON.stringify(sessions, null, 2));

  const users = await query(`SELECT u.id, u.name, u.gender, u.coins, COALESCE(w.balance,0) AS walletBalance
    FROM users u LEFT JOIN wallets w ON w.user_id=u.id ORDER BY u.id`);
  console.log('USERS:', JSON.stringify(users, null, 2));

  const activeSessions = await query(`SELECT * FROM chat_sessions WHERE status = 'active'`);
  console.log('ACTIVE SESSIONS:', JSON.stringify(activeSessions, null, 2));

  const dueSessions = await query(`SELECT id FROM chat_sessions WHERE status = 'active' AND COALESCE(last_charged_at, started_at) <= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 MINUTE)`);
  console.log('DUE SESSIONS:', JSON.stringify(dueSessions));

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
