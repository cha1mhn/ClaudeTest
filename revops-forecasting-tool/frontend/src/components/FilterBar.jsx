import React from 'react';

export default function FilterBar({ filters, onChange, pipelines = [], owners = [] }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div style={styles.bar}>
      <div style={styles.group}>
        <label style={styles.label}>Method</label>
        <select style={styles.select} value={filters.method} onChange={(e) => set('method', e.target.value)}>
          <option value="weighted">Weighted Pipeline</option>
          <option value="category">Forecast Category</option>
          <option value="historical">Historical Win Rate</option>
          <option value="trend">Trend (Linear)</option>
        </select>
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Period</label>
        <select style={styles.select} value={filters.period} onChange={(e) => set('period', e.target.value)}>
          <option value="quarterly">Quarterly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {pipelines.length > 1 && (
        <div style={styles.group}>
          <label style={styles.label}>Pipeline</label>
          <select style={styles.select} value={filters.pipelineId || ''} onChange={(e) => set('pipelineId', e.target.value || undefined)}>
            <option value="">All Pipelines</option>
            {pipelines.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
      )}

      <div style={styles.group}>
        <label style={styles.label}>Rep</label>
        <select style={styles.select} value={filters.ownerId || ''} onChange={(e) => set('ownerId', e.target.value || undefined)}>
          <option value="">All Reps</option>
          {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Close Date From</label>
        <input type="date" style={styles.input} value={filters.startDate || ''}
          onChange={(e) => set('startDate', e.target.value || undefined)} />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Close Date To</label>
        <input type="date" style={styles.input} value={filters.endDate || ''}
          onChange={(e) => set('endDate', e.target.value || undefined)} />
      </div>
    </div>
  );
}

const styles = {
  bar: { display: 'flex', flexWrap: 'wrap', gap: 12, background: '#fff', padding: '16px 20px', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,.08)', alignItems: 'flex-end' },
  group: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 },
  label: { fontSize: 11, color: '#516F90', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .4 },
  select: { fontSize: 13, color: '#33475B', border: '1px solid #CBD6E2', borderRadius: 4, padding: '6px 10px', outline: 'none', background: '#fff', cursor: 'pointer' },
  input: { fontSize: 13, color: '#33475B', border: '1px solid #CBD6E2', borderRadius: 4, padding: '6px 10px', outline: 'none' },
};
