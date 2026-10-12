import Workflow from '../models/Workflow.js';
import ExecutionLog from '../models/ExecutionLog.js';
import { executeWorkflowImmediately } from '../services/scheduler.js';

// @desc    Get all workflows for the authenticated user
// @route   GET /api/workflows
export const getWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json(workflows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Get a single workflow by ID
// @route   GET /api/workflows/:id
export const getWorkflowById = async (req, res) => {
  try {
    const workflow = await Workflow.findOne({ _id: req.params.id, user: req.user._id });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    return res.json(workflow);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Create a new bot workflow
// @route   POST /api/workflows
export const createWorkflow = async (req, res) => {
  try {
    const { title, description, taskType, config, scheduleIntervalMinutes } = req.body;

    const count = await Workflow.countDocuments({ user: req.user._id });
    if (count >= (req.user.maxWorkflowsAllowed || 20)) {
      return res.status(400).json({
        error: `Workflow limit reached (${req.user.maxWorkflowsAllowed || 20}). Upgrade tier for more bots.`,
      });
    }

    const workflow = await Workflow.create({
      user: req.user._id,
      title,
      description,
      taskType,
      config: config || {},
      scheduleIntervalMinutes: scheduleIntervalMinutes || 5,
      nextRunAt: new Date(), // Ready to execute immediately
      isActive: true,
      currentStatus: 'IDLE',
    });

    return res.status(201).json(workflow);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// @desc    Update an existing workflow
// @route   PUT /api/workflows/:id
export const updateWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findOne({ _id: req.params.id, user: req.user._id });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const { title, description, taskType, config, scheduleIntervalMinutes, isActive } = req.body;

    if (title !== undefined) workflow.title = title;
    if (description !== undefined) workflow.description = description;
    if (taskType !== undefined) workflow.taskType = taskType;
    if (config !== undefined) workflow.config = { ...workflow.config, ...config };
    if (scheduleIntervalMinutes !== undefined) {
      workflow.scheduleIntervalMinutes = scheduleIntervalMinutes;
    }
    if (isActive !== undefined) {
      workflow.isActive = isActive;
      if (isActive) {
        workflow.nextRunAt = new Date(); // Re-schedule run
      }
    }

    await workflow.save();
    return res.json(workflow);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// @desc    Toggle bot active/inactive switch
// @route   PATCH /api/workflows/:id/toggle
export const toggleWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findOne({ _id: req.params.id, user: req.user._id });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    workflow.isActive = !workflow.isActive;
    if (workflow.isActive) {
      workflow.nextRunAt = new Date(); // Schedule immediate run when toggled on
    }

    await workflow.save();
    return res.json({
      _id: workflow._id,
      isActive: workflow.isActive,
      nextRunAt: workflow.nextRunAt,
      message: `Bot ${workflow.isActive ? 'activated' : 'paused'}`,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Trigger an immediate execution of a workflow
// @route   POST /api/workflows/:id/run
export const triggerRunNow = async (req, res) => {
  try {
    const workflow = await Workflow.findOne({ _id: req.params.id, user: req.user._id });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const { workflow: updatedWorkflow, log } = await executeWorkflowImmediately(workflow._id);

    return res.json({
      message: 'Workflow executed successfully',
      workflow: updatedWorkflow,
      executionLog: log,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Delete a workflow and its execution history
// @route   DELETE /api/workflows/:id
export const deleteWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Cascade delete logs associated with this workflow
    await ExecutionLog.deleteMany({ workflow: workflow._id });

    return res.json({ message: 'Workflow and associated execution logs deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
