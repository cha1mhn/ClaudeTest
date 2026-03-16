import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { formatCurrency, formatNumber } from '../utils/format';
import KpiCard from '../components/KpiCard';
import ForecastChart from '../components/ForecastChart';
import StageBreakdown from '../components/StageBreakdown';
import RepLeaderboard from '../components/RepLeaderboard';
import AttainmentGauge from '../components/AttainmentGauge';
import FilterBar from '../components/FilterBar';

const DEFAULT_FILTERS = { method: 'weighted', period: 'quarterly' };

export default function Dashboard() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [forecast, setForecast] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [attainment, setAttainment] = useState(null);
  const [pipelines, setPipelines] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quota, setQuota] = useState('');

  // Load pipelines and owners once
  useEffect(() => {
    Promise.all([api.getPipelines(), api.getOwners()])
      .then(([p, o]) => { setPipelines(p); setOwners(o); })
      .catch(() => {}); // non-critical
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);

    const forecastParams = {
      method: filters.method,
      period: filters.period,
      ...(filters.pipelineId && { pipelineId: filters.pipelineId }),
      ...(filters.ownerId && { ownerId: filters.ownerId }),
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
    };

    const kpiParams = {
      ...(filters.pipelineId && { pipelineId: filters.pipelineId }),
      ...(filters.ownerId && { ownerId: filters.ownerId }),
    };

    const attainmentParams = {
      ...kpiParams,
      period: filters.period,
      quota: quota || undefined,
    };

    Promise.all([
      api.getForecast(forecastParams),
      api.getKpis(kpiParams),
      quota ? api.getAttainment(attainmentParams) : Promise.resolve(null),
    ])
      .then(([f, k, a]) => { setForecast(f); setKpis(k); setAttainment(a); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters, quota]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.h1}>RevOps Forecasting</h1>
          <p style={styles.subtitle}>Pipeline intelligence powered by HubSpot CRM data</p>
        </div>
        <div style={styles.quotaWrap}>
          <label style={styles.quotaLabel}>Period Quota ($)</label>
          <input
            style={styles.quotaInput}
            type="number"
            placeholder="e.g. 500000"
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
          />
        </div>
      </header>

      <FilterBar filters={filters} onChange={setFilters} pipelines={pipelines} owners={owners} />

      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
          <button style={styles.retry} onClick={refresh}>Retry</button>
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <span>Loading forecast data…</span>
        </div>
      ) : forecast ? (
        <>
          {/* KPI Row */}
          <div style={styles.kpiRow}>
            <KpiCard
              label="Forecasted Revenue"
              value={formatCurrency(forecast.summary.forecastedRevenue)}
              sub={`${forecast.method} method`}
              color="#0091AE"
            />
            <KpiCard
              label="Total Pipeline"
              value={formatCurrency(forecast.summary.totalPipelineValue)}
              sub={`${forecast.summary.openDealCount} open deals`}
              color="#00A4BD"
            />
            <KpiCard
              label="Weighted Pipeline"
              value={formatCurrency(forecast.summary.weightedPipeline)}
              sub="prob-adjusted"
              color="#45A9C8"
            />
            <KpiCard
              label="Avg Deal Size"
              value={formatCurrency(forecast.summary.averageDealSize)}
              color="#516F90"
            />
            {kpis && (
              <>
                <KpiCard
                  label="Win Rate"
                  value={`${kpis.winRate}%`}
                  sub={`${kpis.wonDeals} won / ${kpis.totalDeals} total`}
                  color="#00BDA5"
                />
                {kpis.averageSaleCycleDays != null && (
                  <KpiCard
                    label="Avg Sales Cycle"
                    value={`${kpis.averageSaleCycleDays}d`}
                    color="#7C98B6"
                  />
                )}
              </>
            )}
            {forecast.summary.coverage != null && (
              <KpiCard
                label="Pipeline Coverage"
                value={`${forecast.summary.coverage}×`}
                sub="open / closed-won"
                color={forecast.summary.coverage >= 3 ? '#00BDA5' : '#F2547D'}
              />
            )}
          </div>

          {/* Charts Row */}
          <div style={styles.chartsRow}>
            <div style={{ flex: 2, minWidth: 0 }}>
              <ForecastChart
                buckets={forecast.periodBuckets}
                quota={quota ? parseFloat(quota) / (filters.period === 'monthly' ? 3 : 1) : 0}
              />
            </div>
            {attainment && quota && (
              <AttainmentGauge
                wonRevenue={attainment.wonRevenue}
                quota={attainment.quota}
                period={filters.period}
              />
            )}
          </div>

          {/* Stage + Rep Row */}
          <div style={styles.bottomRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <StageBreakdown stages={forecast.stageBreakdown} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <RepLeaderboard reps={forecast.repBreakdown} owners={owners} />
            </div>
          </div>

          <p style={styles.footer}>
            Generated {new Date(forecast.generatedAt).toLocaleString()} · {forecast.method} forecast · {forecast.period} view
          </p>
        </>
      ) : null}
    </div>
  );
}

const styles = {
  page: { maxWidth: 1280, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
  h1: { fontSize: 24, fontWeight: 800, color: '#33475B', margin: 0 },
  subtitle: { fontSize: 13, color: '#7C98B6', marginTop: 4 },
  quotaWrap: { display: 'flex', flexDirection: 'column', gap: 4 },
  quotaLabel: { fontSize: 11, color: '#516F90', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .4 },
  quotaInput: { fontSize: 13, border: '1px solid #CBD6E2', borderRadius: 4, padding: '6px 10px', width: 160, outline: 'none' },
  kpiRow: { display: 'flex', flexWrap: 'wrap', gap: 12 },
  chartsRow: { display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' },
  bottomRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  loading: { display: 'flex', alignItems: 'center', gap: 12, color: '#516F90', fontSize: 14, padding: '40px 0' },
  spinner: { width: 24, height: 24, border: '3px solid #EAF0F6', borderTopColor: '#0091AE', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  error: { background: '#FFF5F5', border: '1px solid #F2547D', color: '#F2547D', borderRadius: 6, padding: '12px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 12 },
  retry: { marginLeft: 'auto', background: '#F2547D', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 12 },
  footer: { fontSize: 11, color: '#B0C1D4', textAlign: 'right' },
};
