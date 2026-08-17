import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import useFetch from '../hooks/useFetch';
import { getProcedures, compareProcedure, getCities } from '../utils/api';
import StatCard from '../components/StatCard';
import PriceRangeBar from '../components/PriceRangeBar';
import { Loading, ErrorMessage, Empty } from '../components/StateMessage';
import { formatCurrency, formatCompact, labelFor } from '../utils/format';

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const procedure = searchParams.get('procedure') || '';
  const city = searchParams.get('city') || '';
  const [pendingProcedure, setPendingProcedure] = useState(procedure);

  useEffect(() => setPendingProcedure(procedure), [procedure]);

  const { data: procedures } = useFetch(() => getProcedures(), []);
  const { data: cities } = useFetch(getCities, []);
  const { data, loading, error } = useFetch(
    () => compareProcedure(procedure, city ? { city } : {}),
    [procedure, city],
    { skip: !procedure }
  );

  const update = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'procedure') next.delete('city');
    setSearchParams(next);
  };

  const chartData = data?.byHospital.map((h) => ({
    name: h.hospital.length > 24 ? `${h.hospital.slice(0, 22)}…` : h.hospital,
    fullName: h.hospital,
    avgAmount: h.avgAmount,
    hospitalType: h.hospitalType,
  })) || [];

  const colorFor = (amount) => {
    if (!data) return 'var(--accent)';
    const { minAmount, maxAmount } = data.overall;
    const span = maxAmount - minAmount;
    const pct = span > 0 ? (amount - minAmount) / span : 0.5;
    return pct <= 0.33 ? '#1a8a5f' : pct >= 0.67 ? '#c2410c' : '#b45309';
  };

  return (
    <div className="container">
      <h1>Compare a procedure across hospitals</h1>
      <p className="lede">Pick a procedure to see what different hospitals charged for it.</p>

      <div className="filter-bar">
        <div className="field">
          <label htmlFor="procedure">Procedure</label>
          <select
            id="procedure"
            value={pendingProcedure}
            onChange={(e) => update('procedure', e.target.value)}
          >
            <option value="">Select a procedure…</option>
            {(procedures || []).map((p) => (
              <option key={p.procedure} value={p.procedure}>
                {p.procedure} ({p.reportCount} reports)
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="city">City</label>
          <select id="city" value={city} onChange={(e) => update('city', e.target.value)} disabled={!procedure}>
            <option value="">All cities</option>
            {(cities || []).map((c) => (
              <option key={`${c.city}-${c.state}`} value={c.city}>{c.city}</option>
            ))}
          </select>
        </div>
      </div>

      {!procedure && <Empty label="Choose a procedure above to compare hospital prices." />}
      {procedure && loading && <Loading />}
      {procedure && error && <ErrorMessage error={error === 'No reports found for this procedure' ? 'No reports match this procedure and city combination yet.' : error} />}

      {procedure && !loading && !error && data && (
        <>
          <div className="stat-grid">
            <StatCard label="Reports" value={data.overall.reportCount} />
            <StatCard label="Cheapest reported" value={formatCurrency(data.overall.minAmount)} />
            <StatCard label="Average" value={formatCurrency(data.overall.avgAmount)} />
            <StatCard
              label="Most expensive"
              value={formatCurrency(data.overall.maxAmount)}
              sub={data.overall.minAmount > 0 ? `${(data.overall.maxAmount / data.overall.minAmount).toFixed(1)}× the cheapest` : null}
            />
          </div>

          <section className="section card">
            <h2>Average bill per hospital</h2>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 76 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e6ea" vertical={false} />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={80} tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12 }} width={64} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Average bill']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                  />
                  <Bar dataKey="avgAmount" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.fullName} fill={colorFor(entry.avgAmount)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="section card">
            <h2>Hospital breakdown</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Hospital</th>
                    <th>Type</th>
                    <th>City</th>
                    <th className="num">Reports</th>
                    <th className="num">Average</th>
                    <th className="num">Range</th>
                    <th>Position</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byHospital.map((h) => (
                    <tr key={`${h.hospital}-${h.city}`}>
                      <td>{h.hospital}</td>
                      <td><span className="badge">{labelFor('hospitalType', h.hospitalType)}</span></td>
                      <td>{h.city}</td>
                      <td className="num">{h.reportCount}</td>
                      <td className="num"><strong>{formatCurrency(h.avgAmount)}</strong></td>
                      <td className="num">
                        {h.minAmount === h.maxAmount
                          ? '—'
                          : `${formatCompact(h.minAmount)} – ${formatCompact(h.maxAmount)}`}
                      </td>
                      <td>
                        <PriceRangeBar value={h.avgAmount} min={data.overall.minAmount} max={data.overall.maxAmount} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="disclaimer">
              Averages are drawn from a small number of self-reported bills and may not reflect current prices.
              Bill totals also depend on room category, complications, and what was bundled in.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
