const { query, transaction } = require('../config/db');
const { AppError } = require('../utils/errors');
const settingsModel = require('./settingsModel');
const notificationModel = require('./notificationModel');

async function dashboard() {
  const [users] = await query('SELECT COUNT(*) AS totalUsers, SUM(role = "user") AS members, SUM(kyc_status = "pending") AS pendingKyc, SUM(role = "user" AND online_status = true AND last_seen_at >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)) AS onlineUsers FROM users');
  const [revenueRow] = await query('SELECT COALESCE(SUM(amount), 0) AS revenue FROM wallet_transactions WHERE type = "purchase" AND status = "completed"');
  const [paidRow] = await query('SELECT COUNT(*) AS completedWithdrawals, COALESCE(SUM(amount), 0) AS totalPaid FROM withdrawals WHERE status = "completed"');
  const [withdrawals] = await query('SELECT COUNT(*) AS pendingWithdrawals, COALESCE(SUM(amount), 0) AS pendingWithdrawalAmount FROM withdrawals WHERE status = "pending"');
  const [totalWithdrawalsRow] = await query('SELECT COUNT(*) AS totalWithdrawals, COALESCE(SUM(amount), 0) AS totalWithdrawalAmount FROM withdrawals');
  const [chats] = await query('SELECT COUNT(*) AS activeChats FROM chats');
  const [coins] = await query('SELECT COALESCE(SUM(coins), 0) AS coinsSold FROM wallet_transactions WHERE type = "purchase" AND status = "completed"');
  const recentUsers = await query('SELECT id, unique_id, name, email, phone, role, status, (online_status = true AND last_seen_at >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)) AS online_status, created_at FROM users ORDER BY created_at DESC LIMIT 5');
  return { ...users, ...revenueRow, ...paidRow, ...withdrawals, ...totalWithdrawalsRow, ...chats, ...coins, recentUsers };
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
      `SELECT 
        MAX(wt.id) AS id,
        wt.user_id,
        DATE(wt.created_at) AS tx_raw_date,
        DATE_FORMAT(MAX(wt.created_at), '%d %b %Y') AS tx_date,
        DATE_FORMAT(MAX(wt.created_at), '%h:%i:%s %p') AS tx_time,
        MAX(wt.created_at) AS created_at,
        u.name AS user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        u.gender AS user_gender,
        COALESCE(REPLACE(u.unique_id, 'STK-', ''), LPAD(u.id, 6, '0')) AS user_unique_id,
        SUM(wt.coins) AS coins,
        SUM(CASE WHEN wt.coins > 0 THEN wt.coins ELSE 0 END) AS total_credited,
        SUM(CASE WHEN wt.coins < 0 THEN ABS(wt.coins) ELSE 0 END) AS total_deducted,
        COUNT(*) AS total_activities,
        GROUP_CONCAT(DISTINCT wt.type SEPARATOR ', ') AS combined_types,
        MAX(wt.status) AS status
       FROM wallet_transactions wt
       LEFT JOIN users u ON u.id = wt.user_id
       WHERE ${whereClause}
       GROUP BY wt.user_id, DATE(wt.created_at)
       ORDER BY MAX(wt.created_at) DESC
       LIMIT ${limitNumber} OFFSET ${offset}`,
      params
    ),
    query(
      `SELECT COUNT(*) AS total FROM (
        SELECT wt.user_id, DATE(wt.created_at)
        FROM wallet_transactions wt
        LEFT JOIN users u ON u.id = wt.user_id
        WHERE ${whereClause}
        GROUP BY wt.user_id, DATE(wt.created_at)
      ) AS grouped_days`,
      params
    )
  ]);

  const total = Number(countRows[0]?.total) || 0;
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

