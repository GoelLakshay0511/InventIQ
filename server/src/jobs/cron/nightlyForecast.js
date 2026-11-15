/**
 * Nightly Cron Job — runs at 11:00 PM IST every day.
 * Generates reorder suggestions for ALL active users and persists them.
 */
const cron = require('node-cron');
const { generateForecast } = require('../../services/forecasting');
const { generateWhatsAppLinks } = require('../../services/whatsapp');
const ReorderSuggestion = require('../../modules/reorder/reorder.model');
const User = require('../../modules/auth/auth.model');
const Distributor = require('../../modules/distributors/distributor.model');

/**
 * Core job logic — separated so it can also be called on-demand (e.g. in tests).
 */
async function runNightlyForecast() {
  console.log('[CRON] Starting nightly forecast job...');
  try {
    const users = await User.find({});
    console.log(`[CRON] Processing ${users.length} user(s)...`);

    for (const user of users) {
      try {
        const suggestions = await generateForecast(user._id);

        if (suggestions.length === 0) {
          console.log(`[CRON] No reorders needed for store: ${user.storeName}`);
          continue;
        }

        const distributors = await Distributor.find({ userId: user._id, isActive: true });
        const whatsappMessages = generateWhatsAppLinks(user.storeName, suggestions, distributors);

        await ReorderSuggestion.create({
          userId: user._id,
          generatedAt: new Date(),
          status: 'pending',
          items: suggestions,
          whatsappMessages,
        });

        console.log(
          `[CRON] Forecast saved for "${user.storeName}" — ${suggestions.length} item(s) flagged`
        );
      } catch (userErr) {
        // Per-user errors are logged but don't abort the whole job
        console.error(`[CRON] Error processing user ${user._id} (${user.storeName}):`, userErr.message);
      }
    }

    console.log('[CRON] Nightly forecast complete.');
  } catch (fatalErr) {
    console.error('[CRON] Fatal error in nightly forecast job:', fatalErr);
  }
}

/**
 * Register all cron schedules.
 * Called once from server.js after DB is connected.
 */
function initCronJobs() {
  // 11:00 PM IST = 17:30 UTC → cron expression in UTC for node-cron
  // Passing timezone option keeps it readable in IST
  cron.schedule('0 23 * * *', runNightlyForecast, {
    timezone: 'Asia/Kolkata',
  });

  console.log('[CRON] Nightly forecast job scheduled (11:00 PM IST / Asia/Kolkata)');
}

module.exports = { initCronJobs, runNightlyForecast };
