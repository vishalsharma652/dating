const { query } = require('../config/db');

async function transactions(userId) {
  return query('SELECT id, type, title, description, amount, coins, status, DATE_FORMAT(created_at, "%Y-%m-%d") AS date FROM wallet_transactions WHERE user_id = :userId ORDER BY created_at DESC', { userId });
}

async function coinPackages() {
  return query('SELECT id, name, coins, price, bonus, popular, active FROM coin_packages WHERE active = true ORDER BY price ASC');
}

async function purchase(userId, packageId) {
  const packages = await query('SELECT * FROM coin_packages WHERE id = :packageId AND active = true LIMIT 1', { packageId });
  const pkg = packages[0];
  if (!pkg) return null;
  const totalCoins = Number(pkg.coins) + Number(pkg.bonus || 0);
  await query('UPDATE users SET coins = coins + :totalCoins WHERE id = :userId', { totalCoins, userId });
  await query(
    `INSERT INTO wallet_transactions (user_id, type, title, description, amount, coins, status)
     VALUES (:userId, 'purchase', 'Coin Purchase', :description, :amount, :coins, 'completed')`,
    { userId, description: pkg.name, amount: pkg.price, coins: totalCoins }
  );
  return { package: pkg, coinsAdded: totalCoins };
}

async function createWithdrawal(userId, data) {
  const result = await query(
    `INSERT INTO withdrawals (user_id, amount, method, bank_name, account_number, status)
     VALUES (:userId, :amount, :method, :bankName, :accountNumber, 'pending')`,
    { userId, amount: data.amount, method: data.method, bankName: data.bankName || null, accountNumber: data.accountNumber || null }
  );
  return findWithdrawal(result.insertId);
}

async function findWithdrawal(id) {
  const rows = await query('SELECT * FROM withdrawals WHERE id = :id LIMIT 1', { id });
  return rows[0] || null;
}

async function withdrawals(userId) {
  return query(
    `SELECT id, amount, status, method, bank_name AS bankName, account_number AS accountNumber,
      DATE_FORMAT(created_at, "%Y-%m-%d") AS requestDate, DATE_FORMAT(completed_at, "%Y-%m-%d") AS completedDate
     FROM withdrawals WHERE user_id = :userId ORDER BY created_at DESC`,
    { userId }
  );
}

module.exports = { transactions, coinPackages, purchase, createWithdrawal, withdrawals };
