const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/db');

const publicFields = `
  u.id, u.unique_id, u.name, u.email, u.phone, u.role, u.status, u.email_verified, u.phone_verified,
  u.dob, u.age_verified, u.kyc_status, u.coins, u.earnings, u.gender,
  (u.online_status = true AND u.last_seen_at IS NOT NULL AND u.last_seen_at >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)) AS online_status,
  u.last_seen_at, u.created_at, u.updated_at,
  COALESCE(p.city, '') AS city, COALESCE(p.occupation, '') AS occupation, COALESCE(p.bio, '') AS bio,
  COALESCE(p.interested_in, '') AS interested_in, COALESCE(p.age, 0) AS age
`;

async function create({ name, email = null, phone, password, role = 'user', phoneVerified = false, emailVerified = false, gender = null }) {
  const passwordHash = await bcrypt.hash(password, 12);
  const isBoy = ['male', 'man', 'boy', 'men'].includes(String(gender || '').toLowerCase());
  const result = await transaction(async (connection) => {
    const [created] = await connection.execute(
      `INSERT INTO users (name, email, phone, password_hash, role, phone_verified, email_verified, gender, coins)
       VALUES (:name, :email, :phone, :passwordHash, :role, :phoneVerified, :emailVerified, :gender, :coins)`,
      { name, email, phone, passwordHash, role, phoneVerified, emailVerified: emailVerified ? 1 : 0, gender, coins: isBoy ? 100 : 0 }
    );
    const userId = created.insertId;
    const uniqueId = `STK-${String(userId).padStart(6, '0')}`;
    await connection.execute('UPDATE users SET unique_id = :uniqueId WHERE id = :userId', { uniqueId, userId });

    // Insert wallet and auto-generate wallet_id
    const [walletResult] = await connection.execute(
      `INSERT INTO wallets (user_id, balance, total_purchased, total_spent, total_earned, withdrawal_balance)
       VALUES (:userId, :balance, 0, 0, 0, 0)`,
      { userId, balance: isBoy ? 100 : 0 }
    );
    const walletId = `WLT-${String(walletResult.insertId).padStart(6, '0')}`;
    await connection.execute('UPDATE wallets SET wallet_id = :walletId WHERE id = :id', { walletId, id: walletResult.insertId });

    if (isBoy) {
      await connection.execute(
        `INSERT INTO wallet_transactions (user_id, type, title, description, amount, coins, status)
         VALUES (:userId, 'welcome_bonus', 'Welcome Bonus', '100 welcome coins for joining', 0, 100, 'completed')`,
        { userId }
      );
    }
    return created;
  });
  return findById(result.insertId);
}

async function findById(id) {
  try {
    const rows = await query(`SELECT ${publicFields}, u.password_hash FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = :id LIMIT 1`, { id });
    return rows[0] || null;
  } catch (err) {
    const fallbackFields = publicFields.replace('u.unique_id,', '');
    const rows = await query(`SELECT ${fallbackFields}, u.password_hash FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = :id LIMIT 1`, { id });
    return rows[0] || null;
  }
}

async function findPublicById(id) {
  try {
    const rows = await query(`SELECT ${publicFields} FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = :id LIMIT 1`, { id });
    return rows[0] || null;
  } catch (err) {
    const fallbackFields = publicFields.replace('u.unique_id,', '');
    const rows = await query(`SELECT ${fallbackFields} FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = :id LIMIT 1`, { id });
    return rows[0] || null;
  }
}


async function findByEmailOrPhone(identifier) {
  const rows = await query(`SELECT * FROM users WHERE email = :identifier OR phone = :identifier LIMIT 1`, { identifier });
  return rows[0] || null;
}

