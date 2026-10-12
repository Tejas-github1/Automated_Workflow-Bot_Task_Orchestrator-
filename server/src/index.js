import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';
import { seedDemoData } from './seed.js';
import { startLocalScheduler } from './services/scheduler.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    console.log('----------------------------------------------------');
    console.log('🤖 Starting iBots Automated Workflow Orchestrator API');
    console.log('----------------------------------------------------');

    await connectDB();
    await seedDemoData(true);

    // In local development, launch the background scheduler loop (runs every 15s)
    startLocalScheduler(15000);

    app.listen(PORT, () => {
      console.log(`🚀 API Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`⏱️  Cron Endpoint: http://localhost:${PORT}/api/cron/dispatch`);
      console.log('----------------------------------------------------');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

bootstrap();
