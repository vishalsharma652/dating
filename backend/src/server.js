const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const app = require('./app');
const env = require('./config/env');
const { pool } = require('./config/db');
const { startChatBillingScheduler } = require('./services/chatBillingScheduler');
const { setupCallSignaling } = require('./services/callSignaling');

async function start() {
  await pool.query('SELECT 1');
  try {
    await pool.query('ALTER TABLE users ADD COLUMN kyc_document_url TEXT NULL');
  } catch {}
  try {
    await pool.query("UPDATE users SET status = 'active' WHERE status = 'inactive'");
  } catch {}
  try {
    await pool.query(`
      DELETE FROM coin_packages;
    `);
    await pool.query(`
      INSERT INTO coin_packages (id, name, coins, price, bonus, popular, active) VALUES
      (1, '50 Coins Pack', 50, 250.00, 0, FALSE, TRUE),
      (2, '100 Coins Pack', 100, 550.00, 0, TRUE, TRUE),
      (3, '200 Coins Pack', 200, 1150.00, 0, FALSE, TRUE),
      (4, '400 Coins VIP Pack', 400, 2350.00, 0, TRUE, TRUE),
      (5, '1000 Coins Royal Pack', 1000, 6500.00, 0, FALSE, TRUE)
      ON DUPLICATE KEY UPDATE coins = VALUES(coins), price = VALUES(price), bonus = VALUES(bonus), popular = VALUES(popular), active = TRUE
    `);
  } catch (err) {
    console.error('Coin packages seed error:', err);
  }


  // Create HTTP server so Socket.IO can share the same port as Express
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.nodeEnv === 'production' ? [env.appUrl] : '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Prefer WebSocket, fall back to polling
    transports: ['websocket', 'polling'],
  });

  setupCallSignaling(io);
  startChatBillingScheduler();

  httpServer.listen(env.port, () => {
    console.log(`Ember API listening on ${env.apiUrl}`);
    console.log(`Socket.IO signaling active on ws://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start API:', error);
  process.exit(1);
});
