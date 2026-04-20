import cron from 'node-cron';

// Configuration
const SYNC_URL = 'http://127.0.0.1:3000/api/stats?sync=true';
const INTERVAL = '*/20 * * * *'; // Every 20 minutes

console.log('--- LifeWrapped Worker Started ---');
console.log(`Schedule: ${INTERVAL}`);
console.log(`target: ${SYNC_URL}`);

// The task
const syncTask = async () => {
  const now = new Date().toLocaleString();
  console.log(`[${now}] Triggering sync...`);
  
  try {
    const response = await fetch(SYNC_URL);
    if (response.ok) {
      const data = await response.json();
      console.log(`[${now}] Sync success.`);
    } else {
      console.log(`[${now}] Sync failed with status: ${response.status}`);
      console.log('Tip: Make sure the Next.js server (npm run dev) is running at http://localhost:3000');
    }
  } catch (error) {
    console.error(`[${now}] Connection error:`, error.message);
    console.log('Tip: Is the Next.js server running?');
  }
};

// Start the cron
cron.schedule(INTERVAL, syncTask);

// Initial run
syncTask();
