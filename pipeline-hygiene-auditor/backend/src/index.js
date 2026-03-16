require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { logger } = require('./utils/logger');

const auditRoutes = require('./routes/audit');
const dealsRoutes = require('./routes/deals');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'self'", 'https://app.hubspot.com', 'https://*.hubspot.com'],
    },
  },
}));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true }));

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.use('/api/audit', auditRoutes);
app.use('/api/deals', dealsRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Scheduled audit (optional)
if (process.env.AUDIT_CRON) {
  const cron = require('node-cron');
  const { fetchAllDeals, fetchPipelineStages } = require('./services/hubspotClient');
  const { runAudit } = require('./services/auditEngine');

  cron.schedule(process.env.AUDIT_CRON, async () => {
    logger.info('Running scheduled audit…');
    try {
      const [deals, stages] = await Promise.all([fetchAllDeals(), fetchPipelineStages()]);
      const report = runAudit({ deals, stages });
      logger.info(`Scheduled audit: grade=${report.grade} score=${report.score} issues=${report.totalIssues}`);
    } catch (err) {
      logger.error('Scheduled audit failed', { error: err.message });
    }
  });
  logger.info(`Scheduled audit cron: ${process.env.AUDIT_CRON}`);
}

app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

app.listen(PORT, () => {
  logger.info(`Pipeline Hygiene Auditor API running on port ${PORT}`);
});

module.exports = app;
