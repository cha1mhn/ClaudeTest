import React from 'react';

const SEV_CONFIG = {
  critical: { color: '#F2547D', label: 'Critical' },
  high:     { color: '#FF7A59', label: 'High' },
  warning:  { color: '#F5C26B', label: 'Warning' },
  info:     { color: '#7C98B6', label: 'Info' },
};

export default function SeverityBar({ counts = {} }) {
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  if (!total) return null;

  return (
    <div style={styles.wrap}>
      <div style={styles.bar}>
        {['critical', 'high', 'warning', 'info'].map((sev) => {
          const count = counts[sev] || 0;
          if (!count) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={sev}
              style={{ ...styles.segment, background: SEV_CONFIG[sev].color, width: `${pct}%` }}
              title={`${SEV_CONFIG[sev].label}: ${count}`}
            />
          );
        })}
      </div>
      <div style={styles.legend}>
        {['critical', 'high', 'warning'].map((sev) => {
          const count = counts[sev] || 0;
          if (!count) return null;
          return (
            <span key={sev} style={styles.legendItem}>
              <span style={{ ...styles.dot, background: SEV_CONFIG[sev].color }} />
              {SEV_CONFIG[sev].label}: {count}
            </span>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrap: { marginTop: 8 },
  bar: { display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: '#EAF0F6' },
  segment: { transition: 'width 0.5s ease' },
  legend: { display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' },
  legendItem: { fontSize: 12, color: '#516F90', display: 'flex', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
};
