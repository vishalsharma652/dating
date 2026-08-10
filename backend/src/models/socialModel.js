const { query, transaction } = require('../config/db');
const { AppError } = require('../utils/errors');
const notificationModel = require('./notificationModel');

/**
 * Helper to ensure 1 day = 1 record in wallet_transactions per user.
 * If a transaction for this user already exists today (CURDATE()),
 * it updates the existing record by accumulating the coins instead of inserting a new minute-wise row.
 */
async function recordOrUpdateDailyWalletTransaction(connection, { userId, type, title, description, coins, status = 'completed' }) {
  const numCoins = Number(coins) || 0;
  const [existing] = await connection.execute(
    `SELECT id, coins, title, description 
     FROM wallet_transactions 
     WHERE user_id = :userId 
       AND type = :type 
       AND DATE(created_at) = CURDATE() 
     ORDER BY id DESC LIMIT 1`,
    { userId, type }
  );

  if (existing && existing.length > 0) {
    const row = existing[0];
    const updatedCoins = Number(row.coins || 0) + numCoins;
    await connection.execute(
      `UPDATE wallet_transactions 
       SET coins = :updatedCoins, 
           description = :description,
           status = :status,
           created_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      {
        id: row.id,
        updatedCoins,
        description: description || row.description,
        status
      }
    );
    return row.id;
  } else {
    const [res] = await connection.execute(
      `INSERT INTO wallet_transactions (user_id, type, title, description, amount, coins, status)
       VALUES (:userId, :type, :title, :description, 0, :coins, :status)`,
      {
        userId,
        type,
        title,
        description,
        coins: numCoins,
        status
      }
    );
    return res.insertId;
  }
}

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

async function ensureChatPinsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS chat_pins (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        chat_id BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_chat_pin (user_id, chat_id),
        CONSTRAINT fk_pins_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_pins_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      )
    `);
  } catch (e) {}
}

async function togglePinChat(userId, chatId) {
  await ensureChatPinsTable();
  const uId = Number(userId);
  const cId = Number(chatId);

  const existing = await query(
    'SELECT id FROM chat_pins WHERE user_id = :uId AND chat_id = :cId LIMIT 1',
    { uId, cId }
  );

  let pinned = false;
  if (existing.length) {
    await query('DELETE FROM chat_pins WHERE user_id = :uId AND chat_id = :cId', { uId, cId });
    pinned = false;
  } else {
    await query('INSERT INTO chat_pins (user_id, chat_id) VALUES (:uId, :cId)', { uId, cId });
    pinned = true;
  }
  return { pinned };
}

