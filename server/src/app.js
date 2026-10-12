import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';
import logRoutes from './routes/logRoutes.js';
import cronRoutes from './routes/cronRoutes.js';

const app = express();

// Core Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

import mongoose from 'mongoose';

// Health check endpoint (always accessible)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'iBots Automated Workflow Orchestrator API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Database readiness middleware for data routes
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database connection unavailable. Please set MONGODB_URI in your Vercel Environment Variables (e.g. MongoDB Atlas connection string).',
    });
  }
  next();
});

// Primary API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/cron', cronRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: `Not Found - ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack || err.message);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

export default app;
