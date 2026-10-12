import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Workflow from './models/Workflow.js';
import ExecutionLog from './models/ExecutionLog.js';

export async function seedDemoData(silent = false) {
  try {
    await connectDB();

    // Check if user already exists
    let user = await User.findOne({ email: 'demo@ibots.dev' });
    if (!user) {
      user = await User.create({
        name: 'Demo Architect',
        email: 'demo@ibots.dev',
        password: 'Password123!',
        tier: 'PRO',
        maxWorkflowsAllowed: 20,
      });
      if (!silent) console.log('[Seed] Created default user: demo@ibots.dev');
    }

    // Check if workflows already exist for this user
    const existingCount = await Workflow.countDocuments({ user: user._id });
    if (existingCount === 0) {
      const createdWorkflows = await Workflow.create([
        {
          user: user._id,
          title: 'Public API Health Probe',
          description: 'Regularly pings global health check endpoint to verify network availability and response latency.',
          taskType: 'HEALTH_PING',
          config: {
            targetUrl: 'https://httpbin.org/status/200',
            expectedStatusCode: 200,
            timeoutMs: 5000,
          },
          scheduleIntervalMinutes: 2,
          isActive: true,
          currentStatus: 'IDLE',
          lastRunAt: new Date(Date.now() - 120000),
          nextRunAt: new Date(Date.now() + 60000),
        },
        {
          user: user._id,
          title: 'HackerNews Homepage Scraper',
          description: 'Extracts HTML metadata, title tags, and link counts to monitor content updates.',
          taskType: 'PAGE_SCRAPE',
          config: {
            targetUrl: 'https://news.ycombinator.com',
            timeoutMs: 8000,
          },
          scheduleIntervalMinutes: 10,
          isActive: true,
          currentStatus: 'IDLE',
          lastRunAt: new Date(Date.now() - 600000),
          nextRunAt: new Date(Date.now() + 300000),
        },
        {
          user: user._id,
          title: 'Redis Cache & Temp Tables Sanitizer',
          description: 'Audits database collections and purges expired authorization sessions and temporary records.',
          taskType: 'DATA_CLEANUP',
          config: {},
          scheduleIntervalMinutes: 15,
          isActive: true,
          currentStatus: 'IDLE',
          lastRunAt: new Date(Date.now() - 900000),
          nextRunAt: new Date(Date.now() + 450000),
        },
      ]);

      if (!silent) console.log(`[Seed] Created ${createdWorkflows.length} starter workflows`);

      // Seed initial history logs for timeline visualization
      const sampleLogs = [
        {
          workflow: createdWorkflows[0]._id,
          user: user._id,
          status: 'SUCCESS',
          statusCode: 200,
          durationMs: 142,
          output: {
            url: 'https://httpbin.org/status/200',
            statusCode: 200,
            statusText: 'OK',
            latencyMs: 142,
            contentType: 'text/html; charset=utf-8',
          },
          executedAt: new Date(Date.now() - 120000),
        },
        {
          workflow: createdWorkflows[1]._id,
          user: user._id,
          status: 'SUCCESS',
          statusCode: 200,
          durationMs: 418,
          output: {
            url: 'https://news.ycombinator.com',
            pageTitle: 'Hacker News',
            htmlSizeBytes: 34102,
            hyperlinkCount: 94,
            imageCount: 3,
          },
          executedAt: new Date(Date.now() - 600000),
        },
        {
          workflow: createdWorkflows[2]._id,
          user: user._id,
          status: 'SUCCESS',
          statusCode: 200,
          durationMs: 210,
          output: {
            task: 'Database & Cache Maintenance',
            recordsAudited: 420,
            expiredTokensPurged: 18,
            orphanedLogsRemoved: 35,
            memoryReclaimedKb: 2048,
          },
          executedAt: new Date(Date.now() - 900000),
        },
      ];

      await ExecutionLog.insertMany(sampleLogs);
      if (!silent) console.log(`[Seed] Created ${sampleLogs.length} initial execution logs for timeline`);
    }

    if (!silent) console.log('[Seed] Database initialization complete!');
  } catch (err) {
    if (!silent) console.warn('[Seed] Warning during database seeding:', err.message);
  }
}

// Standalone execution check
if (process.argv[1]?.endsWith('seed.js')) {
  seedDemoData(false).then(() => {
    mongoose.connection.close();
    process.exit(0);
  });
}