async function chats(userId) {
  await ensureChatPinsTable();
  return query(
    `SELECT c.id, other_user.id AS userId, other_user.name, COALESCE(pp.url, '') AS photo,
      COALESCE(last_msg.body, '') AS lastMessage, COALESCE(DATE_FORMAT(last_msg.created_at, '%l:%i %p'), '') AS lastMessageTime,
      COALESCE(unread_counts.unread, 0) AS unread,
      (other_user.online_status = true AND other_user.last_seen_at >= DATE_SUB(NOW(), INTERVAL 2 MINUTE)) AS online,
      (cp.id IS NOT NULL) AS isPinned
     FROM chats c
     JOIN users other_user ON other_user.id = IF(c.user_one_id = :userId, c.user_two_id, c.user_one_id)
     LEFT JOIN profiles p ON p.user_id = other_user.id
     LEFT JOIN profile_photos pp ON pp.profile_id = p.id AND pp.sort_order = 0
     LEFT JOIN chat_pins cp ON cp.chat_id = c.id AND cp.user_id = :userId
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
     ORDER BY isPinned DESC, c.updated_at DESC`,
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

async function initMessagesDeletionSchema() {
  try {
    await query("ALTER TABLE messages ADD COLUMN deleted_for_sender TINYINT(1) NOT NULL DEFAULT 0");
  } catch (e) {}
  try {
    await query("ALTER TABLE messages ADD COLUMN deleted_for_recipient TINYINT(1) NOT NULL DEFAULT 0");
  } catch (e) {}
  try {
    await query("ALTER TABLE messages ADD COLUMN deleted_for_everyone TINYINT(1) NOT NULL DEFAULT 0");
  } catch (e) {}

  try {
    await query("UPDATE messages SET deleted_for_sender = 0 WHERE deleted_for_sender IS NULL");
    await query("UPDATE messages SET deleted_for_recipient = 0 WHERE deleted_for_recipient IS NULL");
    await query("UPDATE messages SET deleted_for_everyone = 0 WHERE deleted_for_everyone IS NULL");
  } catch (e) {}
}

async function messages(chatId, readerUserId) {
  const numericChatId = Number(chatId);
  const numericReaderId = Number(readerUserId);

  await initMessagesDeletionSchema();

  await query(
    `UPDATE messages
     SET delivery_status = 'read'
     WHERE chat_id = :numericChatId
       AND sender_id <> :numericReaderId
       AND delivery_status NOT IN ('read', 'undelivered')`,
    { numericChatId, numericReaderId }
  );

  return query(
    `SELECT 
       id, 
       sender_id AS senderId, 
       IF(COALESCE(deleted_for_everyone, 0) = 1, '🚫 This message was deleted', body) AS text, 
       type, 
       delivery_status AS deliveryStatus,
       COALESCE(deleted_for_everyone, 0) AS deletedForEveryone,
       DATE_FORMAT(created_at, "%l:%i %p") AS timestamp 
     FROM messages 
     WHERE chat_id = :numericChatId
       AND (
         (sender_id = :numericReaderId AND COALESCE(deleted_for_sender, 0) = 0)
         OR
         (sender_id <> :numericReaderId AND COALESCE(deleted_for_recipient, 0) = 0 AND delivery_status <> 'undelivered')
       )
     ORDER BY created_at ASC`,
    { numericChatId, numericReaderId }
  );
}

async function deleteMessage(messageId, userId, deleteType = 'me') {
  await initMessagesDeletionSchema();

  const numMsgId = Number(messageId);
  const numUserId = Number(userId);

  const msgRows = await query('SELECT id, chat_id, sender_id FROM messages WHERE id = :numMsgId LIMIT 1', { numMsgId });
  const msg = msgRows[0];
  if (!msg) throw new AppError('Message not found', 404);

  const chatRows = await query('SELECT user_one_id, user_two_id FROM chats WHERE id = :chatId LIMIT 1', { chatId: msg.chat_id });
  const chat = chatRows[0];
  if (!chat) throw new AppError('Chat not found', 404);

  const isUserOne = Number(chat.user_one_id) === numUserId;
  const isUserTwo = Number(chat.user_two_id) === numUserId;
  if (!isUserOne && !isUserTwo) {
    throw new AppError('Unauthorized to delete this message', 403);
  }

  if (deleteType === 'everyone') {
    await query(
      `UPDATE messages 
       SET deleted_for_everyone = 1, body = '🚫 This message was deleted' 
       WHERE id = :numMsgId`,
      { numMsgId }
    );
  } else {
    const isSender = Number(msg.sender_id) === numUserId;
    if (isSender) {
      await query('UPDATE messages SET deleted_for_sender = 1 WHERE id = :numMsgId', { numMsgId });
    } else {
      await query('UPDATE messages SET deleted_for_recipient = 1 WHERE id = :numMsgId', { numMsgId });
    }
  }

  return { id: numMsgId, deleteType };
}

async function sendMessage(chatId, senderId, body, type = 'text') {
  // Requirement 14: Block digits/numbers in chat messages
  if (type === 'text') {
    const hasDigits = /\d/.test(body);
    if (hasDigits) {
      throw new AppError('Sharing digits or contact numbers is strictly prohibited in chat.', 400);
    }
  }

  try {
    await query("ALTER TABLE messages MODIFY COLUMN delivery_status ENUM('sent','delivered','read','undelivered') NOT NULL DEFAULT 'sent'");
  } catch (e) {}

  const chatRows = await query('SELECT user_one_id, user_two_id FROM chats WHERE id = :chatId LIMIT 1', { chatId });
  const chat = chatRows[0];
  if (!chat) throw new AppError('Chat not found', 404);
  const recipientUserId = Number(chat.user_one_id) === Number(senderId) ? chat.user_two_id : chat.user_one_id;

  let messageId;
  let deliveryStatus = 'sent';
  let rechargeExhausted = false;
  let remainingCoins = null;

  await transaction(async (connection) => {
    // Check sender gender
    const [senders] = await connection.execute('SELECT id, name, gender, coins FROM users WHERE id = :senderId LIMIT 1 FOR UPDATE', { senderId });
    const sender = senders[0];
    const isMalePayer = ['male', 'man', 'boy', 'men'].includes(String(sender?.gender || '').toLowerCase());

    if (isMalePayer) {
      const COIN_COST = type === 'say_hi' ? 5 : 10;
      const currentCoins = Number(sender.coins || 0);

      if (currentCoins < COIN_COST) {
        throw new AppError('Recharge khatam ho gaya. Message deliver nahi hua.', 400);
      }

      remainingCoins = Math.max(0, currentCoins - COIN_COST);
      if (remainingCoins < 5) {
        rechargeExhausted = true;
      }

      // Deduct COIN_COST from male sender (updates existing today's record or creates 1 record per day)
      await connection.execute('UPDATE users SET coins = GREATEST(coins - :cost, 0) WHERE id = :senderId', { cost: COIN_COST, senderId });
      await connection.execute(
        `INSERT INTO wallets (user_id, balance, total_spent) VALUES (:senderId, 0, :cost)
         ON DUPLICATE KEY UPDATE balance = GREATEST(balance - :cost, 0), total_spent = total_spent + :cost`,
        { senderId, cost: COIN_COST }
      );
      await recordOrUpdateDailyWalletTransaction(connection, {
        userId: senderId,
        type: 'chat_charge',
        title: type === 'say_hi' ? 'Say Hi Sent' : 'Message Sent',
        description: type === 'say_hi' ? `Say Hi in chat #${chatId}` : `Message in chat #${chatId}`,
        coins: -COIN_COST
      });

      // Credit COIN_COST to female recipient if applicable
      if (recipientUserId) {
        const [recipients] = await connection.execute('SELECT id, gender FROM users WHERE id = :recipientUserId LIMIT 1 FOR UPDATE', { recipientUserId });
        const recipient = recipients[0];
        const isFemaleEarner = ['female', 'woman', 'girl', 'women'].includes(String(recipient?.gender || '').toLowerCase());

        if (isFemaleEarner) {
          const EARNING_COINS = COIN_COST;
          await connection.execute('UPDATE users SET coins = coins + :earn, earnings = earnings + :earn WHERE id = :recipientUserId', { earn: EARNING_COINS, recipientUserId });
          await connection.execute(
            `INSERT INTO wallets (user_id, balance, total_earned, withdrawal_balance)
             VALUES (:recipientUserId, :earn, :earn, :earn)
             ON DUPLICATE KEY UPDATE balance = balance + :earn, total_earned = total_earned + :earn, withdrawal_balance = withdrawal_balance + :earn`,
            { recipientUserId, earn: EARNING_COINS }
          );
          await recordOrUpdateDailyWalletTransaction(connection, {
            userId: recipientUserId,
            type: 'earning',
            title: 'Message Received Earning',
            description: `Earned coins from message in chat #${chatId}`,
            coins: EARNING_COINS
          });
        }
      }
    }

    const [msgRes] = await connection.execute(
      'INSERT INTO messages (chat_id, sender_id, body, type, delivery_status) VALUES (:chatId, :senderId, :body, :type, :deliveryStatus)',
      { chatId, senderId, body, type, deliveryStatus }
    );
    messageId = msgRes.insertId;

    await connection.execute('UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = :chatId', { chatId });
  });

  return {
    id: messageId,
    senderId,
    text: body,
    type,
    deliveryStatus,
    rechargeExhausted,
    remainingCoins,
    notice: rechargeExhausted ? 'Recharge khatam ho gaya' : undefined
  };
}


async function startChatSession(chatId, payerUserId, earnerUserId, settings, callType = 'chat') {
  const isVideo = String(callType).toLowerCase().includes('video');
  const chargePerMinute = Number(isVideo ? (settings.videoCallChargePerMinute || 100) : (settings.chatChargePerMinute || 10));
  const earnerShare = Number(isVideo ? (settings.femaleVideoEarningPerMinute || 50) : (settings.earnerSharePerMinute || 7));
  const platformShare = Number(chargePerMinute - earnerShare);
  const existing = await query('SELECT * FROM chat_sessions WHERE chat_id = :chatId AND status = "active" LIMIT 1', { chatId });
  if (existing[0]) return existing[0];

  const result = await query(
    `INSERT INTO chat_sessions (chat_id, payer_user_id, earner_user_id, charge_per_minute, earner_share, platform_share, call_type)
     VALUES (:chatId, :payerUserId, :earnerUserId, :chargePerMinute, :earnerShare, :platformShare, :callType)`,
    { chatId, payerUserId, earnerUserId, chargePerMinute, earnerShare, platformShare, callType }
  );

  // Notify the girl that a paid session has started
  const [payerRows] = await query('SELECT name FROM users WHERE id = :id LIMIT 1', { id: payerUserId }).then((r) => [r]);
  const payerName = payerRows[0]?.name || 'Someone';
  await notificationModel.create({
    userId: earnerUserId,
    actorUserId: payerUserId,
    type: 'chat_session_started',
    title: 'Paid Chat Started',
    message: `${payerName} started a paid chat with you. You earn ${earnerShare} coins per message.`,
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

    const isVideoCall = Math.abs(charge) >= 100 || String(session.call_type || '').toLowerCase().includes('video');
    const payerTitle = isVideoCall ? 'Video Call (1 min) Charged' : 'Chat Minute Charged';
    const earnerTitle = isVideoCall ? 'Video Call (1 min) Earning' : 'Chat Minute Earning';
    const descText = isVideoCall ? `Video Call session #${session.id}` : `Chat session #${session.id}`;

    // Update daily wallet transactions for both users (1 day = 1 record accumulated)
    await recordOrUpdateDailyWalletTransaction(connection, {
      userId: session.payer_user_id,
      type: 'chat_charge',
      title: isVideoCall ? 'Video Call Daily Usage' : 'Chat Minute Daily Usage',
      description: descText,
      coins: -charge
    });

    await recordOrUpdateDailyWalletTransaction(connection, {
      userId: session.earner_user_id,
      type: 'earning',
      title: isVideoCall ? 'Video Call Daily Earnings' : 'Chat Minute Daily Earnings',
      description: descText,
      coins: earnerShare
    });

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

async function ensureFollowsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS user_follows (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        follower_id BIGINT UNSIGNED NOT NULL,
        following_id BIGINT UNSIGNED NOT NULL,
        status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_follow (follower_id, following_id),
        CONSTRAINT fk_follows_follower FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_follows_following FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    const cols = await query("SHOW COLUMNS FROM user_follows LIKE 'status'");
    if (!cols || cols.length === 0) {
      await query("ALTER TABLE user_follows ADD COLUMN status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending' AFTER following_id");
    }
  } catch (e) {}
}

async function toggleFollow(followerId, targetUserId) {
  await ensureFollowsTable();
  const fId = Number(followerId);
  const tId = Number(targetUserId);

  if (fId === tId) {
    throw new AppError('You cannot follow yourself', 400);
  }

  const existing = await query(
    'SELECT id, status FROM user_follows WHERE follower_id = :fId AND following_id = :tId LIMIT 1',
    { fId, tId }
  );

  let status = 'none';

  if (existing.length) {
    await query('DELETE FROM user_follows WHERE follower_id = :fId AND following_id = :tId', { fId, tId });
    status = 'none';
  } else {
    await query('INSERT INTO user_follows (follower_id, following_id, status) VALUES (:fId, :tId, "pending")', { fId, tId });
    status = 'pending';

    try {
      const followerRows = await query('SELECT name FROM users WHERE id = :fId LIMIT 1', { fId });
      const followerName = followerRows?.[0]?.name || 'Someone';
      await notificationModel.create(
        tId,
        fId,
        'follow_request',
        'Follow Request 💖',
        `${followerName} requested to follow you.`,
        `/user/notifications`
      );
    } catch (e) {}
  }

  const stats = await getFollowStats(tId);
  return {
    status,
    following: status === 'accepted',
    isPending: status === 'pending',
    followerCount: stats.followerCount,
    followingCount: stats.followingCount
  };
}

async function getFollowStatus(followerId, targetUserId) {
  await ensureFollowsTable();
  const fId = Number(followerId);
  const tId = Number(targetUserId);
  const rows = await query(
    'SELECT id, status FROM user_follows WHERE follower_id = :fId AND following_id = :tId LIMIT 1',
    { fId, tId }
  );
  const status = rows.length ? rows[0].status : 'none';
  const stats = await getFollowStats(tId);
  return {
    status,
    following: status === 'accepted',
    isPending: status === 'pending',
    followerCount: stats.followerCount,
    followingCount: stats.followingCount
  };
}

async function respondFollowRequest(targetUserId, requestId, action) {
  await ensureFollowsTable();
  const tId = Number(targetUserId);
  const reqId = Number(requestId);

  const reqRows = await query(
    'SELECT id, follower_id, following_id FROM user_follows WHERE id = :reqId AND following_id = :tId LIMIT 1',
    { reqId, tId }
  );

  if (!reqRows.length) {
    throw new AppError('Follow request not found', 404);
  }

  const req = reqRows[0];
  const followerId = req.follower_id;

  if (action === 'accept') {
    await query("UPDATE user_follows SET status = 'accepted' WHERE id = :reqId", { reqId });

    try {
      const targetRows = await query('SELECT name FROM users WHERE id = :tId LIMIT 1', { tId });
      const targetName = targetRows?.[0]?.name || 'User';
      await notificationModel.create(
        followerId,
        tId,
        'follow_accepted',
        'Follow Request Accepted! 🎉',
        `${targetName} accepted your follow request.`,
        `/user/chat/${tId}`
      );
    } catch (e) {}

    return { success: true, status: 'accepted' };
  } else {
    await query('DELETE FROM user_follows WHERE id = :reqId', { reqId });
    return { success: true, status: 'none' };
  }
}

async function getFollowRequests(targetUserId) {
  await ensureFollowsTable();
  const tId = Number(targetUserId);
  return query(
    `SELECT uf.id AS requestId, uf.status, uf.created_at AS createdAt,
            u.id AS userId, u.name, u.unique_id AS uniqueId, COALESCE(pp.url, '') AS photo
     FROM user_follows uf
     JOIN users u ON u.id = uf.follower_id
     LEFT JOIN profiles p ON p.user_id = u.id
     LEFT JOIN profile_photos pp ON pp.profile_id = p.id AND pp.sort_order = 0
     WHERE uf.following_id = :tId AND uf.status = 'pending'
     ORDER BY uf.created_at DESC`,
    { tId }
  );
}

async function getFollowStats(userId) {
  await ensureFollowsTable();
  const uId = Number(userId);
  const followers = await query("SELECT COUNT(*) AS count FROM user_follows WHERE following_id = :uId AND status = 'accepted'", { uId });
  const following = await query("SELECT COUNT(*) AS count FROM user_follows WHERE follower_id = :uId AND status = 'accepted'", { uId });
  return {
    followerCount: Number(followers?.[0]?.count || 0),
    followingCount: Number(following?.[0]?.count || 0)
  };
}

async function getFollowingList(userId, viewerId) {
  await ensureFollowsTable();
  const uId = Number(userId);
  const vId = viewerId ? Number(viewerId) : uId;
  return query(
    `SELECT u.id, u.name, u.unique_id AS uniqueId, COALESCE(pp.url, '') AS photo,
            uf.id AS requestId, uf.status, uf.created_at AS createdAt,
            (u.online_status = true AND u.last_seen_at >= DATE_SUB(NOW(), INTERVAL 2 MINUTE)) AS online,
            COALESCE(my_f.status, 'none') AS myFollowStatus
     FROM user_follows uf
     JOIN users u ON u.id = uf.following_id
     LEFT JOIN profiles p ON p.user_id = u.id
     LEFT JOIN profile_photos pp ON pp.profile_id = p.id AND pp.sort_order = 0
     LEFT JOIN user_follows my_f ON my_f.follower_id = :vId AND my_f.following_id = u.id
     WHERE uf.follower_id = :uId AND uf.status = 'accepted'
     ORDER BY uf.created_at DESC`,
    { uId, vId }
  );
}

async function getFollowersList(userId, viewerId) {
  await ensureFollowsTable();
  const uId = Number(userId);
  const vId = viewerId ? Number(viewerId) : uId;
  return query(
    `SELECT u.id, u.name, u.unique_id AS uniqueId, COALESCE(pp.url, '') AS photo,
            uf.id AS requestId, uf.status, uf.created_at AS createdAt,
            (u.online_status = true AND u.last_seen_at >= DATE_SUB(NOW(), INTERVAL 2 MINUTE)) AS online,
            COALESCE(my_f.status, 'none') AS myFollowStatus
     FROM user_follows uf
     JOIN users u ON u.id = uf.follower_id
     LEFT JOIN profiles p ON p.user_id = u.id
     LEFT JOIN profile_photos pp ON pp.profile_id = p.id AND pp.sort_order = 0
     LEFT JOIN user_follows my_f ON my_f.follower_id = :vId AND my_f.following_id = u.id
     WHERE uf.following_id = :uId AND uf.status = 'accepted'
     ORDER BY uf.created_at DESC`,
    { uId, vId }
  );
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
  deleteMessage,
  sendMessage,
  startChatSession,
  chargeChatMinute,
  endChatSession,
  activeChatSession,
  dueChatSessions,
  toggleFollow,
  getFollowStatus,
  respondFollowRequest,
  getFollowRequests,
  getFollowStats,
  getFollowingList,
  getFollowersList,
  togglePinChat
};
