import express from 'express';
import { dispatchCronTasks } from '../controllers/cronController.js';

const router = express.Router();

// Allow both GET and POST for Vercel Cron invocation flexibility
router.route('/dispatch').get(dispatchCronTasks).post(dispatchCronTasks);

export default router;
