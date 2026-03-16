/**
 * Rule: Missing Critical Fields
 *
 * Flags deals missing amount, close date, owner, or next steps.
 * These are the minimum fields RevOps needs for accurate forecasting.
 */

function evaluate(deal) {
  const props = deal.properties || {};
  const prob = parseFloat(props.hs_deal_stage_probability) || 0;

  // Skip closed-lost
  if (prob <= 0) return null;

  const missing = [];

  if (!props.amount || parseFloat(props.amount) === 0) missing.push('amount');
  if (!props.closedate) missing.push('closedate');
  if (!props.hubspot_owner_id) missing.push('owner');
  if (!props.hs_next_step) missing.push('next step');
  if (!props.hs_forecast_category) missing.push('forecast category');

  if (missing.length === 0) return null;

  const severity = missing.length >= 3 ? 'critical' : missing.length >= 2 ? 'high' : 'warning';

  return {
    ruleId: 'missing-fields',
    severity,
    title: `Missing ${missing.length} critical field${missing.length > 1 ? 's' : ''}`,
    message: `Deal "${props.dealname}" is missing: ${missing.join(', ')}.`,
    dealId: deal.id,
    dealName: props.dealname,
    metric: { missingFields: missing },
  };
}

module.exports = { id: 'missing-fields', name: 'Missing Critical Fields', evaluate };
