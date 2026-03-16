/**
 * Rule: Past-Due Close Date
 *
 * Flags open deals whose close date has already passed.
 * These inflate pipeline and distort forecasts.
 */

const MS_PER_DAY = 86400000;

function evaluate(deal) {
  const props = deal.properties || {};
  const prob = parseFloat(props.hs_deal_stage_probability) || 0;

  if (prob >= 1 || prob <= 0) return null;

  const closeDate = props.closedate ? new Date(props.closedate) : null;
  if (!closeDate) return null;

  const daysOverdue = Math.floor((Date.now() - closeDate.getTime()) / MS_PER_DAY);
  if (daysOverdue <= 0) return null;

  const severity = daysOverdue >= 90 ? 'critical' : daysOverdue >= 30 ? 'high' : 'warning';

  return {
    ruleId: 'past-due-close',
    severity,
    title: 'Close date is past due',
    message: `Deal "${props.dealname}" close date was ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago (${closeDate.toISOString().split('T')[0]}). Update or close the deal.`,
    dealId: deal.id,
    dealName: props.dealname,
    metric: { daysOverdue, closeDate: closeDate.toISOString() },
  };
}

module.exports = { id: 'past-due-close', name: 'Past-Due Close Date', evaluate };
