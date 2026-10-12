import { processDueWorkflows } from '../services/scheduler.js';

// @desc    Dispatches due bot tasks (called by Vercel Cron or manual tick)
// @route   POST /api/cron/dispatch
export const dispatchCronTasks = async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  const querySecret = req.query.secret;

  // Verify CRON_SECRET if configured and not running in open local dev testing
  if (cronSecret && process.env.NODE_ENV === 'production') {
    const isHeaderValid = authHeader === `Bearer ${cronSecret}`;
    const isQueryValid = querySecret === cronSecret;

    if (!isHeaderValid && !isQueryValid) {
      return res.status(401).json({ error: 'Unauthorized cron dispatch' });
    }
  }

  try {
    const result = await processDueWorkflows();
    return res.status(200).json({
      message: 'Cron orchestrator tick executed',
      dispatchedCount: result.dispatchedCount,
      results: result.results,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron Dispatch Error]', error);
    return res.status(500).json({ error: error.message });
  }
};
