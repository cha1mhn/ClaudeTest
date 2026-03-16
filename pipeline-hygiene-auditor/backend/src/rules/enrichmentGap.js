/**
 * Rule: Clay Enrichment Gap
 *
 * Flags contacts attached to open deals that either:
 *   a) Don't exist in Clay (never enriched)
 *   b) Have a low enrichment completeness score
 *
 * This helps RevOps identify gaps in the Clay → HubSpot data loop.
 */

const MIN_SCORE = parseInt(process.env.ENRICHMENT_SCORE_MIN, 10) || 60;

function evaluateContacts(crossRefResults) {
  return crossRefResults
    .filter((c) => {
      // Flag if not in Clay at all, or low completeness
      return !c.enrichedInClay || c.clayCompleteness < MIN_SCORE;
    })
    .map((c) => {
      const severity = !c.enrichedInClay
        ? 'high'
        : c.clayCompleteness < 30
          ? 'high'
          : 'warning';

      const reason = !c.enrichedInClay
        ? `not found in Clay — needs enrichment run`
        : `Clay completeness is ${c.clayCompleteness}% (min: ${MIN_SCORE}%)`;

      return {
        ruleId: 'enrichment-gap',
        severity,
        title: 'Enrichment gap in Clay',
        message: `Contact "${c.name}" (${c.email || 'no email'}) — ${reason}.`,
        contactId: c.contactId,
        contactEmail: c.email,
        metric: {
          enrichedInClay: c.enrichedInClay,
          clayCompleteness: c.clayCompleteness,
          hubSpotCompleteness: c.hubSpotCompleteness,
          missingInHubSpot: c.missingInHubSpot,
        },
      };
    });
}

module.exports = { id: 'enrichment-gap', name: 'Clay Enrichment Gap', evaluateContacts };
