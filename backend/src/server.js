const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const app = require('./app');
const env = require('./config/env');
const { pool } = require('./config/db');
const { startChatBillingScheduler } = require('./services/chatBillingScheduler');
const { setupCallSignaling } = require('./services/callSignaling');

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connected successfully.');
  } catch (err) {
    console.error('Database connection warning:', err?.message || err);
  }

  try {
    await pool.query('ALTER TABLE users ADD COLUMN kyc_document_url TEXT NULL');
  } catch {}
  try {
    await pool.query("UPDATE users SET status = 'active' WHERE status = 'inactive'");
  } catch {}
  try {
    await pool.query(`
      INSERT INTO coin_packages (id, name, coins, price, bonus, popular, active) VALUES
      (1, '50 Coins Pack', 50, 250.00, 0, FALSE, TRUE),
      (2, '100 Coins Pack', 100, 550.00, 0, TRUE, TRUE),
      (3, '200 Coins Pack', 200, 1150.00, 0, FALSE, TRUE),
      (4, '400 Coins VIP Pack', 400, 2350.00, 0, TRUE, TRUE),
      (5, '1000 Coins Royal Pack', 1000, 6500.00, 0, FALSE, TRUE)
      ON DUPLICATE KEY UPDATE name = VALUES(name), coins = VALUES(coins), price = VALUES(price), bonus = VALUES(bonus), popular = VALUES(popular), active = TRUE
    `);
    await pool.query("UPDATE coin_packages SET active = FALSE WHERE id NOT IN (1, 2, 3, 4, 5)");
  } catch (err) {
    console.error('Coin packages seed error:', err);
  }

  // Create HTTP server so Socket.IO can share the same port as Express
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  try {
    setupCallSignaling(io);
  } catch (e) {
    console.error('Call signaling setup error:', e);
  }

  try {
    startChatBillingScheduler();
  } catch (e) {
    console.error('Chat billing scheduler error:', e);
  }

  httpServer.listen(env.port, () => {
    console.log(`Saathika API listening on port ${env.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start API:', error);
});
