require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

const reportsRouter = require('./routes/reports');
const proceduresRouter = require('./routes/procedures');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 4001;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '20kb' }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Anonymous submissions get a tighter rate limit to deter spam/abuse.
const submitLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions from this network. Please try again later.' },
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/reports', (req, res, next) => (req.method === 'POST' ? submitLimiter(req, res, next) : next()));
app.use('/api/reports', reportsRouter);
app.use('/api/procedures', proceduresRouter);
app.use('/api/stats', statsRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(err.stack || err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`Hospital Bill Transparency API listening on port ${PORT}`);
});

module.exports = app;
