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
      INSERT INTO coin_packages (name, coins, price, bonus, popular) VALUES
      ('Basic', 250, 50.00, 0, FALSE),
      ('Popular', 600, 100.00, 0, TRUE),
      ('Pro', 1250, 200.00, 0, FALSE),
      ('VIP', 2500, 400.00, 0, FALSE)
      ON DUPLICATE KEY UPDATE coins = VALUES(coins), price = VALUES(price), bonus = VALUES(bonus), popular = VALUES(popular), active = TRUE
    `);
    await pool.query("UPDATE coin_packages SET active = FALSE WHERE name NOT IN ('Basic', 'Popular', 'Pro', 'VIP')");
  } catch {}


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
