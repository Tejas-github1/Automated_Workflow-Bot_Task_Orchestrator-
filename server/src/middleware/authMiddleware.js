import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no auth token provided, check if a demo user can be auto-assigned
  if (!token) {
    try {
      const demoUser = await User.findOne({ email: 'demo@ibots.dev' });
      if (demoUser) {
        req.user = demoUser;
        return next();
      }
    } catch {
      // Fall through to unauthorized
    }
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ibots_jwt_super_secret_dev_key_2026');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized, token invalid or expired' });
  }
};
