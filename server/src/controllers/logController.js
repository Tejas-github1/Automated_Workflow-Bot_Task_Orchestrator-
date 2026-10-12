import ExecutionLog from '../models/ExecutionLog.js';
import Workflow from '../models/Workflow.js';

// @desc    Get execution logs (visual timeline feed)
// @route   GET /api/logs
export const getExecutionLogs = async (req, res) => {
  try {
    const { workflowId, status, limit = 50 } = req.query;

    const query = { user: req.user._id };

    if (workflowId) {
      query.workflow = workflowId;
    }

    if (status && ['SUCCESS', 'FAILURE', 'TIMEOUT'].includes(status.toUpperCase())) {
      query.status = status.toUpperCase();
    }

    const logs = await ExecutionLog.find(query)
      .sort({ executedAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 50, 100))
      .populate('workflow', 'title taskType config scheduleIntervalMinutes')
      .lean();

    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Get aggregated telemetry metrics for dashboard cards
// @route   GET /api/logs/stats
export const getTelemetryStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalWorkflows, activeWorkflows, totalExecutions, successfulExecutions, recentDurationStats] =
      await Promise.all([
        Workflow.countDocuments({ user: userId }),
        Workflow.countDocuments({ user: userId, isActive: true }),
        ExecutionLog.countDocuments({ user: userId }),
        ExecutionLog.countDocuments({ user: userId, status: 'SUCCESS' }),
        ExecutionLog.aggregate([
          { $match: { user: userId } },
          {
            $group: {
              _id: null,
              avgDurationMs: { $avg: '$durationMs' },
              maxDurationMs: { $max: '$durationMs' },
            },
          },
        ]),
      ]);

    const successRate = totalExecutions > 0
      ? Math.round((successfulExecutions / totalExecutions) * 100)
      : 100;

    const avgDuration = recentDurationStats.length > 0
      ? Math.round(recentDurationStats[0].avgDurationMs)
      : 0;

    return res.json({
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      successRate,
      avgDurationMs: avgDuration,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
