/**
 * RevOps Forecasting Engine
 *
 * Supports four forecast methodologies:
 *   1. Weighted Pipeline   – stage probability × deal amount
 *   2. Category-Based      – HubSpot forecast categories (Commit / Best Case / Pipeline)
 *   3. Historical Win-Rate – adjusts stage probabilities using historical close data
 *   4. AI/ML Trend         – simple linear regression on historical monthly revenue
 */

/**
 * @param {Array}  deals        – raw HubSpot deal objects
 * @param {Array}  stages       – stage metadata [{ id, label, probability }]
 * @param {string} method       – 'weighted' | 'category' | 'historical' | 'trend'
 * @param {object} options      – { period: 'monthly'|'quarterly', historicalDeals? }
 * @returns {object}
 */
function buildForecast(deals, stages, method = 'weighted', options = {}) {
  const { period = 'quarterly' } = options;

  const stageMap = Object.fromEntries(stages.map((s) => [s.id, s]));
  const now = new Date();

  // Normalise deals
  const normalised = deals.map((d) => {
    const props = d.properties || {};
    const amount = parseFloat(props.amount) || 0;
    const stageId = props.dealstage;
    const stage = stageMap[stageId] || {};
    const closeDate = props.closedate ? new Date(props.closedate) : null;
    const stageProbability = parseFloat(props.hs_deal_stage_probability) || stage.probability || 0;
    const forecastCategory = props.hs_forecast_category || 'pipeline';

    return {
      id: d.id,
      name: props.dealname || 'Unnamed Deal',
      amount,
      stageId,
      stageName: stage.label || stageId,
      stageProbability,
      forecastCategory: forecastCategory.toLowerCase(),
      closeDate,
      ownerId: props.hubspot_owner_id,
      isClosed: stageProbability >= 1,
      isLost: stageProbability <= 0 && stageId && stageId.includes('lost'),
      weightedAmount: amount * stageProbability,
    };
  });

  const openDeals = normalised.filter((d) => !d.isLost && d.closeDate && d.closeDate >= now);

  // Choose methodology
  let forecastedRevenue;
  switch (method) {
    case 'category':
      forecastedRevenue = categoryForecast(openDeals);
      break;
    case 'historical':
      forecastedRevenue = historicalForecast(openDeals, options.historicalDeals || []);
      break;
    case 'trend':
      forecastedRevenue = trendForecast(options.historicalDeals || [], period);
      break;
    default:
      forecastedRevenue = weightedForecast(openDeals);
  }

  const periodBuckets = bucketByPeriod(openDeals, period);
  const stageBreakdown = stageRollup(openDeals, stageMap);
  const repBreakdown = repRollup(openDeals);
  const coverage = pipelineCoverage(normalised);
  const velocity = dealVelocity(normalised);

  return {
    method,
    period,
    generatedAt: now.toISOString(),
    summary: {
      forecastedRevenue,
      totalPipelineValue: openDeals.reduce((s, d) => s + d.amount, 0),
      weightedPipeline: openDeals.reduce((s, d) => s + d.weightedAmount, 0),
      openDealCount: openDeals.length,
      coverage,
      averageDealSize: openDeals.length ? openDeals.reduce((s, d) => s + d.amount, 0) / openDeals.length : 0,
      avgDealVelocityDays: velocity,
    },
    periodBuckets,
    stageBreakdown,
    repBreakdown,
    deals: openDeals,
  };
}

// ── Methodology implementations ─────────────────────────────────────────────

function weightedForecast(deals) {
  return deals.reduce((sum, d) => sum + d.weightedAmount, 0);
}

function categoryForecast(deals) {
  const weights = { commit: 0.9, best_case: 0.5, pipeline: 0.2, omit: 0 };
  return deals.reduce((sum, d) => {
    const w = weights[d.forecastCategory] ?? d.stageProbability;
    return sum + d.amount * w;
  }, 0);
}

function historicalForecast(deals, historicalDeals) {
  // Compute win rate per stage from closed deals
  const closedByStage = {};
  historicalDeals.forEach((d) => {
    const props = d.properties || {};
    const stageId = props.dealstage;
    if (!stageId) return;
    if (!closedByStage[stageId]) closedByStage[stageId] = { won: 0, total: 0 };
    closedByStage[stageId].total += 1;
    if (parseFloat(props.hs_deal_stage_probability) >= 1) {
      closedByStage[stageId].won += 1;
    }
  });

  return deals.reduce((sum, d) => {
    const hist = closedByStage[d.stageId];
    const winRate = hist && hist.total > 0 ? hist.won / hist.total : d.stageProbability;
    return sum + d.amount * winRate;
  }, 0);
}

