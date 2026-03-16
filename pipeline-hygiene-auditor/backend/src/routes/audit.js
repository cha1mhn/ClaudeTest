const express = require('express');
const router = express.Router();
const { fetchAllDeals, fetchContactsForDeals, fetchPipelineStages } = require('../services/hubspotClient');
const { fetchEnrichedRecords, triggerEnrichmentRun } = require('../services/clayClient');
const { runAudit } = require('../services/auditEngine');
const { withCache, invalidate } = require('../utils/cache');
const { logger } = require('../utils/logger');

/**
 * GET /api/audit
 * Full pipeline hygiene audit.
 * Query: pipelineId, ownerId, includeClay=true|false
 */
router.get('/', async (req, res, next) => {
  try {
    const { pipelineId, ownerId, includeClay = 'true' } = req.query;
    const cacheKey = `audit:${pipelineId}:${ownerId}:${includeClay}`;

    const result = await withCache(cacheKey, 120, async () => {
      const [deals, stages] = await Promise.all([
        fetchAllDeals({ pipelineId, ownerId }),
        fetchPipelineStages(pipelineId),
      ]);

      let contacts = [];
      let clayRecords = [];

      if (includeClay !== 'false' && deals.length) {
        const dealIds = deals.map((d) => d.id);
        try {
          contacts = await fetchContactsForDeals(dealIds);
        } catch (err) {
          logger.warn('Could not fetch contacts — skipping enrichment check', { error: err.message });
        }

        if (process.env.CLAY_API_KEY) {
          try {
            clayRecords = await fetchEnrichedRecords();
          } catch (err) {
            logger.warn('Could not fetch Clay records', { error: err.message });
          }
        }
      }

      return runAudit({ deals, stages, contacts, clayRecords });
    });

    res.json(result);
  } catch (err) {
    logger.error('Audit error', { error: err.message });
    next(err);
  }
});

/**
 * GET /api/audit/summary
 * Compact summary for HubSpot CRM card.
 */
router.get('/summary', async (req, res, next) => {
  try {
    const { pipelineId } = req.query;
    const cacheKey = `audit:summary:${pipelineId}`;

    const result = await withCache(cacheKey, 120, async () => {
      const [deals, stages] = await Promise.all([
        fetchAllDeals({ pipelineId }),
        fetchPipelineStages(pipelineId),
      ]);

      const audit = runAudit({ deals, stages });

      return {
        grade: audit.grade,
        score: audit.score,
        totalIssues: audit.totalIssues,
        severityCounts: audit.severityCounts,
        openDeals: audit.openDeals,
        topRecommendations: audit.recommendations.slice(0, 3),
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/audit/refresh
 * Force-refresh the cached audit.
 */
router.post('/refresh', (_req, res) => {
  invalidate('audit:');
  res.json({ message: 'Audit cache cleared' });
});

/**
 * POST /api/audit/enrich
 * Trigger Clay enrichment for contacts missing from Clay.
 * Body: { emails: ["a@b.com"], tableId?: "..." }
 */
router.post('/enrich', async (req, res, next) => {
  try {
    const { emails = [], tableId } = req.body;
    if (!emails.length) return res.status(400).json({ error: 'No emails provided' });

    const records = emails.map((email) => ({ email }));
    const result = await triggerEnrichmentRun(tableId, records);

    if (!result) {
      return res.status(502).json({ error: 'Clay enrichment trigger failed' });
    }

    res.json({ message: `Enrichment triggered for ${emails.length} contacts`, result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
