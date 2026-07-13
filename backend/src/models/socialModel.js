const { query, transaction } = require('../config/db');
const notificationModel = require('./notificationModel');

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
      COALESCE(unread_counts.unread, 0) AS unread,
      (other_user.online_status = true AND other_user.last_seen_at >= DATE_SUB(NOW(), INTERVAL 2 MINUTE)) AS online
     FROM chats c
     JOIN users other_user ON other_user.id = IF(c.user_one_id = :userId, c.user_two_id, c.user_one_id)
     LEFT JOIN profiles p ON p.user_id = other_user.id
     LEFT JOIN profile_photos pp ON pp.profile_id = p.id AND pp.sort_order = 0
     LEFT JOIN messages last_msg ON last_msg.id = (
       SELECT id FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1
     )
     LEFT JOIN (
       SELECT chat_id, COUNT(*) AS unread
       FROM messages
       WHERE sender_id <> :userId AND delivery_status <> 'read'
       GROUP BY chat_id
     ) unread_counts ON unread_counts.chat_id = c.id
     WHERE :userId IN (c.user_one_id, c.user_two_id)
     ORDER BY c.updated_at DESC`,
    { userId }
  );
}

async function createChatRequest(requesterId, receiverId) {
  await query(
    `INSERT INTO chat_requests (requester_id, receiver_id, status)
     VALUES (:requesterId, :receiverId, 'pending')
     ON DUPLICATE KEY UPDATE status = 'pending', updated_at = CURRENT_TIMESTAMP`,
    { requesterId, receiverId }
  );
  return query(
    `SELECT id, requester_id AS requesterId, receiver_id AS receiverId, status, created_at AS createdAt
     FROM chat_requests WHERE requester_id = :requesterId AND receiver_id = :receiverId LIMIT 1`,
    { requesterId, receiverId }
  ).then((rows) => rows[0]);
}

async function respondToChatRequest(userId, requestId, status) {
  const rows = await query('SELECT * FROM chat_requests WHERE id = :requestId AND receiver_id = :userId LIMIT 1', { requestId, userId });
  const request = rows[0];
  if (!request) return null;

  await query('UPDATE chat_requests SET status = :status WHERE id = :requestId', { requestId, status });
  const chat = status === 'accepted' ? await getOrCreateChat(request.requester_id, request.receiver_id) : null;
  return { id: request.id, requesterId: request.requester_id, receiverId: request.receiver_id, status, chat };
}

async function chatRequests(userId) {
  return query(
    `SELECT cr.id, cr.requester_id AS requesterId, cr.receiver_id AS receiverId, cr.status,
      requester.name AS requesterName, receiver.name AS receiverName, cr.created_at AS createdAt
     FROM chat_requests cr
     JOIN users requester ON requester.id = cr.requester_id
     JOIN users receiver ON receiver.id = cr.receiver_id
     WHERE cr.requester_id = :userId OR cr.receiver_id = :userId
     ORDER BY cr.updated_at DESC`,
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
    `SELECT u.id, u.name, COALESCE(pp.url, '') AS photo,
      (u.online_status = true AND u.last_seen_at >= DATE_SUB(NOW(), INTERVAL 2 MINUTE)) AS online,
      u.last_seen_at AS lastSeenAt
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     LEFT JOIN profile_photos pp ON pp.profile_id = p.id AND pp.sort_order = 0
     WHERE u.id = :otherUserId AND u.id <> :userId
     LIMIT 1`,
    { userId, otherUserId }
  );
  return rows[0] || null;
}

async function messages(chatId, readerUserId) {
  await query(
    `UPDATE messages
     SET delivery_status = 'read'
     WHERE chat_id = :chatId
       AND sender_id <> :readerUserId
       AND delivery_status <> 'read'`,
    { chatId, readerUserId }
  );

  return query(
    'SELECT id, sender_id AS senderId, body AS text, type, delivery_status AS deliveryStatus, DATE_FORMAT(created_at, "%l:%i %p") AS timestamp FROM messages WHERE chat_id = :chatId ORDER BY created_at ASC',
    { chatId }
  );
}

async function sendMessage(chatId, senderId, body, type = 'text') {
  const result = await query('INSERT INTO messages (chat_id, sender_id, body, type) VALUES (:chatId, :senderId, :body, :type)', { chatId, senderId, body, type });
  await query('UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = :chatId', { chatId });
  const chatRows = await query('SELECT user_one_id, user_two_id FROM chats WHERE id = :chatId LIMIT 1', { chatId });
  const chat = chatRows[0];
  const recipientUserId = Number(chat?.user_one_id) === Number(senderId) ? chat?.user_two_id : chat?.user_one_id;

  if (recipientUserId) {
    const senderRows = await query('SELECT name FROM users WHERE id = :senderId LIMIT 1', { senderId });
    const senderName = senderRows[0]?.name || 'Someone';
    const preview = String(body || '').trim().slice(0, 120);
    await notificationModel.create({
      userId: recipientUserId,
      actorUserId: senderId,
      type: 'message',
      title: senderName,
      message: preview || 'Sent you a message',
      linkUrl: `/user/chat/${senderId}`,
      metadata: { chatId, messageId: result.insertId }
    });
  }
  return { id: result.insertId, senderId, text: body, type, deliveryStatus: 'sent' };
}

async function startChatSession(chatId, payerUserId, earnerUserId, settings) {
  const chargePerMinute = Number(settings.chatChargePerMinute || 10);
  const earnerShare = Number(settings.earnerSharePerMinute || 7);
  const platformShare = Number(settings.platformSharePerMinute || chargePerMinute - earnerShare);
  const existing = await query('SELECT * FROM chat_sessions WHERE chat_id = :chatId AND status = "active" LIMIT 1', { chatId });
  if (existing[0]) return existing[0];

  const result = await query(
    `INSERT INTO chat_sessions (chat_id, payer_user_id, earner_user_id, charge_per_minute, earner_share, platform_share)
     VALUES (:chatId, :payerUserId, :earnerUserId, :chargePerMinute, :earnerShare, :platformShare)`,
    { chatId, payerUserId, earnerUserId, chargePerMinute, earnerShare, platformShare }
  );

  // Notify the girl that a paid session has started
  const [payerRows] = await query('SELECT name FROM users WHERE id = :id LIMIT 1', { id: payerUserId }).then((r) => [r]);
  const payerName = payerRows[0]?.name || 'Someone';
  await notificationModel.create({
    userId: earnerUserId,
    actorUserId: payerUserId,
    type: 'chat_session_started',
    title: 'Paid Chat Started',
    message: `${payerName} started a paid chat with you. You earn ${earnerShare} coins per minute.`,
    linkUrl: `/user/chat/${payerUserId}`,
    metadata: { chatId, chargePerMinute, earnerShare }
  });

  return query('SELECT * FROM chat_sessions WHERE id = :id', { id: result.insertId }).then((rows) => rows[0]);
}

async function chargeChatMinute(sessionId) {
  const result = await transaction(async (connection) => {
    const [sessions] = await connection.execute(
      'SELECT * FROM chat_sessions WHERE id = :sessionId AND status = "active" LIMIT 1 FOR UPDATE',
      { sessionId }
    );
    const session = sessions[0];
    if (!session) return { session: null };

    const charge = Number(session.charge_per_minute);
    const earnerShare = Number(session.earner_share);
    const platformShare = Number(session.platform_share);

    // Check payer wallet balance
    const [payers] = await connection.execute(
      'SELECT balance FROM wallets WHERE user_id = :payerUserId LIMIT 1 FOR UPDATE',
      { payerUserId: session.payer_user_id }
    );

    if (!payers[0] || Number(payers[0].balance) < charge) {
      // End session due to insufficient coins
      await connection.execute(
        'UPDATE chat_sessions SET status = "ended", ended_at = CURRENT_TIMESTAMP WHERE id = :sessionId',
        { sessionId }
      );
      return { ...session, status: 'ended', charged: false, reason: 'insufficient_coins', _payerId: session.payer_user_id, _earnerId: session.earner_user_id, _hadSession: true };
    }

    // Deduct coins from boy (payer)
    await connection.execute(
      'UPDATE wallets SET balance = balance - :charge, total_spent = total_spent + :charge WHERE user_id = :payerUserId',
      { charge, payerUserId: session.payer_user_id }
    );
    await connection.execute(
      'UPDATE users SET coins = coins - :charge WHERE id = :payerUserId',
      { charge, payerUserId: session.payer_user_id }
    );

    // Credit earnings to girl (earner)
    await connection.execute(
      `INSERT INTO wallets (user_id, balance, total_earned, withdrawal_balance)
       VALUES (:earnerUserId, :earnerShare, :earnerShare, :earnerShare)
       ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance), total_earned = total_earned + VALUES(total_earned), withdrawal_balance = withdrawal_balance + VALUES(withdrawal_balance)`,
      { earnerUserId: session.earner_user_id, earnerShare }
    );
    await connection.execute(
      'UPDATE users SET coins = coins + :earnerShare, earnings = earnings + :earnerShare WHERE id = :earnerUserId',
      { earnerShare, earnerUserId: session.earner_user_id }
    );

    // Log wallet transactions for both users
    await connection.execute(
      `INSERT INTO wallet_transactions (user_id, type, title, description, amount, coins, status)
       VALUES (:payerUserId, 'chat_charge', 'Chat Minute Charged', :payerDescription, 0, :payerCoins, 'completed'),
              (:earnerUserId, 'earning',    'Chat Minute Earning',  :earnerDescription, 0, :earnerCoins, 'completed')`,
      {
        payerUserId: session.payer_user_id,
        earnerUserId: session.earner_user_id,
        payerDescription: `Chat session #${session.id}`,
        earnerDescription: `Chat session #${session.id}`,
        payerCoins: -charge,
        earnerCoins: earnerShare
      }
    );

    // Log platform commission
    await connection.execute(
      'INSERT INTO platform_commission_ledger (chat_session_id, amount, description) VALUES (:sessionId, :platformShare, :description)',
      { sessionId, platformShare, description: `Chat session #${session.id}` }
    );

    // Advance session timer
    await connection.execute(
      'UPDATE chat_sessions SET charged_minutes = charged_minutes + 1, last_charged_at = CURRENT_TIMESTAMP WHERE id = :sessionId',
      { sessionId }
    );

    const remainingBalance = Number(payers[0].balance) - charge;
    return { ...session, status: 'active', charged: true, chargedMinutes: Number(session.charged_minutes) + 1, _payerId: session.payer_user_id, _remainingBalance: remainingBalance, _charge: charge, _hadSession: true };
  });

  if (!result._hadSession) return null;

  // Send notifications AFTER the transaction has committed to avoid deadlocks
  if (result.status === 'ended') {
    await Promise.all([
      notificationModel.create({
        userId: result._payerId,
        type: 'chat_session_ended',
        title: 'Chat Ended — Coins Exhausted',
        message: `Your chat session ended because you ran out of coins. Buy more coins to keep chatting.`,
        linkUrl: '/user/wallet/coins',
        metadata: { sessionId, reason: 'insufficient_coins' }
      }).catch(() => {}),
      notificationModel.create({
        userId: result._earnerId,
        actorUserId: result._payerId,
        type: 'chat_session_ended',
        title: 'Paid Chat Ended',
        message: `The paid chat session ended because the user ran out of coins.`,
        linkUrl: `/user/chat/${result._payerId}`,
        metadata: { sessionId, reason: 'insufficient_coins' }
      }).catch(() => {})
    ]);
  } else if (result._remainingBalance < result._charge * 2) {
    notificationModel.create({
      userId: result._payerId,
      type: 'low_coins_warning',
      title: 'Low Coins Warning',
      message: `You have only ${result._remainingBalance} coins left. Buy more to keep your chat going.`,
      linkUrl: '/user/wallet/coins',
      metadata: { sessionId, remainingBalance: result._remainingBalance }
    }).catch(() => {});
  }

  // Strip internal fields before returning
  const { _payerId, _earnerId, _remainingBalance, _charge, _hadSession, ...cleanResult } = result;
  return cleanResult;
}

async function endChatSession(sessionId, userId) {
  await query(
    `UPDATE chat_sessions SET status = 'ended', ended_at = CURRENT_TIMESTAMP
     WHERE id = :sessionId AND (payer_user_id = :userId OR earner_user_id = :userId)`,
    { sessionId, userId }
  );
  return query('SELECT * FROM chat_sessions WHERE id = :sessionId', { sessionId }).then((rows) => rows[0] || null);
}

async function activeChatSession(chatId) {
  return query('SELECT * FROM chat_sessions WHERE chat_id = :chatId AND status = "active" LIMIT 1', { chatId }).then((rows) => rows[0] || null);
}

async function dueChatSessions() {
  return query(`SELECT id FROM chat_sessions WHERE status = 'active' AND COALESCE(last_charged_at, started_at) <= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 MINUTE)`);
}

module.exports = {
  like,
  matches,
  chats,
  createChatRequest,
  respondToChatRequest,
  chatRequests,
  getOrCreateChat,
  chatPartner,
  messages,
  sendMessage,
  startChatSession,
  chargeChatMinute,
  endChatSession,
  activeChatSession,
  dueChatSessions
};
