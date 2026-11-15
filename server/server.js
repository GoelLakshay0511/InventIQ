const path = require('path');
// Load .env from server/ directory and root directory fallback
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const http = require('http');
const app = require('./app');
const { connectDB } = require('./src/config/db');
const { initCronJobs } = require('./src/jobs/cron/nightlyForecast');

const PORT = process.env.PORT || 5001;

async function startServer() {
  await connectDB();
  initCronJobs();
  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`🚀 InventIQ server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}

startServer();
