import Workflow from '../models/Workflow.js';
import ExecutionLog from '../models/ExecutionLog.js';
import { runBotTask } from './botRunner.js';

/**
 * Core orchestrator routine: scans for due workflows, executes them,
 * records telemetry to ExecutionLogs, and updates schedule markers.
 */
export async function processDueWorkflows() {
  const now = new Date();

  // Find up to 10 due workflows to avoid overwhelming memory
  const dueWorkflows = await Workflow.find({
    isActive: true,
    nextRunAt: { $lte: now },
    $or: [
      { currentStatus: { $ne: 'RUNNING' } },
      { lockedAt: { $lt: new Date(now.getTime() - 60000) } }, // Auto-break stale lock (>60s)
    ],
  }).limit(10);

  if (!dueWorkflows.length) {
    return { dispatchedCount: 0, results: [] };
  }

  const results = await Promise.allSettled(
    dueWorkflows.map(async (workflow) => {
      // Optimistic lock
      workflow.currentStatus = 'RUNNING';
      workflow.lockedAt = now;
      await workflow.save();

      const startTime = Date.now();
      let status = 'SUCCESS';
      let statusCode = null;
      let output = null;
      let errorMessage = null;

      try {
        const result = await runBotTask(workflow);
        statusCode = result.statusCode || 200;
        output = result.data;
      } catch (err) {
        status = 'FAILURE';
        errorMessage = err.message || 'Unknown bot error';
      }

      const durationMs = Date.now() - startTime;

      // Persist ExecutionLog
      const log = await ExecutionLog.create({
        workflow: workflow._id,
        user: workflow.user,
        status,
        statusCode,
        durationMs,
        output,
        errorMessage,
        executedAt: new Date(),
      });

      // Update Workflow schedule & release lock
      const nextInterval = workflow.scheduleIntervalMinutes || 5;
      workflow.lastRunAt = new Date();
      workflow.nextRunAt = new Date(Date.now() + nextInterval * 60000);
      workflow.currentStatus = status === 'SUCCESS' ? 'IDLE' : 'FAILED';
      workflow.lockedAt = null;
      await workflow.save();

      return {
        workflowId: workflow._id,
        title: workflow.title,
        status,
        durationMs,
        logId: log._id,
      };
    })
  );

  return {
    dispatchedCount: dueWorkflows.length,
    results: results.map((r) => (r.status === 'fulfilled' ? r.value : { error: r.reason?.message })),
  };
}

/**
 * Executes a single workflow immediately on-demand
 */
export async function executeWorkflowImmediately(workflowId) {
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    throw new Error('Workflow not found');
  }

  const startTime = Date.now();
  let status = 'SUCCESS';
  let statusCode = null;
  let output = null;
  let errorMessage = null;

  workflow.currentStatus = 'RUNNING';
  await workflow.save();

  try {
    const result = await runBotTask(workflow);
    statusCode = result.statusCode || 200;
    output = result.data;
  } catch (err) {
    status = 'FAILURE';
    errorMessage = err.message || 'Execution error';
  }

  const durationMs = Date.now() - startTime;

  const log = await ExecutionLog.create({
    workflow: workflow._id,
    user: workflow.user,
    status,
    statusCode,
    durationMs,
    output,
    errorMessage,
    executedAt: new Date(),
  });

  const nextInterval = workflow.scheduleIntervalMinutes || 5;
  workflow.lastRunAt = new Date();
  workflow.nextRunAt = new Date(Date.now() + nextInterval * 60000);
  workflow.currentStatus = status === 'SUCCESS' ? 'IDLE' : 'FAILED';
  workflow.lockedAt = null;
  await workflow.save();

  return { workflow, log };
}

/**
 * Local in-process scheduler daemon for development mode
 */
let timerId = null;
export function startLocalScheduler(intervalMs = 15000) {
  if (timerId) return;

  console.log(`[Scheduler] Local development daemon started (scanning every ${intervalMs / 1000}s)`);
  timerId = setInterval(async () => {
    try {
      const summary = await processDueWorkflows();
      if (summary.dispatchedCount > 0) {
        console.log(`[Scheduler] Dispatched ${summary.dispatchedCount} scheduled workflow task(s)`);
      }
    } catch (err) {
      console.error('[Scheduler Error]', err.message);
    }
  }, intervalMs);
}
