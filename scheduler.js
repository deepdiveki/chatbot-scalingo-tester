// scheduler.js
require('dotenv').config();
const cron = require('node-cron');
const { spawn } = require('child_process');

const ENABLE = String(process.env.ENABLE_CRON || '').toLowerCase() === 'true';
const SCHEDULE = process.env.CRON_SCHEDULE || '15 3 * * *';

function runCrawl() {
  console.log(`[${new Date().toISOString()}] Starting crawl...`);
  const child = spawn(process.execPath, ['crawler.js'], {
    env: process.env,
    stdio: 'inherit' // direkt in die App-Logs schreiben
  });
  child.on('close', (code) => {
    console.log(`[${new Date().toISOString()}] Crawl finished with code ${code}`);
  });
}

if (ENABLE) {
  // einmal beim Start direkt crawlen? (optional)
  // runCrawl();

  // Cron: täglich
  cron.schedule(SCHEDULE, () => runCrawl(), {
    timezone: process.env.TZ || 'Europe/Berlin'
  });

  console.log(`Cron aktiviert: "${SCHEDULE}" (TZ=${process.env.TZ || 'Europe/Berlin'})`);
} else {
  console.log('Cron deaktiviert (ENABLE_CRON != true)');
}

module.exports = { runCrawl };