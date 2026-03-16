import React, { useState } from 'react';
import { api } from '../utils/api';

export default function EnrichmentPanel({ enrichmentSummary }) {
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState(null);

  if (!enrichmentSummary) return null;

  const { totalContacts, enrichedInClay, notInClay, avgClayCompleteness, avgHubSpotCompleteness, contactsNeedingEnrichment = [] } = enrichmentSummary;

  const handleTriggerEnrichment = async () => {
    const emails = contactsNeedingEnrichment.map((c) => c.email).filter(Boolean);
    if (!emails.length) return;
    setTriggering(true);
    try {
      const result = await api.triggerEnrichment(emails);
      setTriggerResult(result.message || 'Enrichment triggered');
    } catch (err) {
      setTriggerResult(`Error: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  const enrichmentRate = totalContacts ? Math.round((enrichedInClay / totalContacts) * 100) : 0;

  return (
    <div style={styles.wrap}>
      <h3 style={styles.title}>Clay Enrichment Status</h3>

      <div style={styles.stats}>
        <Stat label="Total Contacts" value={totalContacts} />
        <Stat label="In Clay" value={enrichedInClay} />
        <Stat label="Not In Clay" value={notInClay} alert={notInClay > 0} />
        <Stat label="Enrichment Rate" value={`${enrichmentRate}%`} />
        <Stat label="Avg Clay Score" value={`${avgClayCompleteness}%`} />
        <Stat label="Avg HubSpot Score" value={`${avgHubSpotCompleteness}%`} />
      </div>

      <div style={styles.bar}>
        <div style={{ ...styles.barFill, width: `${enrichmentRate}%`, background: enrichmentRate >= 80 ? '#00BDA5' : enrichmentRate >= 50 ? '#F5C26B' : '#F2547D' }} />
      </div>

      {contactsNeedingEnrichment.length > 0 && (
        <div style={styles.actions}>
          <p style={styles.actionText}>
            {contactsNeedingEnrichment.length} contact{contactsNeedingEnrichment.length > 1 ? 's' : ''} need Clay enrichment.
          </p>
          <button
            style={styles.button}
            onClick={handleTriggerEnrichment}
            disabled={triggering}
          >
            {triggering ? 'Triggering...' : 'Trigger Clay Enrichment'}
          </button>
          {triggerResult && <p style={styles.result}>{triggerResult}</p>}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, alert }) {
  return (
    <div style={styles.stat}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{ ...styles.statValue, color: alert ? '#F2547D' : '#33475B' }}>{value}</span>
    </div>
  );
}

const styles = {
  wrap: { background: '#fff', borderRadius: 8, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' },
  title: { fontSize: 14, fontWeight: 700, color: '#33475B', marginBottom: 14 },
  stats: { display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  stat: { flex: '1 1 100px', textAlign: 'center', padding: '8px 0' },
  statLabel: { display: 'block', fontSize: 10, color: '#516F90', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3 },
  statValue: { display: 'block', fontSize: 18, fontWeight: 700, marginTop: 2 },
  bar: { height: 8, background: '#EAF0F6', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, transition: 'width 0.6s ease' },
  actions: { marginTop: 14, paddingTop: 14, borderTop: '1px solid #EAF0F6' },
  actionText: { fontSize: 12, color: '#516F90', marginBottom: 8 },
  button: {
    background: '#0091AE', color: '#fff', border: 'none', borderRadius: 4,
    padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  result: { fontSize: 12, color: '#00BDA5', marginTop: 8 },
};
