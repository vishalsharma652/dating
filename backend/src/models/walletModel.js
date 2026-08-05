const { query, transaction } = require('../config/db');
const { AppError } = require('../utils/errors');

async function transactions(userId) {
  return query('SELECT id, type, title, description, amount, coins, status, DATE_FORMAT(created_at, "%Y-%m-%d") AS date FROM wallet_transactions WHERE user_id = :userId ORDER BY created_at DESC', { userId });
}

async function wallet(userId) {
  let rows = await query(
    `SELECT w.id AS walletRowId, 
      COALESCE(REPLACE(u.unique_id, 'STK-', ''), LPAD(u.id, 6, '0')) AS walletId, 
      w.balance AS coins, w.total_purchased AS totalPurchased, w.total_spent AS totalSpent,
      w.total_earned AS totalEarned, w.withdrawal_balance AS withdrawalBalance,
      u.earnings, u.coins AS userCoins
     FROM users u LEFT JOIN wallets w ON w.user_id = u.id WHERE u.id = :userId LIMIT 1`,
    { userId }
  );
  if (!rows[0]) return null;

  const userUniqueId = rows[0].walletId;

  // Auto-create wallet record if user doesn't have one in wallets table yet
  if (!rows[0].walletRowId) {
    const initialCoins = rows[0].userCoins || 0;
    const res = await query(
      `INSERT INTO wallets (user_id, wallet_id, balance, total_purchased, total_spent, total_earned, withdrawal_balance)
       VALUES (:userId, :userUniqueId, :initialCoins, 0, 0, 0, 0)
       ON DUPLICATE KEY UPDATE balance = balance, wallet_id = VALUES(wallet_id)`,
      { userId, userUniqueId, initialCoins }
    );
    const walletRowId = res.insertId;

    return {
      walletRowId,
      walletId: userUniqueId,
      coins: initialCoins,
      totalPurchased: 0,
      totalSpent: 0,
      totalEarned: 0,
      withdrawalBalance: 0,
      earnings: rows[0].earnings || 0
    };
  }

  // Always synchronize wallet_id in database to match user's unique_id (STK-XXXXXX)
  try {
    await query('UPDATE wallets SET wallet_id = :userUniqueId WHERE id = :id', { userUniqueId, id: rows[0].walletRowId });
  } catch (err) { /* ignore */ }
  rows[0].walletId = userUniqueId;
  return rows[0];
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
    const [users] = await connection.execute('SELECT gender, unique_id FROM users WHERE id = :userId LIMIT 1 FOR UPDATE', { userId });
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
    // Ensure wallet exists with numeric user unique_id
    const userUniqueId = String(users[0].unique_id || userId).replace(/^STK-/i, '').padStart(6, '0');
    const [existingWallet] = await connection.execute('SELECT id FROM wallets WHERE user_id = :userId LIMIT 1', { userId });
    if (!existingWallet[0]) {
      await connection.execute(
        'INSERT INTO wallets (user_id, wallet_id, balance) VALUES (:userId, :userUniqueId, 0)', { userId, userUniqueId }
      );
    } else {
      await connection.execute(
        'UPDATE wallets SET wallet_id = :userUniqueId WHERE user_id = :userId', { userUniqueId, userId }
      );
    }
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
    await query("ALTER TABLE wallet_transactions ADD COLUMN payment_gateway VARCHAR(50) NULL AFTER status");
  } else {
    await query("ALTER TABLE wallet_transactions MODIFY COLUMN payment_gateway VARCHAR(50) NULL");
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
  const amountRupees = Number(data.amount);
  if (isNaN(amountRupees) || amountRupees < 50) {
    throw new AppError('Minimum withdrawal amount is ₹50 (200 Coins)', 422);
  }
  const requiredCoins = amountRupees * 4; // Rate: 200 Coins = ₹50 (1 Coin = ₹0.25)

  const result = await transaction(async (connection) => {
    const [users] = await connection.execute(
      'SELECT coins, earnings FROM users WHERE id = :userId LIMIT 1 FOR UPDATE',
      { userId }
    );
    if (!users[0]) throw new AppError('User not found', 404);

    const availableCoins = Math.max(Number(users[0].coins || 0), Number(users[0].earnings || 0));
    if (availableCoins < requiredCoins) {
      throw new AppError(`Insufficient coins. You need ${requiredCoins} coins to withdraw ₹${amountRupees}.`, 422);
    }

    // Deduct coins from user's coins & earnings
    await connection.execute(
      'UPDATE users SET coins = GREATEST(coins - :requiredCoins, 0), earnings = GREATEST(earnings - :requiredCoins, 0) WHERE id = :userId',
      { requiredCoins, userId }
    );
    await connection.execute(
      'UPDATE wallets SET withdrawal_balance = GREATEST(withdrawal_balance - :requiredCoins, 0), balance = GREATEST(balance - :requiredCoins, 0) WHERE user_id = :userId',
      { requiredCoins, userId }
    );

    // Record withdrawal request in rupees
    const [withdrawalResult] = await connection.execute(
      `INSERT INTO withdrawals (user_id, amount, method, bank_name, account_number, status)
       VALUES (:userId, :amountRupees, :method, :bankName, :accountNumber, 'pending')`,
      { userId, amountRupees, method: data.method, bankName: data.bankName || null, accountNumber: data.accountNumber || null }
    );

    await connection.execute(
      `INSERT INTO wallet_transactions (user_id, type, title, description, amount, coins, status)
       VALUES (:userId, 'withdrawal', 'Withdrawal Requested', :description, :amountRupees, :requiredCoins, 'pending')`,
      { userId, description: `Withdrawal #${withdrawalResult.insertId} (₹${amountRupees} for ${requiredCoins} coins)`, amountRupees: -amountRupees, requiredCoins: -requiredCoins }
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
