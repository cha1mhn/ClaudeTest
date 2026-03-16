/**
 * HubSpotCard.jsx
 *
 * Compact view designed to run inside a HubSpot CRM Card (iframe).
 * Receives optional query params from HubSpot:
 *   ?portalId=...  &associatedObjectId=...  &associatedObjectType=DEAL
 *
 * Renders a lightweight forecast summary — no heavy charts, just numbers
 * and a small bar chart — so it fits comfortably in the CRM sidebar.
 */
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../utils/api';
import { formatCurrency, periodLabel } from '../utils/format';

export default function HubSpotCard() {
  const params = new URLSearchParams(window.location.search);
  const pipelineId = params.get('pipelineId') || undefined;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getForecastSummary({ pipelineId, period: 'quarterly' })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [pipelineId]);

  if (loading) return <Loader />;
  if (error) return <Error msg={error} />;
  if (!data) return null;

  const { weighted, periodBuckets = [] } = data;
  const chartData = periodBuckets.slice(-4).map((b) => ({
    name: periodLabel(b.period),
    weighted: Math.round(b.weightedAmount),
    total: Math.round(b.totalAmount),
  }));

  return (
    <div style={s.wrap}>
      <div style={s.titleRow}>
        <span style={s.title}>Forecast</span>
        <span style={s.badge}>{data.period}</span>
      </div>

      <div style={s.hero}>{formatCurrency(weighted.forecastedRevenue)}</div>
      <div style={s.heroSub}>weighted forecast · {weighted.openDealCount} open deals</div>

      <div style={s.statRow}>
        <Stat label="Pipeline" value={formatCurrency(weighted.totalPipelineValue)} />
        <Stat label="Avg Size" value={formatCurrency(weighted.averageDealSize)} />
        {weighted.coverage != null && <Stat label="Coverage" value={`${weighted.coverage}×`} />}
      </div>

      {chartData.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={chartData} barGap={2}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v) => formatCurrency(v)}
                contentStyle={{ fontSize: 11, padding: '4px 8px' }}
              />
              <Bar dataKey="total" fill="#EAF0F6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="weighted" fill="#0091AE" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <a href={`${window.location.origin}?pipelineId=${pipelineId || ''}`} target="_blank" rel="noreferrer" style={s.link}>
        Open full dashboard →
      </a>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={s.stat}>
      <span style={s.statLabel}>{label}</span>
      <span style={s.statValue}>{value}</span>
    </div>
  );
}

function Loader() {
  return <div style={{ padding: 20, color: '#7C98B6', fontSize: 13, textAlign: 'center' }}>Loading…</div>;
}

function Error({ msg }) {
  return <div style={{ padding: 20, color: '#F2547D', fontSize: 12 }}>Error: {msg}</div>;
}

const s = {
  wrap: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '16px', background: '#fff', minHeight: '100vh' },
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 13, fontWeight: 700, color: '#33475B' },
  badge: { fontSize: 10, background: '#EAF0F6', color: '#516F90', borderRadius: 10, padding: '2px 8px', fontWeight: 600, textTransform: 'uppercase' },
  hero: { fontSize: 28, fontWeight: 800, color: '#0091AE', lineHeight: 1.1 },
  heroSub: { fontSize: 11, color: '#7C98B6', marginTop: 3, marginBottom: 10 },
  statRow: { display: 'flex', gap: 8, borderTop: '1px solid #EAF0F6', paddingTop: 10 },
  stat: { flex: 1, textAlign: 'center' },
  statLabel: { display: 'block', fontSize: 10, color: '#516F90', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3 },
  statValue: { display: 'block', fontSize: 13, fontWeight: 700, color: '#33475B', marginTop: 2 },
  link: { display: 'block', textAlign: 'right', fontSize: 11, color: '#0091AE', marginTop: 12, textDecoration: 'none' },
};
