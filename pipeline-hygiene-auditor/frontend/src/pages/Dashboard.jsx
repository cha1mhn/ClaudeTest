import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import GradeRing from '../components/GradeRing';
import SeverityBar from '../components/SeverityBar';
import RuleBreakdownChart from '../components/RuleBreakdownChart';
import IssueList from '../components/IssueList';
import Recommendations from '../components/Recommendations';
import EnrichmentPanel from '../components/EnrichmentPanel';

export default function Dashboard() {
  const [audit, setAudit] = useState(null);
  const [pipelines, setPipelines] = useState([]);
  const [owners, setOwners] = useState([]);
  const [filters, setFilters] = useState({ pipelineId: '', ownerId: '', includeClay: 'true' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.getPipelines(), api.getOwners()])
      .then(([p, o]) => { setPipelines(p); setOwners(o); })
      .catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getAudit({
        ...(filters.pipelineId && { pipelineId: filters.pipelineId }),
        ...(filters.ownerId && { ownerId: filters.ownerId }),
        includeClay: filters.includeClay,
      });
      setAudit(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleForceRefresh = async () => {
    await api.refreshAudit();
    refresh();
  };

  const set = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.h1}>GTM Pipeline Hygiene Auditor</h1>
          <p style={styles.subtitle}>HubSpot + Clay data quality audit for RevOps teams</p>
        </div>
        <button style={styles.refreshBtn} onClick={handleForceRefresh} disabled={loading}>
          {loading ? 'Auditing...' : 'Re-run Audit'}
        </button>
      </header>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Pipeline</label>
          <select style={styles.select} value={filters.pipelineId} onChange={(e) => set('pipelineId', e.target.value)}>
            <option value="">All Pipelines</option>
            {pipelines.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Owner</label>
          <select style={styles.select} value={filters.ownerId} onChange={(e) => set('ownerId', e.target.value)}>
            <option value="">All Owners</option>
            {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Clay Enrichment Check</label>
          <select style={styles.select} value={filters.includeClay} onChange={(e) => set('includeClay', e.target.value)}>
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
          <button style={styles.retryBtn} onClick={refresh}>Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <span>Running audit against HubSpot &amp; Clay...</span>
        </div>
      )}

      {/* Results */}
      {!loading && audit && (
        <>
          {/* Grade + Severity Row */}
          <div style={styles.topRow}>
            <div style={styles.gradeCard}>
              <GradeRing grade={audit.grade} score={audit.score} />
              <div style={styles.gradeMeta}>
                <div style={styles.gradeMetaLine}>
                  <strong>{audit.totalIssues}</strong> issue{audit.totalIssues !== 1 ? 's' : ''} across <strong>{audit.openDeals}</strong> open deals
                </div>
                <SeverityBar counts={audit.severityCounts} />
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div style={styles.grid}>
            <div style={{ gridColumn: '1 / -1' }}>
              <RuleBreakdownChart issuesByRule={audit.issuesByRule} />
            </div>
            <div>
              <IssueList issuesByRule={audit.issuesByRule} />
            </div>
            <div>
              <Recommendations items={audit.recommendations} />
              <div style={{ marginTop: 16 }}>
                <EnrichmentPanel enrichmentSummary={audit.enrichmentSummary} />
              </div>
            </div>
          </div>

          <p style={styles.footer}>
            Audit generated {new Date(audit.generatedAt).toLocaleString()} · {audit.totalDeals} total deals evaluated
          </p>
        </>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
  h1: { fontSize: 24, fontWeight: 800, color: '#33475B', margin: 0 },
  subtitle: { fontSize: 13, color: '#7C98B6', marginTop: 4 },
  refreshBtn: {
    background: '#0091AE', color: '#fff', border: 'none', borderRadius: 4,
    padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  filters: { display: 'flex', flexWrap: 'wrap', gap: 12, background: '#fff', padding: '14px 20px', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,.08)', alignItems: 'flex-end' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 },
  label: { fontSize: 10, color: '#516F90', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .4 },
  select: { fontSize: 13, color: '#33475B', border: '1px solid #CBD6E2', borderRadius: 4, padding: '6px 10px', outline: 'none', background: '#fff' },
  error: { background: '#FFF5F5', border: '1px solid #F2547D', color: '#F2547D', borderRadius: 6, padding: '12px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 12 },
  retryBtn: { marginLeft: 'auto', background: '#F2547D', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 12 },
  loading: { display: 'flex', alignItems: 'center', gap: 12, color: '#516F90', fontSize: 14, padding: '40px 0' },
  spinner: { width: 24, height: 24, border: '3px solid #EAF0F6', borderTopColor: '#0091AE', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  topRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  gradeCard: {
    flex: 1, display: 'flex', alignItems: 'center', gap: 24, background: '#fff',
    borderRadius: 8, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,.08)',
  },
  gradeMeta: { flex: 1 },
  gradeMetaLine: { fontSize: 14, color: '#33475B', marginBottom: 8 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  footer: { fontSize: 11, color: '#B0C1D4', textAlign: 'right' },
};
