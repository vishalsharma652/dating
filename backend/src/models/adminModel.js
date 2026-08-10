const { query, transaction } = require('../config/db');
const settingsModel = require('./settingsModel');

async function dashboard() {
  const [users] = await query('SELECT COUNT(*) AS totalUsers, SUM(role = "user") AS members, SUM(kyc_status = "pending") AS pendingKyc, SUM(role = "user" AND online_status = true AND last_seen_at >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)) AS onlineUsers FROM users');
  const [revenueRow] = await query('SELECT COALESCE(SUM(amount), 0) AS revenue FROM wallet_transactions WHERE type = "purchase" AND status = "completed"');
  const [paidRow] = await query('SELECT COALESCE(SUM(amount), 0) AS totalPaid FROM withdrawals WHERE status = "completed"');
  const [withdrawals] = await query('SELECT COUNT(*) AS pendingWithdrawals FROM withdrawals WHERE status = "pending"');
  const [chats] = await query('SELECT COUNT(*) AS activeChats FROM chats');
  const [coins] = await query('SELECT COALESCE(SUM(coins), 0) AS coinsSold FROM wallet_transactions WHERE type = "purchase" AND status = "completed"');
  const recentUsers = await query('SELECT id, unique_id, name, email, phone, role, status, (online_status = true AND last_seen_at >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)) AS online_status, created_at FROM users ORDER BY created_at DESC LIMIT 5');
  return { ...users, ...revenueRow, ...paidRow, ...withdrawals, ...chats, ...coins, recentUsers };
}