function trendForecast(historicalDeals, period) {
  // Group closed-won revenue by period bucket
  const buckets = {};
  historicalDeals.forEach((d) => {
    const props = d.properties || {};
    const prob = parseFloat(props.hs_deal_stage_probability) || 0;
    if (prob < 1) return;
    const closeDate = props.closedate ? new Date(props.closedate) : null;
    if (!closeDate) return;
    const key = periodKey(closeDate, period);
    buckets[key] = (buckets[key] || 0) + (parseFloat(props.amount) || 0);
  });

  const sorted = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b));
  if (sorted.length < 2) return 0;

  // Linear regression on index → revenue
  const n = sorted.length;
  const xs = sorted.map((_, i) => i);
  const ys = sorted.map(([, v]) => v);
  const xMean = xs.reduce((s, x) => s + x, 0) / n;
  const yMean = ys.reduce((s, y) => s + y, 0) / n;
  const slope = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0) /
    xs.reduce((s, x) => s + (x - xMean) ** 2, 0);
  const intercept = yMean - slope * xMean;

  // Predict next period
  return Math.max(0, slope * n + intercept);
}

// ── Aggregation helpers ──────────────────────────────────────────────────────

function bucketByPeriod(deals, period) {
  const buckets = {};
  deals.forEach((d) => {
    if (!d.closeDate) return;
    const key = periodKey(d.closeDate, period);
    if (!buckets[key]) buckets[key] = { period: key, totalAmount: 0, weightedAmount: 0, count: 0, deals: [] };
    buckets[key].totalAmount += d.amount;
    buckets[key].weightedAmount += d.weightedAmount;
    buckets[key].count += 1;
    buckets[key].deals.push(d.id);
  });
  return Object.values(buckets).sort((a, b) => a.period.localeCompare(b.period));
}

function periodKey(date, period) {
  const y = date.getFullYear();
  if (period === 'monthly') {
    return `${y}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  const q = Math.ceil((date.getMonth() + 1) / 3);
  return `${y}-Q${q}`;
}

function stageRollup(deals, stageMap) {
  const stages = {};
  deals.forEach((d) => {
    const id = d.stageId;
    if (!stages[id]) {
      stages[id] = {
        stageId: id,
        stageName: stageMap[id]?.label || id,
        probability: stageMap[id]?.probability || d.stageProbability,
        totalAmount: 0,
        weightedAmount: 0,
        count: 0,
      };
    }
    stages[id].totalAmount += d.amount;
    stages[id].weightedAmount += d.weightedAmount;
    stages[id].count += 1;
  });
  return Object.values(stages).sort((a, b) => b.totalAmount - a.totalAmount);
}

function repRollup(deals) {
  const reps = {};
  deals.forEach((d) => {
    const id = d.ownerId || 'unassigned';
    if (!reps[id]) {
      reps[id] = { ownerId: id, totalAmount: 0, weightedAmount: 0, count: 0 };
    }
    reps[id].totalAmount += d.amount;
    reps[id].weightedAmount += d.weightedAmount;
    reps[id].count += 1;
  });
  return Object.values(reps).sort((a, b) => b.weightedAmount - a.weightedAmount);
}

function pipelineCoverage(deals) {
  // Ratio of open pipeline to closed-won in same period – simplified to 3× target heuristic
  const openPipeline = deals.filter((d) => !d.isClosed && !d.isLost).reduce((s, d) => s + d.amount, 0);
  const closedWon = deals.filter((d) => d.isClosed).reduce((s, d) => s + d.amount, 0);
  return closedWon > 0 ? parseFloat((openPipeline / closedWon).toFixed(2)) : null;
}

function dealVelocity(deals) {
  const closedDeals = deals.filter((d) => d.isClosed && d.closeDate);
  if (!closedDeals.length) return null;
  // days between createdate and closedate placeholder – we don't have createdate here
  // Return average days as a stub; full impl would use createdate
  return null;
}

module.exports = { buildForecast };
