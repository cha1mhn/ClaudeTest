import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { periodLabel, formatCurrency } from '../utils/format';

const COLORS = { totalAmount: '#CBD6E2', weightedAmount: '#0091AE' };

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={styles.tooltip}>
      <strong style={{ display: 'block', marginBottom: 4 }}>{periodLabel(label)}</strong>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, fontSize: 13 }}>
          {p.name}: {formatCurrency(p.value)}
        </div>
      ))}
    </div>
  );
}

export default function ForecastChart({ buckets = [], quota }) {
  const data = buckets.map((b) => ({
    period: b.period,
    'Total Pipeline': b.totalAmount,
    'Weighted Forecast': b.weightedAmount,
  }));

  return (
    <div style={styles.wrap}>
      <h3 style={styles.title}>Pipeline by Period</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EAF0F6" />
          <XAxis dataKey="period" tickFormatter={periodLabel} tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Total Pipeline" fill={COLORS.totalAmount} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Weighted Forecast" fill={COLORS.weightedAmount} radius={[4, 4, 0, 0]} />
          {quota > 0 && (
            <ReferenceLine y={quota} stroke="#F2547D" strokeDasharray="6 3"
              label={{ value: 'Quota', fill: '#F2547D', fontSize: 12 }} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles = {
  wrap: { background: '#fff', borderRadius: 8, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' },
  title: { fontSize: 14, fontWeight: 700, color: '#33475B', marginBottom: 16 },
  tooltip: { background: '#fff', border: '1px solid #CBD6E2', borderRadius: 6, padding: '10px 14px', fontSize: 13 },
};
