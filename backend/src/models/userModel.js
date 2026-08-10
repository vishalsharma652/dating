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
      `INSERT INTO users (name, email, phone, password_hash, role, status, phone_verified, email_verified, gender, coins)
       VALUES (:name, :email, :phone, :passwordHash, :role, 'active', :phoneVerified, :emailVerified, :gender, :coins)`,
      { name, email, phone, passwordHash, role, phoneVerified, emailVerified: emailVerified ? 1 : 0, gender, coins: isBoy ? 100 : 0 }
    );
    const userId = created.insertId;
    // Automatically generate and assign Unique User ID (STK-XXXXXX) at registration
    const uniqueId = `STK-${String(userId).padStart(6, '0')}`;
    await connection.execute(
      `UPDATE users SET unique_id = :uniqueId WHERE id = :userId`,
      { uniqueId, userId }
    );

    // Insert wallet and auto-assign numeric wallet_id
    const walletId = `WLT-${String(userId).padStart(6, '0')}`;
    const [walletResult] = await connection.execute(
      `INSERT INTO wallets (user_id, wallet_id, balance, total_purchased, total_spent, total_earned, withdrawal_balance)
       VALUES (:userId, :walletId, :balance, 0, 0, 0, 0)`,
      { userId, walletId, balance: isBoy ? 100 : 0 }
    );

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

async function list({ page = 1, limit = 10, search = '', role = null, status = null, online_status = null, kyc_status = null, gender = null, sort = 'newest' }) {
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

  const orderBy = sort === 'oldest' ? 'ORDER BY u.created_at ASC' : 'ORDER BY u.created_at DESC';
  return query(`SELECT ${publicFields} FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE ${filters.join(' AND ')} ${orderBy} LIMIT ${limitNumber} OFFSET ${offset}`, params);
}

async function count({ search = '', role = null, status = null, online_status = null, kyc_status = null, gender = null }) {
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
  const allowed = ['name', 'email', 'phone', 'role', 'status', 'dob', 'age_verified', 'kyc_status', 'kyc_document_url', 'coins', 'earnings', 'gender', 'phone_verified', 'email_verified'];
  const entries = Object.entries(fields).filter(([key]) => allowed.includes(key));
  if (!entries.length) return findPublicById(id);
  const assignments = entries.map(([key]) => `${key} = :${key}`).join(', ');
  try {
    await query(`UPDATE users SET ${assignments} WHERE id = :id`, { id, ...Object.fromEntries(entries) });
  } catch {
    const safeEntries = entries.filter(([key]) => key !== 'kyc_document_url');
    if (safeEntries.length > 0) {
      const safeAssignments = safeEntries.map(([key]) => `${key} = :${key}`).join(', ');
      await query(`UPDATE users SET ${safeAssignments} WHERE id = :id`, { id, ...Object.fromEntries(safeEntries) });
    }
  }
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

async function remove(id) {
  return await transaction(async (connection) => {
    // 1. Find chats involving this user
    const [userChats] = await connection.execute(
      'SELECT id FROM chats WHERE user_one_id = :id OR user_two_id = :id',
      { id }
    );
    if (userChats.length > 0) {
      for (const c of userChats) {
        await connection.execute('DELETE FROM messages WHERE chat_id = :chatId', { chatId: c.id });
        await connection.execute('DELETE FROM chat_sessions WHERE chat_id = :chatId', { chatId: c.id });
      }
      await connection.execute('DELETE FROM chats WHERE user_one_id = :id OR user_two_id = :id', { id });
    }

    // 2. Delete chat requests, likes, matches, notifications
    await connection.execute('DELETE FROM chat_requests WHERE requester_id = :id OR receiver_id = :id', { id });
    await connection.execute('DELETE FROM likes WHERE user_id = :id OR target_user_id = :id', { id });
    await connection.execute('DELETE FROM matches WHERE user_one_id = :id OR user_two_id = :id', { id });
    await connection.execute('DELETE FROM notifications WHERE user_id = :id OR actor_user_id = :id', { id });

    // 3. Delete wallet, transactions, bank_accounts, withdrawals, orders
    await connection.execute('DELETE FROM wallet_transactions WHERE user_id = :id', { id });
    await connection.execute('DELETE FROM wallets WHERE user_id = :id', { id });
    await connection.execute('DELETE FROM bank_accounts WHERE user_id = :id', { id });
    await connection.execute('DELETE FROM withdrawals WHERE user_id = :id', { id });
    await connection.execute('DELETE FROM orders WHERE user_id = :id', { id });

    // 4. Delete profiles & profile_photos
    const [userProfiles] = await connection.execute('SELECT id FROM profiles WHERE user_id = :id', { id });
    if (userProfiles.length > 0) {
      for (const p of userProfiles) {
        await connection.execute('DELETE FROM profile_photos WHERE profile_id = :profileId', { profileId: p.id });
      }
      await connection.execute('DELETE FROM profiles WHERE user_id = :id', { id });
    }

    // 5. Delete user from users table
    await connection.execute('DELETE FROM users WHERE id = :id', { id });
    return true;
  });
}

async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.password_hash);
}

async function updatePassword(id, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE users SET password_hash = :passwordHash WHERE id = :id', { id, passwordHash });
  return true;
}

module.exports = { create, findById, findPublicById, findByEmailOrPhone, list, count, update, updatePassword, markOnline, markOffline, verifyPassword, remove };
