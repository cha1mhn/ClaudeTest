const express = require('express');
const router = express.Router();
const { fetchDeals, fetchPipelineStages } = require('../services/hubspotClient');
const { withCache } = require('../utils/cache');
const { logger } = require('../utils/logger');

/**
 * GET /api/metrics/kpis
 * Returns headline RevOps KPIs:
 *   - Win rate, Average deal size, Average sales cycle, Pipeline velocity
 */
router.get('/kpis', async (req, res, next) => {
  try {
    const { pipelineId, ownerId } = req.query;
    const cacheKey = `kpis:${pipelineId}:${ownerId}`;

    const kpis = await withCache(cacheKey, 180, async () => {
      const deals = await fetchDeals({ pipelineId, ownerId });

      const all = deals.map((d) => {
        const props = d.properties || {};
        return {
          amount: parseFloat(props.amount) || 0,
          probability: parseFloat(props.hs_deal_stage_probability) || 0,
          closeDate: props.closedate ? new Date(props.closedate) : null,
          createDate: props.createdate ? new Date(props.createdate) : null,
        };
      });

      const won = all.filter((d) => d.probability >= 1);
      const lost = all.filter((d) => d.probability <= 0 && d.closeDate && d.closeDate < new Date());
      const closed = [...won, ...lost];

      const winRate = closed.length > 0 ? won.length / closed.length : 0;
      const avgDealSize = won.length > 0 ? won.reduce((s, d) => s + d.amount, 0) / won.length : 0;

      const cycleTimeDays = won
        .filter((d) => d.createDate && d.closeDate)
        .map((d) => (d.closeDate - d.createDate) / 86400000);
      const avgCycleDays = cycleTimeDays.length > 0
        ? cycleTimeDays.reduce((s, v) => s + v, 0) / cycleTimeDays.length
        : null;

      // Pipeline velocity = (# deals × win rate × avg deal size) / avg cycle days
      const openDeals = all.filter((d) => d.probability > 0 && d.probability < 1);
      const pipelineVelocity = avgCycleDays && avgCycleDays > 0
        ? (openDeals.length * winRate * avgDealSize) / avgCycleDays
        : null;

      return {
        winRate: parseFloat((winRate * 100).toFixed(1)),
        averageDealSize: Math.round(avgDealSize),
        averageSaleCycleDays: avgCycleDays ? Math.round(avgCycleDays) : null,
        pipelineVelocityPerDay: pipelineVelocity ? Math.round(pipelineVelocity) : null,
        totalDeals: all.length,
        openDeals: openDeals.length,
        wonDeals: won.length,
        lostDeals: lost.length,
      };
    });

    res.json(kpis);
  } catch (err) {
    logger.error('KPI error', { error: err.message });
    next(err);
  }
});

/**
 * GET /api/metrics/attainment
 * Quota attainment: won revenue vs target quota.
 * Accepts query param: quota (number), period (monthly|quarterly)
 */
router.get('/attainment', async (req, res, next) => {
  try {
    const { pipelineId, ownerId, quota, period = 'quarterly' } = req.query;
    const quotaNum = parseFloat(quota) || 0;

    const deals = await fetchDeals({ pipelineId, ownerId });
    const now = new Date();
    const periodStart = period === 'monthly'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

    const wonRevenue = deals
      .filter((d) => {
        const props = d.properties || {};
        const closeDate = props.closedate ? new Date(props.closedate) : null;
        const prob = parseFloat(props.hs_deal_stage_probability) || 0;
        return prob >= 1 && closeDate && closeDate >= periodStart && closeDate <= now;
      })
      .reduce((s, d) => s + (parseFloat(d.properties?.amount) || 0), 0);

    const attainmentPct = quotaNum > 0 ? parseFloat(((wonRevenue / quotaNum) * 100).toFixed(1)) : null;

    res.json({
      period,
      periodStart: periodStart.toISOString(),
      wonRevenue: Math.round(wonRevenue),
      quota: quotaNum,
      attainmentPct,
      gap: quotaNum > 0 ? Math.round(quotaNum - wonRevenue) : null,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
