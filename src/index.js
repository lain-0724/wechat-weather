require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const scheduler = require('./services/scheduler');
const wechatRoutes = require('./routes/wechat');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.text({ type: 'text/xml' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.use('/wechat', wechatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  logger.info(`WeChat Weather Reminder server started on port ${PORT}`);
});

// Initialize and start the scheduler
logger.info('WeChat Weather Reminder Service Starting...');
scheduler.start();
logger.info('Scheduler initialized and running...');

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  scheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  scheduler.stop();
  process.exit(0);
});
