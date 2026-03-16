import React from 'react';
import { formatCurrency } from '../utils/format';

export default function RepLeaderboard({ reps = [], owners = [] }) {
  const ownerMap = Object.fromEntries(owners.map((o) => [o.id, o.name]));

  const enriched = reps.map((r) => ({
    ...r,
    name: r.ownerId === 'unassigned' ? 'Unassigned' : ownerMap[r.ownerId] || r.ownerId,
  })).sort((a, b) => b.weightedAmount - a.weightedAmount);

  const maxWeighted = enriched[0]?.weightedAmount || 1;

  return (
    <div style={styles.wrap}>
      <h3 style={styles.title}>Rep Leaderboard</h3>
      {enriched.length === 0 ? (
        <p style={styles.empty}>No rep data available.</p>
      ) : (
        <div>
          {enriched.map((rep, i) => (
            <div key={rep.ownerId} style={styles.row}>
              <span style={styles.rank}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={styles.repName}>{rep.name}</div>
                <div style={styles.bar}>
                  <div style={{ ...styles.barFill, width: `${(rep.weightedAmount / maxWeighted) * 100}%` }} />
                </div>
              </div>
              <div style={styles.amounts}>
                <div style={styles.weighted}>{formatCurrency(rep.weightedAmount)}</div>
                <div style={styles.total}>{rep.count} deal{rep.count !== 1 ? 's' : ''} · {formatCurrency(rep.totalAmount)} total</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { background: '#fff', borderRadius: 8, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' },
  title: { fontSize: 14, fontWeight: 700, color: '#33475B', marginBottom: 16 },
  empty: { color: '#7C98B6', fontSize: 13 },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #EAF0F6' },
  rank: { width: 22, height: 22, borderRadius: '50%', background: '#EAF0F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#516F90', flexShrink: 0 },
  repName: { fontSize: 13, fontWeight: 600, color: '#33475B', marginBottom: 4 },
  bar: { height: 6, background: '#EAF0F6', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', background: 'linear-gradient(90deg, #0091AE, #00A4BD)', borderRadius: 3, transition: 'width .4s ease' },
  amounts: { textAlign: 'right', flexShrink: 0 },
  weighted: { fontSize: 14, fontWeight: 700, color: '#0091AE' },
  total: { fontSize: 11, color: '#7C98B6', marginTop: 2 },
};
