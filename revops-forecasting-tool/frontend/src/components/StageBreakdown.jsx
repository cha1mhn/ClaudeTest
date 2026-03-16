import React from 'react';
import {
  FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatPct } from '../utils/format';

const STAGE_COLORS = [
  '#00A4BD', '#0091AE', '#007A8C', '#006474', '#004E5C',
  '#45A9C8', '#6EC0D4', '#98D4E2', '#C2E8F0',
];

export default function StageBreakdown({ stages = [] }) {
  const data = stages.map((s, i) => ({
    name: s.stageName,
    value: Math.round(s.totalAmount),
    probability: s.probability,
    count: s.count,
    fill: STAGE_COLORS[i % STAGE_COLORS.length],
  }));

  return (
    <div style={styles.wrap}>
      <h3 style={styles.title}>Pipeline by Stage</h3>
      {data.length === 0 ? (
        <p style={styles.empty}>No stage data available.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <FunnelChart>
              <Tooltip
                formatter={(value, name, { payload }) => [
                  `${formatCurrency(value)} (${payload.count} deals, ${formatPct(Math.round(payload.probability * 100))} prob)`,
                  name,
                ]}
              />
              <Funnel dataKey="value" data={data} isAnimationActive>
                <LabelList position="right" fill="#33475B" stroke="none" dataKey="name" style={{ fontSize: 12 }} />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>

          <table style={styles.table}>
            <thead>
              <tr>
                {['Stage', 'Deals', 'Total', 'Weighted', 'Probability'].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stages.map((s) => (
                <tr key={s.stageId} style={styles.tr}>
                  <td style={styles.td}>{s.stageName}</td>
                  <td style={styles.tdNum}>{s.count}</td>
                  <td style={styles.tdNum}>{formatCurrency(s.totalAmount)}</td>
                  <td style={styles.tdNum}>{formatCurrency(s.weightedAmount)}</td>
                  <td style={styles.tdNum}>{formatPct(Math.round((s.probability || 0) * 100))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

const styles = {
  wrap: { background: '#fff', borderRadius: 8, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' },
  title: { fontSize: 14, fontWeight: 700, color: '#33475B', marginBottom: 16 },
  empty: { color: '#7C98B6', fontSize: 13 },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: 16, fontSize: 13 },
  th: { textAlign: 'left', color: '#516F90', fontWeight: 600, padding: '6px 8px', borderBottom: '2px solid #EAF0F6', fontSize: 11, textTransform: 'uppercase' },
  td: { padding: '8px 8px', borderBottom: '1px solid #EAF0F6', color: '#33475B' },
  tdNum: { padding: '8px 8px', borderBottom: '1px solid #EAF0F6', color: '#33475B', textAlign: 'right' },
  tr: { transition: 'background .15s' },
};
