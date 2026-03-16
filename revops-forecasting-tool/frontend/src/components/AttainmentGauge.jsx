import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, formatPct } from '../utils/format';

export default function AttainmentGauge({ wonRevenue = 0, quota = 0, period = 'quarterly' }) {
  if (!quota) return null;

  const pct = Math.min((wonRevenue / quota) * 100, 100);
  const remaining = Math.max(quota - wonRevenue, 0);

  const data = [
    { value: pct, fill: pct >= 100 ? '#00BDA5' : pct >= 75 ? '#0091AE' : pct >= 50 ? '#F5C26B' : '#F2547D' },
    { value: 100 - pct, fill: '#EAF0F6' },
  ];

  return (
    <div style={styles.wrap}>
      <h3 style={styles.title}>{period === 'monthly' ? 'Monthly' : 'Quarterly'} Quota Attainment</h3>
      <div style={styles.inner}>
        <PieChart width={160} height={100}>
          <Pie
            data={data}
            cx={80}
            cy={90}
            startAngle={180}
            endAngle={0}
            innerRadius={55}
            outerRadius={75}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Pie>
        </PieChart>
        <div style={styles.label}>
          <span style={{ ...styles.pct, color: data[0].fill }}>{formatPct(Math.round(pct))}</span>
          <span style={styles.sub}>of {formatCurrency(quota)} quota</span>
        </div>
      </div>
      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Won</span>
          <span style={styles.statVal}>{formatCurrency(wonRevenue)}</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Gap</span>
          <span style={{ ...styles.statVal, color: remaining > 0 ? '#F2547D' : '#00BDA5' }}>
            {remaining > 0 ? `-${formatCurrency(remaining)}` : 'Achieved'}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { background: '#fff', borderRadius: 8, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' },
  title: { fontSize: 14, fontWeight: 700, color: '#33475B', marginBottom: 12 },
  inner: { position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: 110 },
  label: { position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' },
  pct: { display: 'block', fontSize: 26, fontWeight: 800, lineHeight: 1 },
  sub: { fontSize: 11, color: '#7C98B6' },
  stats: { display: 'flex', gap: 16, marginTop: 16, paddingTop: 12, borderTop: '1px solid #EAF0F6' },
  stat: { flex: 1, textAlign: 'center' },
  statLabel: { display: 'block', fontSize: 11, color: '#516F90', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .4 },
  statVal: { display: 'block', fontSize: 16, fontWeight: 700, color: '#33475B', marginTop: 2 },
};
