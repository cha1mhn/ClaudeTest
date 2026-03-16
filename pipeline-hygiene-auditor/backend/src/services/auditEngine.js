/**
 * GTM Pipeline Hygiene Audit Engine
 *
 * Orchestrates all rules against HubSpot deals + Clay enrichment data
 * and produces a scored audit report with an overall health grade.
 */

const staleDeal = require('../rules/staleDeal');
const missingFields = require('../rules/missingFields');
const pastDueClose = require('../rules/pastDueClose');
const noContacts = require('../rules/noContacts');
const enrichmentGap = require('../rules/enrichmentGap');
const pipelineBottleneck = require('../rules/pipelineBottleneck');
const { crossReferenceEnrichment } = require('./clayClient');
const { logger } = require('../utils/logger');

const DEAL_RULES = [staleDeal, missingFields, pastDueClose, noContacts];

const SEVERITY_WEIGHTS = { critical: 10, high: 5, warning: 2, info: 0 };

/**
 * Run a full pipeline hygiene audit.
 *
 * @param {object} params
 * @param {Array}  params.deals         – HubSpot deals
 * @param {Array}  params.stages        – pipeline stage metadata
 * @param {Array}  params.contacts      – HubSpot contacts associated to deals
 * @param {Array}  params.clayRecords   – Clay enrichment rows
 * @returns {object} audit report
 */
