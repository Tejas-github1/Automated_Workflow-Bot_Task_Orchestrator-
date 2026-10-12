import express from 'express';
import {
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  toggleWorkflow,
  triggerRunNow,
  deleteWorkflow,
} from '../controllers/workflowController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getWorkflows).post(createWorkflow);
router.route('/:id').get(getWorkflowById).put(updateWorkflow).delete(deleteWorkflow);
router.patch('/:id/toggle', toggleWorkflow);
router.post('/:id/run', triggerRunNow);

export default router;
