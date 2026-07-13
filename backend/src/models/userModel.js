const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/db');

const publicFields = `
  id, name, email, phone, role, status, email_verified, phone_verified,
  dob, age_verified, kyc_status, coins, earnings, gender, online_status, last_seen_at, created_at, updated_at
`;

async function create({ name, email = null, phone, password, role = 'user', phoneVerified = false, gender = null }) {
  const passwordHash = await bcrypt.hash(password, 12);
  const isBoy = ['male', 'man', 'boy', 'men'].includes(String(gender || '').toLowerCase());
  const result = await transaction(async (connection) => {
    const [created] = await connection.execute(
      `INSERT INTO users (name, email, phone, password_hash, role, phone_verified, gender, coins)
       VALUES (:name, :email, :phone, :passwordHash, :role, :phoneVerified, :gender, :coins)`,
      { name, email, phone, passwordHash, role, phoneVerified, gender, coins: isBoy ? 100 : 0 }
    );
    const userId = created.insertId;
    await connection.execute(
      `INSERT INTO wallets (user_id, balance, total_purchased, total_spent, total_earned, withdrawal_balance)
       VALUES (:userId, :balance, 0, 0, 0, 0)`,
      { userId, balance: isBoy ? 100 : 0 }
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
  const rows = await query(`SELECT ${publicFields}, password_hash FROM users WHERE id = :id LIMIT 1`, { id });
  return rows[0] || null;
}

async function findPublicById(id) {
  const rows = await query(`SELECT ${publicFields} FROM users WHERE id = :id LIMIT 1`, { id });
  return rows[0] || null;
}

async function findByEmailOrPhone(identifier) {
  const rows = await query(`SELECT * FROM users WHERE email = :identifier OR phone = :identifier LIMIT 1`, { identifier });
  return rows[0] || null;
}

async function list({ page = 1, limit = 20, search = '', role = null, status = null }) {
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const offset = (pageNumber - 1) * limitNumber;
  const filters = ['1=1'];
  const params = { search: `%${search}%` };
  if (search) filters.push('(name LIKE :search OR email LIKE :search OR phone LIKE :search)');
  if (role) {
    filters.push('role = :role');
    params.role = role;
  }
  if (status) {
    filters.push('status = :status');
    params.status = status;
  }
  return query(`SELECT ${publicFields} FROM users WHERE ${filters.join(' AND ')} ORDER BY created_at DESC LIMIT ${limitNumber} OFFSET ${offset}`, params);
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

module.exports = { create, findById, findPublicById, findByEmailOrPhone, list, update, updatePassword, markOnline, markOffline, verifyPassword };
