import express from 'express';
import { getExecutionLogs, getTelemetryStats } from '../controllers/logController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getExecutionLogs);
router.get('/stats', getTelemetryStats);

export default router;
