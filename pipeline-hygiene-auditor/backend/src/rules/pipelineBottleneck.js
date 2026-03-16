/**
 * Rule: Pipeline Bottleneck Detection
 *
 * Identifies stages where a disproportionate number of deals are stuck.
 * Uses standard deviation to flag stages with > 1.5σ above mean deal count.
 * Helps RevOps teams identify process breakdowns in their GTM motion.
 */

function evaluateStages(deals, stages) {
  const stageMap = Object.fromEntries(stages.map((s) => [s.id, s]));

  // Count open deals per stage
  const stageCounts = {};
  deals.forEach((d) => {
    const prob = parseFloat(d.properties?.hs_deal_stage_probability) || 0;
    if (prob <= 0 || prob >= 1) return;
    const stageId = d.properties?.dealstage;
    if (!stageId) return;
    stageCounts[stageId] = (stageCounts[stageId] || 0) + 1;
  });

  const counts = Object.values(stageCounts);
  if (counts.length < 2) return [];

  const mean = counts.reduce((s, c) => s + c, 0) / counts.length;
  const stddev = Math.sqrt(counts.reduce((s, c) => s + (c - mean) ** 2, 0) / counts.length);
  const threshold = mean + 1.5 * stddev;

  const issues = [];
  for (const [stageId, count] of Object.entries(stageCounts)) {
    if (count > threshold && threshold > 0) {
      const stage = stageMap[stageId];
      const pctAboveMean = Math.round(((count - mean) / mean) * 100);

      issues.push({
        ruleId: 'pipeline-bottleneck',
        severity: count > mean + 2.5 * stddev ? 'critical' : 'high',
        title: `Bottleneck at "${stage?.label || stageId}"`,
        message: `${count} deals stuck in "${stage?.label || stageId}" — ${pctAboveMean}% above average (${Math.round(mean)} deals/stage). Review process or enablement at this stage.`,
        stageId,
        stageName: stage?.label || stageId,
        metric: { dealCount: count, mean: Math.round(mean), stddev: Math.round(stddev), threshold: Math.round(threshold) },
      });
    }
  }

  return issues;
}

module.exports = { id: 'pipeline-bottleneck', name: 'Pipeline Bottleneck', evaluateStages };