function runAudit({ deals, stages, contacts = [], clayRecords = [] }) {
  const now = new Date();
  const issues = [];

  // ── Per-deal rules ────────────────────────────────────────────────────
  for (const deal of deals) {
    for (const rule of DEAL_RULES) {
      const issue = rule.evaluate(deal);
      if (issue) issues.push(issue);
    }
  }

  // ── Pipeline-level rules ──────────────────────────────────────────────
  const bottlenecks = pipelineBottleneck.evaluateStages(deals, stages);
  issues.push(...bottlenecks);

  // ── Clay enrichment rules ─────────────────────────────────────────────
  let enrichmentSummary = null;
  if (contacts.length) {
    const crossRef = crossReferenceEnrichment(contacts, clayRecords);
    const enrichmentIssues = enrichmentGap.evaluateContacts(crossRef);
    issues.push(...enrichmentIssues);

    const enrichedCount = crossRef.filter((c) => c.enrichedInClay).length;
    const avgCompleteness = crossRef.length
      ? Math.round(crossRef.reduce((s, c) => s + c.clayCompleteness, 0) / crossRef.length)
      : 0;

    enrichmentSummary = {
      totalContacts: crossRef.length,
      enrichedInClay: enrichedCount,
      notInClay: crossRef.length - enrichedCount,
      avgClayCompleteness: avgCompleteness,
      avgHubSpotCompleteness: crossRef.length
        ? Math.round(crossRef.reduce((s, c) => s + c.hubSpotCompleteness, 0) / crossRef.length)
        : 0,
      contactsNeedingEnrichment: crossRef
        .filter((c) => !c.enrichedInClay)
        .map((c) => ({ email: c.email, name: c.name, contactId: c.contactId })),
    };
  }

  // ── Scoring ───────────────────────────────────────────────────────────
  const { grade, score, breakdown } = computeScore(issues, deals);

  // ── Group issues by rule ──────────────────────────────────────────────
  const issuesByRule = {};
  for (const issue of issues) {
    if (!issuesByRule[issue.ruleId]) {
      issuesByRule[issue.ruleId] = { ruleId: issue.ruleId, count: 0, issues: [] };
    }
    issuesByRule[issue.ruleId].count += 1;
    issuesByRule[issue.ruleId].issues.push(issue);
  }

  // ── Severity summary ──────────────────────────────────────────────────
  const severityCounts = { critical: 0, high: 0, warning: 0, info: 0 };
  for (const issue of issues) {
    severityCounts[issue.severity] = (severityCounts[issue.severity] || 0) + 1;
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations = generateRecommendations(issuesByRule, enrichmentSummary, deals);

  logger.info(`Audit complete: grade=${grade}, score=${score}, issues=${issues.length}`);

  return {
    generatedAt: now.toISOString(),
    grade,
    score,
    breakdown,
    severityCounts,
    totalIssues: issues.length,
    totalDeals: deals.length,
    openDeals: deals.filter((d) => {
      const p = parseFloat(d.properties?.hs_deal_stage_probability) || 0;
      return p > 0 && p < 1;
    }).length,
    issuesByRule: Object.values(issuesByRule),
    enrichmentSummary,
    recommendations,
    issues, // full list — frontend can paginate
  };
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function computeScore(issues, deals) {
  const openDeals = deals.filter((d) => {
    const p = parseFloat(d.properties?.hs_deal_stage_probability) || 0;
    return p > 0 && p < 1;
  });

  if (openDeals.length === 0) {
    return { grade: 'A', score: 100, breakdown: {} };
  }

  // Max possible penalty: every open deal triggers every rule at critical severity
  const maxPossible = openDeals.length * DEAL_RULES.length * SEVERITY_WEIGHTS.critical;

  const totalPenalty = issues.reduce((sum, issue) => {
    return sum + (SEVERITY_WEIGHTS[issue.severity] || 0);
  }, 0);

  const rawScore = maxPossible > 0
    ? Math.max(0, Math.round((1 - totalPenalty / maxPossible) * 100))
    : 100;

  // Clamp to 0-100
  const score = Math.min(100, Math.max(0, rawScore));

  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

  const breakdown = {
    totalPenaltyPoints: totalPenalty,
    maxPossiblePenalty: maxPossible,
    openDealCount: openDeals.length,
    rulesEvaluated: DEAL_RULES.length + 2, // + bottleneck + enrichment
  };

  return { grade, score, breakdown };
}

// ── Recommendation Engine ───────────────────────────────────────────────────

function generateRecommendations(issuesByRule, enrichmentSummary, deals) {
  const recs = [];

  if (issuesByRule['stale-deal']?.count > 0) {
    const count = issuesByRule['stale-deal'].count;
    recs.push({
      priority: count >= 10 ? 'high' : 'medium',
      category: 'Pipeline Hygiene',
      action: `Review ${count} stale deal${count > 1 ? 's' : ''} — update close dates or mark as closed-lost.`,
      impact: 'Removes dead weight from pipeline, improving forecast accuracy.',
      tools: ['HubSpot Workflows', 'Owner notifications'],
    });
  }

  if (issuesByRule['past-due-close']?.count > 0) {
    const count = issuesByRule['past-due-close'].count;
    recs.push({
      priority: 'high',
      category: 'Forecast Accuracy',
      action: `Update or close ${count} deal${count > 1 ? 's' : ''} with past-due close dates.`,
      impact: 'Past-due deals inflate pipeline and create forecast drag.',
      tools: ['HubSpot Workflows', 'Deal stage automation'],
    });
  }

  if (issuesByRule['missing-fields']?.count > 0) {
    const count = issuesByRule['missing-fields'].count;
    recs.push({
      priority: 'high',
      category: 'Data Quality',
      action: `Fill in missing fields on ${count} deal${count > 1 ? 's' : ''} (amount, close date, owner, forecast category).`,
      impact: 'Incomplete deal data makes weighted forecasts unreliable.',
      tools: ['HubSpot required fields', 'Validation workflows'],
    });
  }

  if (issuesByRule['no-contacts']?.count > 0) {
    const count = issuesByRule['no-contacts'].count;
    recs.push({
      priority: 'medium',
      category: 'Attribution & GTM',
      action: `Associate contacts to ${count} deal${count > 1 ? 's' : ''} with no linked contacts.`,
      impact: 'Enables Clay enrichment sync, multi-touch attribution, and lifecycle tracking.',
      tools: ['HubSpot Associations', 'Clay enrichment tables'],
    });
  }

  if (issuesByRule['pipeline-bottleneck']?.count > 0) {
    const stageNames = issuesByRule['pipeline-bottleneck'].issues.map((i) => i.stageName);
    recs.push({
      priority: 'high',
      category: 'Sales Process',
      action: `Investigate bottleneck at: ${stageNames.join(', ')}. Review enablement materials and stage exit criteria.`,
      impact: 'Bottlenecks slow velocity and reduce period close rates.',
      tools: ['Sales playbooks', 'Stage-specific automations'],
    });
  }

  if (enrichmentSummary && enrichmentSummary.notInClay > 0) {
    recs.push({
      priority: enrichmentSummary.notInClay > 20 ? 'high' : 'medium',
      category: 'Clay Enrichment',
      action: `Run Clay enrichment for ${enrichmentSummary.notInClay} contact${enrichmentSummary.notInClay > 1 ? 's' : ''} not yet in Clay.`,
      impact: 'Full enrichment improves lead scoring, routing, and personalisation.',
      tools: ['Clay table triggers', 'Clay → HubSpot sync'],
    });
  }

  if (enrichmentSummary && enrichmentSummary.avgClayCompleteness < 60) {
    recs.push({
      priority: 'medium',
      category: 'Clay Enrichment',
      action: `Average Clay completeness is ${enrichmentSummary.avgClayCompleteness}%. Add more enrichment sources to your Clay table.`,
      impact: 'Higher completeness drives better lead scoring and outbound personalisation.',
      tools: ['Clay waterfall enrichment', 'Additional data providers'],
    });
  }

  return recs.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] ?? 9) - (order[b.priority] ?? 9);
  });
}

module.exports = { runAudit };