async function list({ page = 1, limit = 10, search = '', role = null, status = null, online_status = null, kyc_status = null }) {
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 200);
  const offset = (pageNumber - 1) * limitNumber;
  const filters = ['1=1'];
  const params = {};

  if (search && String(search).trim() !== '') {
    const rawSearch = String(search).trim();
    params.search = `%${rawSearch}%`;
    const extractedNum = rawSearch.replace(/^(id|#|stk-?)[:\s]*/i, '');
    if (/^\d+$/.test(extractedNum)) {
      params.exactId = Number(extractedNum);
      filters.push('(u.id = :exactId OR u.unique_id LIKE :search OR u.name LIKE :search OR u.email LIKE :search OR u.phone LIKE :search)');
    } else {
      filters.push('(u.unique_id LIKE :search OR u.name LIKE :search OR u.email LIKE :search OR u.phone LIKE :search)');
    }
  }

  if (role) {
    filters.push('u.role = :role');
    params.role = role;
  }
  if (status) {
    filters.push('u.status = :status');
    params.status = status;
  }
  if (online_status !== null && online_status !== undefined && online_status !== '') {
    const isOnlineFilter = online_status === 'true' || online_status === true || online_status === 1 || online_status === '1' || online_status === 'online';
    if (isOnlineFilter) {
      filters.push('(u.online_status = true AND u.last_seen_at IS NOT NULL AND u.last_seen_at >= DATE_SUB(NOW(), INTERVAL 3 MINUTE))');
    } else {
      filters.push('(u.online_status = false OR u.last_seen_at IS NULL OR u.last_seen_at < DATE_SUB(NOW(), INTERVAL 3 MINUTE))');
    }
  }
  if (kyc_status) {
    filters.push('u.kyc_status = :kyc_status');
    params.kyc_status = kyc_status;
  }
  return query(`SELECT ${publicFields} FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE ${filters.join(' AND ')} ORDER BY u.created_at DESC LIMIT ${limitNumber} OFFSET ${offset}`, params);
}

async function count({ search = '', role = null, status = null, online_status = null, kyc_status = null }) {
  const filters = ['1=1'];
  const params = {};

  if (search && String(search).trim() !== '') {
    const rawSearch = String(search).trim();
    params.search = `%${rawSearch}%`;
    const extractedNum = rawSearch.replace(/^(id|#)[:\s]*/i, '');
    if (/^\d+$/.test(extractedNum)) {
      params.exactId = Number(extractedNum);
      filters.push('(u.id = :exactId OR u.name LIKE :search OR u.email LIKE :search OR u.phone LIKE :search)');
    } else {
      filters.push('(u.name LIKE :search OR u.email LIKE :search OR u.phone LIKE :search)');
    }
  }

  if (role) {
    filters.push('u.role = :role');
    params.role = role;
  }
  if (status) {
    filters.push('u.status = :status');
    params.status = status;
  }
  if (online_status !== null && online_status !== undefined && online_status !== '') {
    const isOnlineFilter = online_status === 'true' || online_status === true || online_status === 1 || online_status === '1' || online_status === 'online';
    if (isOnlineFilter) {
      filters.push('(u.online_status = true AND u.last_seen_at IS NOT NULL AND u.last_seen_at >= DATE_SUB(NOW(), INTERVAL 3 MINUTE))');
    } else {
      filters.push('(u.online_status = false OR u.last_seen_at IS NULL OR u.last_seen_at < DATE_SUB(NOW(), INTERVAL 3 MINUTE))');
    }
  }
  if (kyc_status) {
    filters.push('u.kyc_status = :kyc_status');
    params.kyc_status = kyc_status;
  }
  const result = await query(`SELECT COUNT(*) as count FROM users u WHERE ${filters.join(' AND ')}`, params);
  return result[0]?.count || 0;
}

async function update(id, fields) {
  const allowed = ['name', 'email', 'phone', 'role', 'status', 'dob', 'age_verified', 'kyc_status', 'coins', 'earnings', 'gender', 'phone_verified', 'email_verified'];
  const entries = Object.entries(fields).filter(([key]) => allowed.includes(key));
  if (!entries.length) return findPublicById(id);
  const assignments = entries.map(([key]) => `${key} = :${key}`).join(', ');
  await query(`UPDATE users SET ${assignments} WHERE id = :id`, { id, ...Object.fromEntries(entries) });
  return findPublicById(id);
}

async function updatePassword(id, password) {
  const passwordHash = await bcrypt.hash(password, 12);
  await query('UPDATE users SET password_hash = :passwordHash WHERE id = :id', { id, passwordHash });
  return findById(id);
}

async function markOnline(id) {
  await query('UPDATE users SET online_status = true, last_seen_at = CURRENT_TIMESTAMP WHERE id = :id', { id });
  return findPublicById(id);
}

async function markOffline(id) {
  await query('UPDATE users SET online_status = false WHERE id = :id', { id });
  return findPublicById(id);
}

async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.password_hash);
}

module.exports = { create, findById, findPublicById, findByEmailOrPhone, list, count, update, updatePassword, markOnline, markOffline, verifyPassword };
