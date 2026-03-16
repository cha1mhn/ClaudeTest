/**
 * Compact HubSpot CRM Card view — rendered inside an iframe in the sidebar.
 */
import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const GRADE_COLORS = { A: '#00BDA5', B: '#00A4BD', C: '#F5C26B', D: '#FF7A59', F: '#F2547D' };

export default function HubSpotCard() {
  const params = new URLSearchParams(window.location.search);
  const pipelineId = params.get('pipelineId') || undefined;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditSummary({ pipelineId })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pipelineId]);

  if (loading) return <p style={s.loading}>Auditing pipeline...</p>;
  if (!data) return <p style={s.error}>Could not load audit data.</p>;

  const gradeColor = GRADE_COLORS[data.grade] || '#7C98B6';

  return (
    <div style={s.wrap}>
      <div style={s.titleRow}>
        <span style={s.title}>Pipeline Hygiene</span>
        <span style={{ ...s.grade, background: gradeColor }}>{data.grade}</span>
      </div>

      <div style={s.score}>Score: {data.score}/100</div>

      <div style={s.statRow}>
        <Stat label="Issues" value={data.totalIssues} alert={data.totalIssues > 0} />
        <Stat label="Critical" value={data.severityCounts?.critical || 0} alert={(data.severityCounts?.critical || 0) > 0} />
        <Stat label="Open Deals" value={data.openDeals} />
      </div>

      {data.topRecommendations?.length > 0 && (
        <div style={s.recs}>
          <div style={s.recTitle}>Top Actions</div>
          {data.topRecommendations.map((r, i) => (
            <div key={i} style={s.rec}>{r.action}</div>
          ))}
        </div>
      )}

      <a href={`${window.location.origin}`} target="_blank" rel="noreferrer" style={s.link}>
        Open full audit dashboard →
      </a>
    </div>
  );
}

function Stat({ label, value, alert }) {
  return (
    <div style={s.stat}>
      <span style={s.statLabel}>{label}</span>
      <span style={{ ...s.statValue, color: alert ? '#F2547D' : '#33475B' }}>{value}</span>
    </div>
  );
}

const s = {
  wrap: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: 16, background: '#fff', minHeight: '100vh' },
  loading: { padding: 20, color: '#7C98B6', fontSize: 13, textAlign: 'center' },
  error: { padding: 20, color: '#F2547D', fontSize: 12 },
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 13, fontWeight: 700, color: '#33475B' },
  grade: { color: '#fff', fontSize: 13, fontWeight: 800, borderRadius: 4, padding: '2px 10px' },
  score: { fontSize: 11, color: '#7C98B6', marginBottom: 10 },
  statRow: { display: 'flex', gap: 8, borderTop: '1px solid #EAF0F6', paddingTop: 10, marginBottom: 10 },
  stat: { flex: 1, textAlign: 'center' },
  statLabel: { display: 'block', fontSize: 10, color: '#516F90', fontWeight: 600, textTransform: 'uppercase' },
  statValue: { display: 'block', fontSize: 16, fontWeight: 700, marginTop: 2 },
  recs: { borderTop: '1px solid #EAF0F6', paddingTop: 10 },
  recTitle: { fontSize: 10, color: '#516F90', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 },
  rec: { fontSize: 12, color: '#33475B', lineHeight: 1.5, padding: '2px 0', borderLeft: '2px solid #0091AE', paddingLeft: 8, marginBottom: 4 },
  link: { display: 'block', textAlign: 'right', fontSize: 11, color: '#0091AE', marginTop: 12, textDecoration: 'none' },
};
