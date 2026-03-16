/**
 * Rule: Stale Deal Detection
 *
 * Flags deals that haven't been modified in X days while still open.
 * Severity scales with how long the deal has been stagnant.
 */

const STALE_DAYS = parseInt(process.env.STALE_DEAL_DAYS, 10) || 30;
const MS_PER_DAY = 86400000;

function evaluate(deal) {
  const props = deal.properties || {};
  const prob = parseFloat(props.hs_deal_stage_probability) || 0;

  // Skip closed deals
  if (prob >= 1 || prob <= 0) return null;

  const lastModified = props.hs_lastmodifieddate
    ? new Date(props.hs_lastmodifieddate)
    : null;

  if (!lastModified) {
    return {
      ruleId: 'stale-deal',
      severity: 'warning',
      title: 'Missing last-modified date',
      message: `Deal "${props.dealname}" has no last-modified date recorded.`,
      dealId: deal.id,
      dealName: props.dealname,
    };
  }

  const daysSinceModified = Math.floor((Date.now() - lastModified.getTime()) / MS_PER_DAY);

  if (daysSinceModified < STALE_DAYS) return null;

  const severity = daysSinceModified >= STALE_DAYS * 3
    ? 'critical'
    : daysSinceModified >= STALE_DAYS * 2
      ? 'high'
      : 'warning';

  return {
    ruleId: 'stale-deal',
    severity,
    title: 'Stale deal — no updates',
    message: `Deal "${props.dealname}" has not been updated in ${daysSinceModified} days (threshold: ${STALE_DAYS}d).`,
    dealId: deal.id,
    dealName: props.dealname,
    metric: { daysSinceModified, threshold: STALE_DAYS },
  };
}

module.exports = { id: 'stale-deal', name: 'Stale Deal Detection', evaluate };
