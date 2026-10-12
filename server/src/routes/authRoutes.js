import express from 'express';
import {
  registerUser,
  loginUser,
  getDemoUser,
  getCurrentUser,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/demo', getDemoUser);
router.get('/me', protect, getCurrentUser);

export default router;
