import React from 'react';

export default function KpiCard({ label, value, sub, trend, color = '#0091AE' }) {
  return (
    <div style={styles.card}>
      <div style={styles.label}>{label}</div>
      <div style={{ ...styles.value, color }}>{value}</div>
      {sub && <div style={styles.sub}>{sub}</div>}
      {trend != null && (
        <div style={{ ...styles.trend, color: trend >= 0 ? '#00A4BD' : '#F2547D' }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 8,
    padding: '20px 24px',
    boxShadow: '0 1px 4px rgba(0,0,0,.08)',
    minWidth: 160,
    flex: '1 1 160px',
  },
  label: { fontSize: 12, color: '#516F90', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 },
  value: { fontSize: 28, fontWeight: 700, lineHeight: 1.1 },
  sub: { fontSize: 12, color: '#7C98B6', marginTop: 4 },
  trend: { fontSize: 13, fontWeight: 600, marginTop: 4 },
};
