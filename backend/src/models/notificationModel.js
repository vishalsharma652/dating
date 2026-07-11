const { query } = require('../config/db');

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      actor_user_id BIGINT UNSIGNED NULL,
      type VARCHAR(40) NOT NULL,
      title VARCHAR(160) NOT NULL,
      message VARCHAR(255) NOT NULL,
      link_url VARCHAR(255) NULL,
      metadata JSON NULL,
      read_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notifications_user_created (user_id, created_at),
      INDEX idx_notifications_user_read (user_id, read_at),
      CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}

async function create({ userId, actorUserId = null, type, title, message, linkUrl = null, metadata = null }) {
  await ensureTable();
  const result = await query(
    `INSERT INTO notifications (user_id, actor_user_id, type, title, message, link_url, metadata)
     VALUES (:userId, :actorUserId, :type, :title, :message, :linkUrl, :metadata)`,
    {
      userId,
      actorUserId,
      type,
      title,
      message,
      linkUrl,
      metadata: metadata ? JSON.stringify(metadata) : null
    }
  );
  return result.insertId;
}

async function list(userId, { limit = 50, includeRead = false } = {}) {
  await ensureTable();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
  const filters = ['n.user_id = :userId'];
  if (String(includeRead) !== 'true') {
    filters.push('n.read_at IS NULL');
  }

  const rows = await query(
    `SELECT n.id, n.type, n.title, n.message, n.link_url AS linkUrl,
      n.read_at IS NOT NULL AS \`read\`,
      DATE_FORMAT(n.created_at, '%l:%i %p') AS timestamp,
      n.created_at AS createdAt,
      actor.id AS senderId,
      actor.name AS senderName
     FROM notifications n
     LEFT JOIN users actor ON actor.id = n.actor_user_id
     WHERE ${filters.join(' AND ')}
     ORDER BY n.created_at DESC
     LIMIT ${safeLimit}`,
    { userId }
  );
  return rows;
}

async function unreadCount(userId) {
  await ensureTable();
  const rows = await query(
    'SELECT COUNT(*) AS unread FROM notifications WHERE user_id = :userId AND read_at IS NULL',
    { userId }
  );
  return Number(rows[0]?.unread) || 0;
}

async function markRead(userId, notificationId) {
  await ensureTable();
  await query(
    'UPDATE notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id = :notificationId AND user_id = :userId',
    { userId, notificationId }
  );
}

async function markAllRead(userId) {
  await ensureTable();
  await query(
    'UPDATE notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE user_id = :userId AND read_at IS NULL',
    { userId }
  );
}

module.exports = { create, list, unreadCount, markRead, markAllRead };