async function ensureWithdrawalColumns() {
  try {
    await query("ALTER TABLE withdrawals ADD COLUMN ifsc_code VARCHAR(30) NULL AFTER account_number");
  } catch (e) {}
  try {
    await query("ALTER TABLE withdrawals ADD COLUMN upi_id VARCHAR(120) NULL AFTER ifsc_code");
  } catch (e) {}
  try {
    await query("ALTER TABLE withdrawals ADD COLUMN account_holder_name VARCHAR(120) NULL AFTER bank_name");
  } catch (e) {}
}

async function withdrawals({ page = 1, limit = 20, status = null } = {}) {
  await ensureWithdrawalColumns();
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 1000);
  const offset = (pageNumber - 1) * limitNumber;
  const filters = ['1=1'];
  const params = {};
  if (status && status !== 'all') {
    filters.push('w.status = :status');
    params.status = status;
  }
  return query(
    `SELECT w.*,
            COALESCE(NULLIF(NULLIF(w.ifsc_code, 'null'), ''), NULLIF(NULLIF(ba.ifsc_code, 'null'), '')) AS ifsc_code,
            COALESCE(NULLIF(NULLIF(w.account_holder_name, 'null'), ''), NULLIF(NULLIF(ba.account_holder_name, 'null'), ''), u.name) AS account_holder_name,
            COALESCE(NULLIF(w.coins, 0), ROUND(w.amount * 4)) AS coins,
            u.name AS user_name, u.phone AS user_phone, u.email AS user_email, u.gender AS user_gender,
            COALESCE(REPLACE(u.unique_id, 'STK-', ''), REPLACE(wa.wallet_id, 'STK-', ''), LPAD(w.user_id, 6, '0')) AS wallet_id
     FROM withdrawals w
     LEFT JOIN users u ON u.id = w.user_id
     LEFT JOIN wallets wa ON wa.user_id = w.user_id
     LEFT JOIN (
       SELECT user_id, MAX(ifsc_code) AS ifsc_code, MAX(account_holder_name) AS account_holder_name
       FROM bank_accounts
       GROUP BY user_id
     ) ba ON ba.user_id = w.user_id
     WHERE ${filters.join(' AND ')}
     ORDER BY w.created_at DESC LIMIT ${limitNumber} OFFSET ${offset}`,
    params
  );
}

