/**
 * Rule: No Associated Contacts
 *
 * Flags deals with zero associated contacts — a common data
 * quality issue that blocks attribution, enrichment sync from
 * Clay, and proper lifecycle tracking.
 */

function evaluate(deal) {
  const props = deal.properties || {};
  const prob = parseFloat(props.hs_deal_stage_probability) || 0;

  if (prob >= 1 || prob <= 0) return null;

  const contactCount = parseInt(props.num_associated_contacts, 10) || 0;
  if (contactCount > 0) return null;

  return {
    ruleId: 'no-contacts',
    severity: 'high',
    title: 'No associated contacts',
    message: `Deal "${props.dealname}" has no contacts associated. This blocks attribution, Clay enrichment sync, and lifecycle tracking.`,
    dealId: deal.id,
    dealName: props.dealname,
    metric: { associatedContacts: 0 },
  };
}

module.exports = { id: 'no-contacts', name: 'No Associated Contacts', evaluate };