async function listTable(table, { page = 1, limit = 20 } = {}) {
  const allowedTables = new Set(['categories', 'products', 'orders']);
  if (!allowedTables.has(table)) {
    throw new Error('Invalid table');
  }
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const offset = (pageNumber - 1) * limitNumber;
  return query(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT ${limitNumber} OFFSET ${offset}`);
}

async function createCategory(data) {
  const result = await query('INSERT INTO categories (name, slug, description, image_url, active) VALUES (:name, :slug, :description, :imageUrl, :active)', {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    imageUrl: data.imageUrl || data.image_url || null,
    active: data.active !== false
  });
  return query('SELECT * FROM categories WHERE id = :id', { id: result.insertId }).then((rows) => rows[0]);
}

async function updateCategory(id, data) {
  await query('UPDATE categories SET name=:name, slug=:slug, description=:description, image_url=:imageUrl, active=:active WHERE id=:id', {
    id,
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    imageUrl: data.imageUrl || data.image_url || null,
    active: data.active !== false
  });
  return query('SELECT * FROM categories WHERE id = :id', { id }).then((rows) => rows[0]);
}

async function createProduct(data) {
  const result = await query(
    `INSERT INTO products (category_id, name, slug, description, price, coins, image_url, active)
     VALUES (:categoryId, :name, :slug, :description, :price, :coins, :imageUrl, :active)`,
    {
      categoryId: data.categoryId || null,
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      price: data.price || 0,
      coins: data.coins || 0,
      imageUrl: data.imageUrl || null,
      active: data.active !== false
    }
  );
  await replaceProductImages(result.insertId, data.images || []);
  return findProduct(result.insertId);
}

async function updateProduct(id, data) {
  await query(
    `UPDATE products SET category_id=:categoryId, name=:name, slug=:slug, description=:description,
     price=:price, coins=:coins, image_url=:imageUrl, active=:active WHERE id=:id`,
    {
      id,
      categoryId: data.categoryId || null,
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      price: data.price || 0,
      coins: data.coins || 0,
      imageUrl: data.imageUrl || null,
      active: data.active !== false
    }
  );
  await replaceProductImages(id, data.images || []);
  return findProduct(id);
}

async function remove(table, id) {
  await query(`DELETE FROM ${table} WHERE id = :id`, { id });
}

async function kycRequests({ page = 1, limit = 20, status = 'pending' } = {}) {
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const offset = (pageNumber - 1) * limitNumber;
  const filters = ['u.role = "user"'];
  const params = {};
  if (status) {
    filters.push('u.kyc_status = :status');
    params.status = status;
  }

  try {
    await query('ALTER TABLE users ADD COLUMN kyc_document_url TEXT NULL');
  } catch {}

  const sql = `
    SELECT u.id, u.unique_id, u.name, u.email, u.phone, u.kyc_status, u.kyc_document_url, u.status AS account_status, u.created_at, u.updated_at,
           (SELECT ph.url FROM profile_photos ph JOIN profiles pr ON pr.id = ph.profile_id WHERE pr.user_id = u.id ORDER BY ph.sort_order ASC LIMIT 1) AS profilePhotoUrl
    FROM users u
    WHERE ${filters.join(' AND ')}
    ORDER BY u.updated_at DESC LIMIT ${limitNumber} OFFSET ${offset}
  `;

  try {
    const rows = await query(sql, params);
    return rows.map((u) => {
      const url = u.kyc_document_url || u.profilePhotoUrl || null;
      return { ...u, selfieUrl: url, kyc_document_url: url };
    });
  } catch (err) {
    const fallbackSql = `
      SELECT u.id, u.name, u.email, u.phone, u.kyc_status, u.status AS account_status, u.created_at, u.updated_at,
             (SELECT ph.url FROM profile_photos ph JOIN profiles pr ON pr.id = ph.profile_id WHERE pr.user_id = u.id ORDER BY ph.sort_order ASC LIMIT 1) AS profilePhotoUrl
      FROM users u
      WHERE ${filters.join(' AND ')}
      ORDER BY u.updated_at DESC LIMIT ${limitNumber} OFFSET ${offset}
    `;
    const rows = await query(fallbackSql, params);
    return rows.map((u) => {
      const url = u.profilePhotoUrl || null;
      return { ...u, selfieUrl: url, kyc_document_url: url };
    });
  }
}



async function updateKyc(id, { status }) {
  await query('UPDATE users SET kyc_status = :status WHERE id = :id', { id, status });
  return query('SELECT id, unique_id, name, email, phone, kyc_status FROM users WHERE id = :id', { id }).then((rows) => rows[0]);
}


async function walletLogs({ page = 1, limit = 10, search = '', gender = '', date = '', type = '' } = {}) {
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (pageNumber - 1) * limitNumber;

  const filters = ['1=1'];
  const params = {};

  if (search && String(search).trim() !== '') {
    const rawSearch = String(search).trim();
    params.search = `%${rawSearch}%`;
    const extractedNum = rawSearch.replace(/^(id|#|stk-?)[:\s]*/i, '');
    if (/^\d+$/.test(extractedNum)) {
      params.exactId = Number(extractedNum);
      filters.push('(u.id = :exactId OR u.unique_id LIKE :search OR u.name LIKE :search OR u.email LIKE :search OR u.phone LIKE :search OR wt.title LIKE :search OR wt.description LIKE :search)');
    } else {
      filters.push('(u.unique_id LIKE :search OR u.name LIKE :search OR u.email LIKE :search OR u.phone LIKE :search OR wt.title LIKE :search OR wt.description LIKE :search)');
    }
  }

  if (gender && String(gender).trim() !== '') {
    const cleanGender = String(gender).trim().toLowerCase();
    if (['male', 'man', 'boy', 'men'].includes(cleanGender)) {
      filters.push('LOWER(COALESCE(u.gender, "")) IN ("male", "man", "boy", "men")');
    } else if (['female', 'woman', 'girl', 'women'].includes(cleanGender)) {
      filters.push('LOWER(COALESCE(u.gender, "")) IN ("female", "woman", "girl", "women")');
    } else {
      filters.push('LOWER(u.gender) = :gender');
      params.gender = cleanGender;
    }
  }

  if (date && String(date).trim() !== '') {
    filters.push('DATE(wt.created_at) = :date');
    params.date = String(date).trim();
  }

  if (type && String(type).trim() !== '') {
    const cleanType = String(type).trim().toLowerCase();
    if (cleanType === 'add' || cleanType === 'credit') {
      filters.push('(wt.coins > 0 OR wt.type IN ("purchase", "earning", "reward"))');
    } else if (cleanType === 'deduct' || cleanType === 'debit') {
      filters.push('(wt.coins < 0 OR wt.type IN ("spending", "chat", "call", "withdrawal"))');
    } else {
      filters.push('wt.type = :type');
      params.type = cleanType;
    }
  }

  const whereClause = filters.join(' AND ');

  const [transactions, countRows] = await Promise.all([
    query(
      `SELECT wt.id, wt.user_id, wt.type, wt.title, wt.description, wt.amount, wt.coins, wt.status, wt.created_at,
              DATE_FORMAT(wt.created_at, '%d %b %Y') AS tx_date,
              DATE_FORMAT(wt.created_at, '%h:%i:%s %p') AS tx_time,
              u.name AS user_name, u.email AS user_email, u.phone AS user_phone, u.gender AS user_gender,
              COALESCE(REPLACE(u.unique_id, 'STK-', ''), LPAD(u.id, 6, '0')) AS user_unique_id
       FROM wallet_transactions wt
       LEFT JOIN users u ON u.id = wt.user_id
       WHERE ${whereClause}
       ORDER BY wt.created_at DESC LIMIT ${limitNumber} OFFSET ${offset}`,
      params
    ),
    query(`SELECT COUNT(*) AS total FROM wallet_transactions wt LEFT JOIN users u ON u.id = wt.user_id WHERE ${whereClause}`, params)
  ]);
  const total = countRows[0]?.total || 0;
  return { transactions, total };
}

async function adjustCoins({ userId, coins, reason, mode }) {
  const amount = Math.abs(Number(coins) || 0);
  const signedCoins = mode === 'deduct' ? -amount : amount;
  await query('UPDATE users SET coins = GREATEST(coins + :signedCoins, 0) WHERE id = :userId', { userId, signedCoins });
  await query(
    `INSERT INTO wallets (user_id, balance, total_purchased, total_spent, total_earned, withdrawal_balance)
     VALUES (:userId, GREATEST(:signedCoins, 0), 0, 0, 0, 0)
     ON DUPLICATE KEY UPDATE balance = GREATEST(balance + :signedCoins, 0)`,
    { userId, signedCoins }
  );
  await query(
    `INSERT INTO wallet_transactions (user_id, type, title, description, amount, coins, status)
     VALUES (:userId, 'earning', :title, :description, 0, :coins, 'completed')`,
    {
      userId,
      title: mode === 'deduct' ? 'Admin Coin Deduction' : 'Admin Coin Credit',
      description: reason || 'Manual admin adjustment',
      coins: signedCoins
    }
  );
  return query('SELECT id, name, phone, coins FROM users WHERE id = :userId', { userId }).then((rows) => rows[0]);
}

async function chats({ page = 1, limit = 20 } = {}) {
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const offset = (pageNumber - 1) * limitNumber;
  return query(
    `SELECT c.id, c.created_at, c.updated_at,
      u1.name AS user_one_name, u1.phone AS user_one_phone,
      u2.name AS user_two_name, u2.phone AS user_two_phone,
      TIMESTAMPDIFF(MINUTE, c.created_at, COALESCE(c.updated_at, NOW())) AS duration_minutes,
      COUNT(m.id) AS message_count
     FROM chats c
     LEFT JOIN users u1 ON u1.id = c.user_one_id
     LEFT JOIN users u2 ON u2.id = c.user_two_id
     LEFT JOIN messages m ON m.chat_id = c.id
     GROUP BY c.id
     ORDER BY c.updated_at DESC LIMIT ${limitNumber} OFFSET ${offset}`
  );
}

async function withdrawals({ page = 1, limit = 20, status = null } = {}) {
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const offset = (pageNumber - 1) * limitNumber;
  const filters = ['1=1'];
  const params = {};
  if (status) {
    filters.push('w.status = :status');
    params.status = status;
  }
  return query(
    `SELECT w.*, u.name AS user_name, u.phone AS user_phone, u.email AS user_email,
            COALESCE(REPLACE(u.unique_id, 'STK-', ''), REPLACE(wa.wallet_id, 'STK-', ''), LPAD(w.user_id, 6, '0')) AS wallet_id
     FROM withdrawals w
     LEFT JOIN users u ON u.id = w.user_id
     LEFT JOIN wallets wa ON wa.user_id = w.user_id
     WHERE ${filters.join(' AND ')}
     ORDER BY w.created_at DESC LIMIT ${limitNumber} OFFSET ${offset}`,
    params
  );
}

async function updateWithdrawal(id, { status }) {
  await transaction(async (connection) => {
    const [rows] = await connection.execute('SELECT * FROM withdrawals WHERE id = :id LIMIT 1 FOR UPDATE', { id });
    const withdrawal = rows[0];
    if (!withdrawal) return;
    if (withdrawal.status === status) return;

    await connection.execute(
      'UPDATE withdrawals SET status = :status, completed_at = IF(:status = "completed", CURRENT_TIMESTAMP, completed_at) WHERE id = :id',
      { id, status }
    );

    if (status === 'rejected' && withdrawal.status === 'pending') {
      await connection.execute('UPDATE users SET earnings = earnings + :amount WHERE id = :userId', {
        amount: withdrawal.amount,
        userId: withdrawal.user_id
      });
      await connection.execute('UPDATE wallets SET withdrawal_balance = withdrawal_balance + :amount WHERE user_id = :userId', {
        amount: withdrawal.amount,
        userId: withdrawal.user_id
      });
    }

    await connection.execute(
      `UPDATE wallet_transactions
       SET status = CASE
         WHEN :status = 'completed' THEN 'completed'
         WHEN :status = 'rejected' THEN 'failed'
         ELSE status
       END
       WHERE user_id = :userId AND type = 'withdrawal' AND description = :description`,
      { status, userId: withdrawal.user_id, description: `Withdrawal #${id}` }
    );
  });
  return query('SELECT * FROM withdrawals WHERE id = :id', { id }).then((rows) => rows[0]);
}

