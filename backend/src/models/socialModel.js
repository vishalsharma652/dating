const { query } = require('../config/db');

async function like(userId, targetUserId, action) {
  await query(
    `INSERT INTO likes (user_id, target_user_id, action) VALUES (:userId, :targetUserId, :action)
     ON DUPLICATE KEY UPDATE action = VALUES(action), updated_at = CURRENT_TIMESTAMP`,
    { userId, targetUserId, action }
  );

  if (action === 'like') {
    const reciprocal = await query('SELECT id FROM likes WHERE user_id = :targetUserId AND target_user_id = :userId AND action = "like"', { userId, targetUserId });
    if (reciprocal.length) {
      await query(
        `INSERT IGNORE INTO matches (user_one_id, user_two_id, status)
         VALUES (LEAST(:userId, :targetUserId), GREATEST(:userId, :targetUserId), 'matched')`,
        { userId, targetUserId }
      );
    }
  }
}

async function matches(userId) {
  return query(
    `SELECT m.id, other_user.id AS profileId, other_user.name, COALESCE(pp.url, '') AS photo,
      m.status, DATE_FORMAT(m.created_at, '%Y-%m-%d') AS matchedDate
     FROM matches m
     JOIN users other_user ON other_user.id = IF(m.user_one_id = :userId, m.user_two_id, m.user_one_id)
     LEFT JOIN profiles p ON p.user_id = other_user.id
     LEFT JOIN profile_photos pp ON pp.profile_id = p.id AND pp.sort_order = 0
     WHERE :userId IN (m.user_one_id, m.user_two_id)
     ORDER BY m.created_at DESC`,
    { userId }
  );
}

async function chats(userId) {
  return query(
    `SELECT c.id, other_user.id AS userId, other_user.name, COALESCE(pp.url, '') AS photo,
      COALESCE(last_msg.body, '') AS lastMessage, COALESCE(DATE_FORMAT(last_msg.created_at, '%l:%i %p'), '') AS lastMessageTime,
      0 AS unread, false AS online
     FROM chats c
     JOIN users other_user ON other_user.id = IF(c.user_one_id = :userId, c.user_two_id, c.user_one_id)
     LEFT JOIN profiles p ON p.user_id = other_user.id
     LEFT JOIN profile_photos pp ON pp.profile_id = p.id AND pp.sort_order = 0
     LEFT JOIN messages last_msg ON last_msg.id = (
       SELECT id FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1
     )
     WHERE :userId IN (c.user_one_id, c.user_two_id)
     ORDER BY c.updated_at DESC`,
    { userId }
  );
}

async function getOrCreateChat(userId, otherUserId) {
  const existing = await query(
    'SELECT * FROM chats WHERE user_one_id = LEAST(:userId, :otherUserId) AND user_two_id = GREATEST(:userId, :otherUserId) LIMIT 1',
    { userId, otherUserId }
  );
  if (existing[0]) return existing[0];
  const result = await query(
    'INSERT INTO chats (user_one_id, user_two_id) VALUES (LEAST(:userId, :otherUserId), GREATEST(:userId, :otherUserId))',
    { userId, otherUserId }
  );
  return { id: result.insertId };
}

async function chatPartner(userId, otherUserId) {
  const rows = await query(
    `SELECT u.id, u.name, COALESCE(pp.url, '') AS photo
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     LEFT JOIN profile_photos pp ON pp.profile_id = p.id AND pp.sort_order = 0
     WHERE u.id = :otherUserId AND u.id <> :userId
     LIMIT 1`,
    { userId, otherUserId }
  );
  return rows[0] || null;
}

async function messages(chatId) {
  return query('SELECT id, sender_id AS senderId, body AS text, type, DATE_FORMAT(created_at, "%l:%i %p") AS timestamp FROM messages WHERE chat_id = :chatId ORDER BY created_at ASC', { chatId });
}

async function sendMessage(chatId, senderId, body, type = 'text') {
  const result = await query('INSERT INTO messages (chat_id, sender_id, body, type) VALUES (:chatId, :senderId, :body, :type)', { chatId, senderId, body, type });
  await query('UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = :chatId', { chatId });
  return { id: result.insertId, senderId, text: body, type };
}

module.exports = { like, matches, chats, getOrCreateChat, chatPartner, messages, sendMessage };