async function updateWithdrawal(id, { status, screenshot_url, admin_note } = {}) {
  let prevWithdrawal = null;
  await transaction(async (connection) => {
    const [rows] = await connection.execute('SELECT * FROM withdrawals WHERE id = :id LIMIT 1 FOR UPDATE', { id });
    const withdrawal = rows[0];
    if (!withdrawal) return;
    prevWithdrawal = withdrawal;

    const targetStatus = status || withdrawal.status;
    const updates = ['status = :status'];
    const params = { id, status: targetStatus };

    if (targetStatus === 'completed' && (!withdrawal.completed_at || withdrawal.status !== 'completed')) {
      updates.push('completed_at = CURRENT_TIMESTAMP');
    } else if (targetStatus !== 'completed' && withdrawal.status === 'completed') {
      updates.push('completed_at = NULL');
    }

    if (screenshot_url !== undefined) {
      updates.push('screenshot_url = :screenshot_url');
      params.screenshot_url = screenshot_url;
    }
    if (admin_note !== undefined) {
      updates.push('admin_note = :admin_note');
      params.admin_note = admin_note;
    }

    await connection.execute(
      `UPDATE withdrawals SET ${updates.join(', ')} WHERE id = :id`,
      params
    );

    if (targetStatus === 'rejected' && withdrawal.status !== 'rejected') {
      await connection.execute('UPDATE users SET earnings = earnings + :amount WHERE id = :userId', {
        amount: withdrawal.amount,
        userId: withdrawal.user_id
      });
      await connection.execute('UPDATE wallets SET withdrawal_balance = withdrawal_balance + :amount WHERE user_id = :userId', {
        amount: withdrawal.amount,
        userId: withdrawal.user_id
      });
    } else if (withdrawal.status === 'rejected' && targetStatus !== 'rejected') {
      await connection.execute('UPDATE users SET earnings = GREATEST(0, earnings - :amount) WHERE id = :userId', {
        amount: withdrawal.amount,
        userId: withdrawal.user_id
      });
      await connection.execute('UPDATE wallets SET withdrawal_balance = GREATEST(0, withdrawal_balance - :amount) WHERE user_id = :userId', {
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
       WHERE user_id = :userId AND type = 'withdrawal' AND (description = :descExact OR description LIKE :descLike)`,
      {
        status: targetStatus,
        userId: withdrawal.user_id,
        descExact: `Withdrawal #${id}`,
        descLike: `Withdrawal #${id} %`
      }
    );
  });

  const updated = await query('SELECT * FROM withdrawals WHERE id = :id', { id }).then((rows) => rows[0]);

  if (updated && prevWithdrawal) {
    try {
      const amount = Number(updated.amount || 0);
      const coins = Number(updated.coins || 0) || Math.round(amount * 4);
      const noteText = (admin_note !== undefined && String(admin_note).trim())
        ? String(admin_note).trim()
        : (updated.admin_note || '');

      if (status === 'rejected') {
        const reason = noteText || 'Requirements not met';
        await notificationModel.create({
          userId: updated.user_id,
          type: 'withdrawal_status',
          title: 'Withdrawal Request Rejected ❌',
          message: `Your withdrawal request of ₹${amount} (${coins} coins) was rejected. Reason: ${reason}`,
          linkUrl: '/user/withdraw/history',
          metadata: { withdrawalId: id, status: 'rejected', reason, amount, coins }
        });
      } else if (status === 'pending') {
        const holdNote = noteText || 'Under verification';
        await notificationModel.create({
          userId: updated.user_id,
          type: 'withdrawal_status',
          title: 'Withdrawal Request On Hold ⏳',
          message: `Your withdrawal request of ₹${amount} is currently on hold. Note: ${holdNote}`,
          linkUrl: '/user/withdraw/history',
          metadata: { withdrawalId: id, status: 'pending', note: holdNote, amount, coins }
        });
      } else if (status === 'completed' && prevWithdrawal.status !== 'completed') {
        await notificationModel.create({
          userId: updated.user_id,
          type: 'withdrawal_status',
          title: 'Withdrawal Paid Successfully 🎉',
          message: `Your payout of ₹${amount} (${coins} coins) has been successfully processed & transferred!`,
          linkUrl: '/user/withdraw/history',
          metadata: { withdrawalId: id, status: 'completed', amount, coins }
        });
      }
    } catch (notifErr) {
      console.error('Failed to create notification for withdrawal update:', notifErr);
    }
  }

  return updated;
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

async function paymentRequests({ page = 1, limit = 20, status = null, search = '', date = '' } = {}) {
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 1000);
  const offset = (pageNumber - 1) * limitNumber;
  const filters = ['1=1'];
  const params = {};

  if (status && status !== 'all') {
    filters.push('pr.status = :status');
    params.status = status;
  }

  if (search && String(search).trim() !== '') {
    const rawSearch = String(search).trim();
    params.search = `%${rawSearch}%`;
    const extractedNum = rawSearch.replace(/^(id|#|stk-?|req-?)[:\s]*/i, '');
    if (/^\d+$/.test(extractedNum)) {
      params.exactId = Number(extractedNum);
      filters.push('(pr.id = :exactId OR u.id = :exactId OR u.unique_id LIKE :search OR u.name LIKE :search OR u.email LIKE :search OR u.phone LIKE :search OR pr.transaction_ref LIKE :search OR pr.package_name LIKE :search)');
    } else {
      filters.push('(u.unique_id LIKE :search OR u.name LIKE :search OR u.email LIKE :search OR u.phone LIKE :search OR pr.transaction_ref LIKE :search OR pr.package_name LIKE :search)');
    }
  }

  if (date && String(date).trim() !== '') {
    filters.push('DATE(pr.created_at) = :date');
    params.date = String(date).trim();
  }

  const whereClause = filters.join(' AND ');

  const [requests, countRows, statsRows] = await Promise.all([
    query(
      `SELECT pr.id, pr.user_id, pr.package_id, pr.package_name, pr.amount, pr.coins, pr.bonus_coins,
              pr.screenshot_url, pr.transaction_ref, pr.upi_id, pr.admin_note, pr.status,
              pr.verified_at, pr.created_at, pr.updated_at,
              u.name AS user_name, u.email AS user_email, u.phone AS user_phone, u.gender AS user_gender,
              COALESCE(REPLACE(u.unique_id, 'STK-', ''), LPAD(u.id, 6, '0')) AS user_unique_id,
              (SELECT ph.url FROM profile_photos ph JOIN profiles p ON p.id = ph.profile_id WHERE p.user_id = u.id ORDER BY ph.sort_order ASC LIMIT 1) AS profilePhotoUrl
       FROM payment_requests pr
       LEFT JOIN users u ON u.id = pr.user_id
       WHERE ${whereClause}
       ORDER BY pr.created_at DESC
       LIMIT ${limitNumber} OFFSET ${offset}`,
      params
    ),
    query(
      `SELECT COUNT(*) AS total
       FROM payment_requests pr
       LEFT JOIN users u ON u.id = pr.user_id
       WHERE ${whereClause}`,
      params
    ),
    query(
      `SELECT 
        COUNT(*) AS totalCount,
        SUM(status = 'pending') AS pendingCount,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pendingAmount,
        SUM(status = 'approved') AS approvedCount,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) AS approvedAmount,
        SUM(status = 'rejected') AS rejectedCount
       FROM payment_requests`
    )
  ]);

  const total = Number(countRows[0]?.total) || 0;
  const stats = statsRows[0] || { totalCount: 0, pendingCount: 0, pendingAmount: 0, approvedCount: 0, approvedAmount: 0, rejectedCount: 0 };

  return { requests, total, stats };
}

async function updatePaymentRequest(id, { status, admin_note, transaction_ref, utr }) {
  const targetStatus = String(status || '').toLowerCase();
  if (!['approved', 'rejected', 'pending'].includes(targetStatus)) {
    throw new AppError('Invalid payment status', 400);
  }

  const updatedRequest = await transaction(async (connection) => {
    const [rows] = await connection.execute('SELECT * FROM payment_requests WHERE id = :id LIMIT 1 FOR UPDATE', { id });
    const request = rows[0];
    if (!request) throw new AppError('Payment request not found', 404);

    const previousStatus = request.status;

    if (targetStatus === 'approved') {
      if (previousStatus === 'approved') {
        throw new AppError('This payment request is already approved', 400);
      }

      // Extract and validate Transaction UTR
      const rawUtr = (transaction_ref || utr || request.transaction_ref || '').trim();
      if (!rawUtr) {
        throw new AppError('Transaction UTR is required to approve this payment. Please enter the UTR number from the screenshot proof.', 400);
      }

      // Check if ANY other payment request has already been approved with the same UTR
      const [duplicateUtr] = await connection.execute(
        `SELECT id, user_id, amount, package_name, DATE_FORMAT(verified_at, "%d %b %Y %H:%i") AS verified_date 
         FROM payment_requests 
         WHERE transaction_ref = :utr AND id != :id AND status = 'approved' 
         LIMIT 1`,
        { utr: rawUtr, id }
      );

      if (duplicateUtr && duplicateUtr.length > 0) {
        const dup = duplicateUtr[0];
        throw new AppError(
          `Duplicate UTR Error! Transaction UTR "${rawUtr}" has already been verified for Request #REQ-${dup.id} (₹${dup.amount} - ${dup.package_name}). One payment cannot have the same UTR twice.`,
          400
        );
      }

      const totalCoins = Number(request.coins || 0) + Number(request.bonus_coins || 0);
      const userId = request.user_id;

      const [users] = await connection.execute('SELECT id, unique_id, name FROM users WHERE id = :userId LIMIT 1', { userId });
      if (users[0]) {
        const userUniqueId = String(users[0].unique_id || userId).replace(/^STK-/i, '').padStart(6, '0');
        const [existingWallet] = await connection.execute('SELECT id FROM wallets WHERE user_id = :userId LIMIT 1', { userId });
        if (!existingWallet[0]) {
          await connection.execute(
            'INSERT INTO wallets (user_id, wallet_id, balance, total_purchased, total_spent, total_earned, withdrawal_balance) VALUES (:userId, :userUniqueId, :totalCoins, :totalCoins, 0, 0, 0)',
            { userId, userUniqueId, totalCoins }
          );
        } else {
          await connection.execute(
            'UPDATE wallets SET balance = balance + :totalCoins, total_purchased = total_purchased + :totalCoins, wallet_id = :userUniqueId WHERE user_id = :userId',
            { totalCoins, userUniqueId, userId }
          );
        }

        await connection.execute('UPDATE users SET coins = coins + :totalCoins WHERE id = :userId', { totalCoins, userId });

        const ref = rawUtr || `QR-VERIFY-${request.id}`;
        await connection.execute(
          `INSERT INTO wallet_transactions (user_id, type, title, description, amount, coins, status, payment_gateway, payment_reference)
           VALUES (:userId, 'purchase', 'Coin Purchase (QR Verified)', :description, :amount, :coins, 'completed', 'upi_qr', :reference)`,
          {
            userId,
            description: request.package_name || 'Coin Package',
            amount: request.amount,
            coins: totalCoins,
            reference: ref
          }
        );

        try {
          await connection.execute(
            `INSERT INTO notifications (user_id, type, title, message, link_url)
             VALUES (:userId, 'payment_verified', 'Payment Verified 🎉', :message, '/user/wallet')`,
            {
              userId,
              message: `Your payment of ₹${request.amount} for ${request.package_name} (UTR: ${rawUtr}) has been verified. ${totalCoins} coins have been added to your wallet!`
            }
          );
        } catch (nErr) { /* ignore */ }
      }

      await connection.execute(
        `UPDATE payment_requests SET status = 'approved', transaction_ref = :utr, verified_at = CURRENT_TIMESTAMP, admin_note = :adminNote WHERE id = :id`,
        { id, utr: rawUtr, adminNote: admin_note || request.admin_note || 'Approved by Admin' }
      );
    } else if (targetStatus === 'rejected') {
      await connection.execute(
        `UPDATE payment_requests SET status = 'rejected', admin_note = :adminNote WHERE id = :id`,
        { id, adminNote: admin_note || request.admin_note || 'Rejected by Admin' }
      );

      try {
        await connection.execute(
          `INSERT INTO notifications (user_id, type, title, message, link_url)
           VALUES (:userId, 'payment_rejected', 'Payment Verification Failed', :message, '/user/wallet/coins')`,
          {
            userId: request.user_id,
            message: `Your payment verification for ₹${request.amount} was rejected.${admin_note ? ' Reason: ' + admin_note : ''}`
          }
        );
      } catch (nErr) { /* ignore */ }
    } else if (targetStatus === 'pending') {
      await connection.execute(
        `UPDATE payment_requests SET status = 'pending', admin_note = :adminNote WHERE id = :id`,
        { id, adminNote: admin_note || null }
      );
    }

    const [updatedRows] = await connection.execute('SELECT * FROM payment_requests WHERE id = :id LIMIT 1', { id });
    return updatedRows[0];
  });

  return updatedRequest;
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
  paymentRequests,
  updatePaymentRequest,
  reports,
  updateOrder,
  settings,
  upsertSetting
};

