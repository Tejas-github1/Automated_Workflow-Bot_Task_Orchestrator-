import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'ibots_jwt_super_secret_dev_key_2026', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password });
    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      tier: user.tier,
      token: generateToken(user._id),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      tier: user.tier,
      token: generateToken(user._id),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Get or create a default demo user for instant frictionless testing
// @route   POST /api/auth/demo
export const getDemoUser = async (req, res) => {
  try {
    let demoUser = await User.findOne({ email: 'demo@ibots.dev' });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Demo Architect',
        email: 'demo@ibots.dev',
        password: 'Password123!',
        tier: 'PRO',
      });
    }

    return res.json({
      _id: demoUser._id,
      name: demoUser.name,
      email: demoUser.email,
      tier: demoUser.tier,
      token: generateToken(demoUser._id),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
