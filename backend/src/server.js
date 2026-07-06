const app = require('./app');
const env = require('./config/env');
const { pool } = require('./config/db');

async function start() {
  await pool.query('SELECT 1');
  app.listen(env.port, () => {
    console.log(`Ember API listening on ${env.apiUrl}`);
  });
}

start().catch((error) => {
  console.error('Failed to start API:', error);
  process.exit(1);
});
