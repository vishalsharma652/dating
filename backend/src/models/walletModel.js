const { query, transaction } = require('../config/db');
const { AppError } = require('../utils/errors');

async function transactions(userId) {
  return query('SELECT id, type, title, description, amount, coins, status, DATE_FORMAT(created_at, "%Y-%m-%d") AS date FROM wallet_transactions WHERE user_id = :userId ORDER BY created_at DESC', { userId });
}

async function wallet(userId) {
  const rows = await query(
    `SELECT w.balance AS coins, w.total_purchased AS totalPurchased, w.total_spent AS totalSpent,
      w.total_earned AS totalEarned, w.withdrawal_balance AS withdrawalBalance,
      u.earnings
     FROM wallets w JOIN users u ON u.id = w.user_id WHERE w.user_id = :userId LIMIT 1`,
    { userId }
  );
  return rows[0] || null;
}

async function coinPackages() {
  return query('SELECT id, name, coins, price, bonus, popular, active FROM coin_packages WHERE active = true ORDER BY price ASC');
}

async function purchase(userId, packageId, payment = {}) {
  await ensureWalletTransactionPaymentColumns();
  const packages = await query('SELECT * FROM coin_packages WHERE id = :packageId AND active = true LIMIT 1', { packageId });
  const pkg = packages[0];
  if (!pkg) return null;
  const totalCoins = Number(pkg.coins) + Number(pkg.bonus || 0);
  await transaction(async (connection) => {
    const [users] = await connection.execute('SELECT gender FROM users WHERE id = :userId LIMIT 1 FOR UPDATE', { userId });
    if (!users[0]) throw new AppError('User not found', 404);
    if (!['male', 'man', 'boy', 'men'].includes(String(users[0].gender || '').toLowerCase())) {
      throw new AppError('Only boy users can purchase chat coins', 403);
    }
    if (!payment.gateway || !payment.reference) {
      throw new AppError('A verified payment gateway and reference are required', 422);
    }
    const [duplicate] = await connection.execute(
      'SELECT id FROM wallet_transactions WHERE payment_reference = :reference LIMIT 1', { reference: payment.reference }
    );
    if (duplicate[0]) throw new AppError('This payment has already been processed', 409);
    await connection.execute(
      `INSERT INTO wallets (user_id, balance) VALUES (:userId, 0)
       ON DUPLICATE KEY UPDATE user_id = user_id`, { userId }
    );
    await connection.execute(
      'UPDATE wallets SET balance = balance + :totalCoins, total_purchased = total_purchased + :totalCoins WHERE user_id = :userId',
      { totalCoins, userId }
    );
    await connection.execute('UPDATE users SET coins = coins + :totalCoins WHERE id = :userId', { totalCoins, userId });
    await connection.execute(
      `INSERT INTO wallet_transactions (user_id, type, title, description, amount, coins, status, payment_gateway, payment_reference)
       VALUES (:userId, 'purchase', 'Coin Purchase', :description, :amount, :coins, 'completed', :gateway, :reference)`,
      {
        userId,
        description: pkg.name,
        amount: pkg.price,
        coins: totalCoins,
        gateway: payment.gateway || null,
        reference: payment.reference || null
      }
    );
  });
  return { package: pkg, coinsAdded: totalCoins };
}

async function ensureWalletTransactionPaymentColumns() {
  if (!(await columnExists('wallet_transactions', 'payment_gateway'))) {
    await query("ALTER TABLE wallet_transactions ADD COLUMN payment_gateway ENUM('razorpay','cashfree','phonepe') NULL AFTER status");
  }

  if (!(await columnExists('wallet_transactions', 'payment_reference'))) {
    await query('ALTER TABLE wallet_transactions ADD COLUMN payment_reference VARCHAR(190) NULL AFTER payment_gateway');
  }
}

async function columnExists(tableName, columnName) {
  const rows = await query(
    `SELECT COUNT(*) AS total
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = :tableName
       AND COLUMN_NAME = :columnName`,
    { tableName, columnName }
  );
  return Number(rows[0]?.total) > 0;
}

async function saveBankAccount(userId, data) {
  const result = await query(
    `INSERT INTO bank_accounts (user_id, account_holder_name, bank_name, account_number, ifsc_code, upi_id, status)
     VALUES (:userId, :accountHolderName, :bankName, :accountNumber, :ifscCode, :upiId, 'pending')`,
    {
      userId,
      accountHolderName: data.accountHolderName,
      bankName: data.bankName || null,
      accountNumber: data.accountNumber || null,
      ifscCode: data.ifscCode || null,
      upiId: data.upiId || null
    }
  );
  return findBankAccount(result.insertId);
}

async function findBankAccount(id) {
  const rows = await query(
    `SELECT id, account_holder_name AS accountHolderName, bank_name AS bankName, account_number AS accountNumber,
      ifsc_code AS ifscCode, upi_id AS upiId, status, created_at AS createdAt
     FROM bank_accounts WHERE id = :id LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

async function bankAccounts(userId) {
  return query(
    `SELECT id, account_holder_name AS accountHolderName, bank_name AS bankName, account_number AS accountNumber,
      ifsc_code AS ifscCode, upi_id AS upiId, status, created_at AS createdAt
     FROM bank_accounts WHERE user_id = :userId ORDER BY created_at DESC`,
    { userId }
  );
}

async function createWithdrawal(userId, data) {
  const amount = Number(data.amount);
  const result = await transaction(async (connection) => {
    const [users] = await connection.execute('SELECT earnings FROM users WHERE id = :userId LIMIT 1 FOR UPDATE', { userId });
    if (!users[0]) throw new AppError('User not found', 404);
    if (Number(users[0].earnings) < amount) throw new AppError('Insufficient earnings for this withdrawal', 422);

    await connection.execute('UPDATE users SET earnings = earnings - :amount WHERE id = :userId', { amount, userId });
    await connection.execute(
      'UPDATE wallets SET withdrawal_balance = withdrawal_balance - :amount WHERE user_id = :userId AND withdrawal_balance >= :amount',
      { amount, userId }
    );
    const [withdrawalResult] = await connection.execute(
      `INSERT INTO withdrawals (user_id, amount, method, bank_name, account_number, status)
       VALUES (:userId, :amount, :method, :bankName, :accountNumber, 'pending')`,
      { userId, amount, method: data.method, bankName: data.bankName || null, accountNumber: data.accountNumber || null }
    );
    await connection.execute(
      `INSERT INTO wallet_transactions (user_id, type, title, description, amount, coins, status)
       VALUES (:userId, 'withdrawal', 'Withdrawal Requested', :description, :amount, 0, 'pending')`,
      { userId, description: `Withdrawal #${withdrawalResult.insertId}`, amount: -amount }
    );
    return withdrawalResult;
  });
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

module.exports = { wallet, transactions, coinPackages, purchase, saveBankAccount, bankAccounts, createWithdrawal, withdrawals };
