const { query } = require('../config/db');

const DEFAULTS = {
  coin_rate_inr: '0.70',
  chat_charge_per_minute: '10',
  female_earning_per_minute: '7',
  platform_commission_per_minute: '3'
};

async function all() {
  const rows = await query('SELECT setting_key, setting_value FROM settings ORDER BY setting_key ASC');
  return { ...DEFAULTS, ...Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value])) };
}

async function chatSettings() {
  const settings = await all();
  const chatChargePerMinute = Number(settings.chat_charge_per_minute || DEFAULTS.chat_charge_per_minute);
  const earnerSharePerMinute = Number(settings.female_earning_per_minute || DEFAULTS.female_earning_per_minute);
  const configuredPlatformShare = Number(settings.platform_commission_per_minute || DEFAULTS.platform_commission_per_minute);
  const platformSharePerMinute = Number.isFinite(configuredPlatformShare)
    ? configuredPlatformShare
    : chatChargePerMinute - earnerSharePerMinute;

  return {
    coinRateInr: Number(settings.coin_rate_inr || DEFAULTS.coin_rate_inr),
    chatChargePerMinute,
    earnerSharePerMinute,
    platformSharePerMinute
  };
}

async function upsert(key, value) {
  await query(
    `INSERT INTO settings (setting_key, setting_value) VALUES (:key, :value)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    { key, value }
  );
  return { key, value };
}

module.exports = { all, chatSettings, upsert };
