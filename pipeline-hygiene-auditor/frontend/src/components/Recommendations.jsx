import React from 'react';

const PRIORITY_COLORS = { high: '#F2547D', medium: '#F5C26B', low: '#00BDA5' };

export default function Recommendations({ items = [] }) {
  if (!items.length) return null;

  return (
    <div style={styles.wrap}>
      <h3 style={styles.title}>Recommendations</h3>
      {items.map((rec, i) => (
        <div key={i} style={styles.card}>
          <div style={styles.header}>
            <span style={{ ...styles.priority, background: PRIORITY_COLORS[rec.priority] || '#7C98B6' }}>
              {rec.priority}
            </span>
            <span style={styles.category}>{rec.category}</span>
          </div>
          <p style={styles.action}>{rec.action}</p>
          <p style={styles.impact}>{rec.impact}</p>
          {rec.tools?.length > 0 && (
            <div style={styles.tools}>
              {rec.tools.map((t, j) => (
                <span key={j} style={styles.tool}>{t}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const styles = {
  wrap: { background: '#fff', borderRadius: 8, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' },
  title: { fontSize: 14, fontWeight: 700, color: '#33475B', marginBottom: 16 },
  card: { borderLeft: '3px solid #EAF0F6', paddingLeft: 14, marginBottom: 16 },
  header: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  priority: { color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '2px 8px', textTransform: 'uppercase' },
  category: { fontSize: 11, color: '#516F90', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3 },
  action: { fontSize: 13, fontWeight: 600, color: '#33475B', margin: '4px 0' },
  impact: { fontSize: 12, color: '#7C98B6', lineHeight: 1.4, margin: 0 },
  tools: { display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  tool: { fontSize: 10, background: '#EAF0F6', color: '#516F90', borderRadius: 4, padding: '2px 8px', fontWeight: 600 },
};
