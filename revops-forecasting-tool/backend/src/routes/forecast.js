const express = require('express');
const router = express.Router();
const { fetchDeals, fetchPipelineStages } = require('../services/hubspotClient');
const { buildForecast } = require('../services/forecastEngine');
const { withCache } = require('../utils/cache');
const { logger } = require('../utils/logger');

/**
 * GET /api/forecast
 * Query params:
 *   method    – weighted | category | historical | trend  (default: weighted)
 *   period    – monthly | quarterly                       (default: quarterly)
 *   pipelineId – HubSpot pipeline ID
 *   ownerId   – filter by sales rep
 *   startDate – ISO date string
 *   endDate   – ISO date string
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      method = 'weighted',
      period = 'quarterly',
      pipelineId,
      ownerId,
      startDate,
      endDate,
    } = req.query;

    const cacheKey = `forecast:${method}:${period}:${pipelineId}:${ownerId}:${startDate}:${endDate}`;

    const result = await withCache(cacheKey, 120, async () => {
      const [deals, stages] = await Promise.all([
        fetchDeals({ pipelineId, ownerId, startDate, endDate }),
        fetchPipelineStages(pipelineId),
      ]);

      // For historical/trend methods, fetch closed deals for the past 12 months
      let historicalDeals = [];
      if (method === 'historical' || method === 'trend') {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        historicalDeals = await fetchDeals({
          pipelineId,
          endDate: new Date().toISOString(),
          startDate: twelveMonthsAgo.toISOString(),
        });
      }

      return buildForecast(deals, stages, method, { period, historicalDeals });
    });

    res.json(result);
  } catch (err) {
    logger.error('Forecast error', { error: err.message });
    next(err);
  }
});

/**
 * GET /api/forecast/summary
 * Returns a compact summary suitable for a HubSpot CRM card panel.
 */
router.get('/summary', async (req, res, next) => {
  try {
    const { pipelineId, period = 'quarterly' } = req.query;

    const cacheKey = `forecast:summary:${pipelineId}:${period}`;
    const result = await withCache(cacheKey, 120, async () => {
      const [deals, stages] = await Promise.all([
        fetchDeals({ pipelineId }),
        fetchPipelineStages(pipelineId),
      ]);

      const weighted = buildForecast(deals, stages, 'weighted', { period });
      const category = buildForecast(deals, stages, 'category', { period });

      return {
        generatedAt: new Date().toISOString(),
        period,
        weighted: weighted.summary,
        category: category.summary,
        periodBuckets: weighted.periodBuckets,
        stageBreakdown: weighted.stageBreakdown,
      };
    });

    res.json(result);
  } catch (err) {
    logger.error('Forecast summary error', { error: err.message });
    next(err);
  }
});

module.exports = router;
