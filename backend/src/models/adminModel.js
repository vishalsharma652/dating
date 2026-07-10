const { query, transaction } = require('../config/db');
const settingsModel = require('./settingsModel');

async function dashboard() {
  const [users] = await query('SELECT COUNT(*) AS totalUsers, SUM(role = "user") AS members, SUM(kyc_status = "pending") AS pendingKyc FROM users');
  const [orders] = await query('SELECT COUNT(*) AS totalOrders, COALESCE(SUM(total_amount), 0) AS revenue FROM orders');
  const [products] = await query('SELECT COUNT(*) AS totalProducts FROM products');
  const [withdrawals] = await query('SELECT COUNT(*) AS pendingWithdrawals FROM withdrawals WHERE status = "pending"');
  const [chats] = await query('SELECT COUNT(*) AS activeChats FROM chats');
  const [coins] = await query('SELECT COALESCE(SUM(coins), 0) AS coinsSold FROM wallet_transactions WHERE type = "purchase" AND status = "completed"');
  const recentOrders = await query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');
  const recentUsers = await query('SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 5');
  return { ...users, ...orders, ...products, ...withdrawals, ...chats, ...coins, recentOrders, recentUsers };
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
  const filters = ['role = "user"'];
  const params = {};
  if (status) {
    filters.push('kyc_status = :status');
    params.status = status;
  }
  return query(
    `SELECT id, name, email, phone, kyc_status, status AS account_status, created_at, updated_at
     FROM users WHERE ${filters.join(' AND ')}
     ORDER BY updated_at DESC LIMIT ${limitNumber} OFFSET ${offset}`,
    params
  );
}

async function updateKyc(id, { status }) {
  await query('UPDATE users SET kyc_status = :status WHERE id = :id', { id, status });
  return query('SELECT id, name, email, phone, kyc_status FROM users WHERE id = :id', { id }).then((rows) => rows[0]);
}

async function walletLogs({ page = 1, limit = 20 } = {}) {
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const offset = (pageNumber - 1) * limitNumber;
  return query(
    `SELECT wt.*, u.name AS user_name, u.phone AS user_phone
     FROM wallet_transactions wt
     LEFT JOIN users u ON u.id = wt.user_id
     ORDER BY wt.created_at DESC LIMIT ${limitNumber} OFFSET ${offset}`
  );
}

async function adjustCoins({ userId, coins, reason, mode }) {
  const amount = Math.abs(Number(coins) || 0);
  const signedCoins = mode === 'deduct' ? -amount : amount;
  await query('UPDATE users SET coins = GREATEST(coins + :signedCoins, 0) WHERE id = :userId', { userId, signedCoins });
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
    `SELECT w.*, u.name AS user_name, u.phone AS user_phone
     FROM withdrawals w
     LEFT JOIN users u ON u.id = w.user_id
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
  const [revenue] = await query('SELECT COALESCE(SUM(total_amount), 0) AS revenue FROM orders WHERE status = "paid"');
  const [users] = await query('SELECT COUNT(*) AS users FROM users WHERE role = "user"');
  const [orders] = await query('SELECT COUNT(*) AS orders FROM orders');
  const [coins] = await query('SELECT COALESCE(SUM(coins), 0) AS coins FROM wallet_transactions WHERE status = "completed"');
  const [chatsRow] = await query('SELECT COUNT(*) AS chats FROM chats');
  return { ...revenue, ...users, ...orders, ...coins, ...chatsRow };
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
