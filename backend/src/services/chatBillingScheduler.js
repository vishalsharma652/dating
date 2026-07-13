const socialModel = require('../models/socialModel');

let timer;
let running = false;

async function billDueChatSessions() {
  if (running) {
    console.warn('[Billing] Previous billing cycle still running — skipping this tick');
    return;
  }
  running = true;
  try {
    const sessions = await socialModel.dueChatSessions();
    if (sessions.length > 0) {
      console.log(`[Billing] Processing ${sessions.length} due chat session(s)`);
    }
    await Promise.all(
      sessions.map((session) =>
        socialModel.chargeChatMinute(session.id).catch((err) => {
          console.error(`[Billing] Failed to charge session #${session.id}:`, err.message, err.stack);
        })
      )
    );
  } finally {
    running = false;
  }
}

function startChatBillingScheduler() {
  if (timer) return;
  console.log('[Billing] Chat billing scheduler started — running every 60 seconds');
  timer = setInterval(() => {
    billDueChatSessions().catch((error) =>
      console.error('[Billing] Scheduler tick failed:', error.message, error.stack)
    );
  }, 60 * 1000);
  // Run immediately on startup to catch any sessions already overdue
  billDueChatSessions().catch((error) =>
    console.error('[Billing] Initial billing check failed:', error.message, error.stack)
  );
}

module.exports = { startChatBillingScheduler, billDueChatSessions };
