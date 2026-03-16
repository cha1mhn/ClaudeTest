const express = require('express');
const router = express.Router();
const { fetchDeals, fetchPipelineStages, fetchPipelines, fetchOwners } = require('../services/hubspotClient');
const { withCache } = require('../utils/cache');
const { logger } = require('../utils/logger');

/** GET /api/deals  – paginated deal list with stage enrichment */
router.get('/', async (req, res, next) => {
  try {
    const { pipelineId, ownerId, startDate, endDate } = req.query;
    const cacheKey = `deals:${pipelineId}:${ownerId}:${startDate}:${endDate}`;

    const deals = await withCache(cacheKey, 60, () =>
      fetchDeals({ pipelineId, ownerId, startDate, endDate })
    );

    res.json({ count: deals.length, results: deals });
  } catch (err) {
    logger.error('Deals fetch error', { error: err.message });
    next(err);
  }
});

/** GET /api/deals/pipelines */
router.get('/pipelines', async (_req, res, next) => {
  try {
    const pipelines = await withCache('pipelines', 600, fetchPipelines);
    res.json(pipelines);
  } catch (err) {
    next(err);
  }
});

/** GET /api/deals/stages */
router.get('/stages', async (req, res, next) => {
  try {
    const { pipelineId } = req.query;
    const stages = await withCache(`stages:${pipelineId}`, 600, () =>
      fetchPipelineStages(pipelineId)
    );
    res.json(stages);
  } catch (err) {
    next(err);
  }
});

/** GET /api/deals/owners */
router.get('/owners', async (_req, res, next) => {
  try {
    const owners = await withCache('owners', 600, fetchOwners);
    res.json(owners);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