async function reports() {
  const [revenue] = await query('SELECT COALESCE(SUM(amount), 0) AS revenue FROM wallet_transactions WHERE type = "purchase" AND status = "completed"');
  const [paidRow] = await query('SELECT COALESCE(SUM(amount), 0) AS totalPaid FROM withdrawals WHERE status = "completed"');
  const [users] = await query('SELECT COUNT(*) AS users FROM users WHERE role = "user"');
  const [coins] = await query('SELECT COALESCE(SUM(coins), 0) AS coins FROM wallet_transactions WHERE status = "completed"');
  const [chatsRow] = await query('SELECT COUNT(*) AS chats FROM chats');
  return { ...revenue, ...paidRow, ...users, ...coins, ...chatsRow };
}

async function updateOrder(id, data) {
  await query('UPDATE orders SET status = :status WHERE id = :id', { id, status: data.status });
  return query('SELECT * FROM orders WHERE id = :id', { id }).then((rows) => rows[0]);
}

async function findProduct(id) {
  const rows = await query('SELECT * FROM products WHERE id = :id', { id });
  const product = rows[0] || null;
  if (!product) return null;
  const images = await query('SELECT url FROM product_images WHERE product_id = :id ORDER BY sort_order ASC', { id });
  return { ...product, images: images.map((item) => item.url) };
}

async function replaceProductImages(productId, images) {
  await query('DELETE FROM product_images WHERE product_id = :productId', { productId });
  for (const [index, url] of images.filter(Boolean).entries()) {
    await query('INSERT INTO product_images (product_id, url, sort_order) VALUES (:productId, :url, :sortOrder)', {
      productId,
      url,
      sortOrder: index
    });
  }
}

async function settings() {
  return settingsModel.all();
}

async function upsertSetting(key, value) {
  return settingsModel.upsert(key, value);
}

module.exports = {
  dashboard,
  listTable,
  createCategory,
  updateCategory,
  createProduct,
  updateProduct,
  remove,
  kycRequests,
  updateKyc,
  walletLogs,
  adjustCoins,
  chats,
  withdrawals,
  updateWithdrawal,
  reports,
  updateOrder,
  settings,
  upsertSetting
};
