import { Link, useNavigate } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { getSummary } from '../utils/api';
import StatCard from '../components/StatCard';
import { Loading, ErrorMessage } from '../components/StateMessage';
import { formatCurrency, formatCompact, labelFor } from '../utils/format';

export default function Home() {
  const { data, loading, error } = useFetch(getSummary, []);
  const navigate = useNavigate();

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const { totals, biggestGaps, byHospitalType, recentReports } = data;

  return (
    <div className="container">
      <h1>Same procedure. Different hospitals. Real amounts.</h1>
      <p className="lede">
        Hospital prices for the exact same treatment vary wildly, and nobody publishes them. This is a
        crowdsourced record of what people actually paid — submitted anonymously, browsable by anyone.
      </p>

      <div className="stat-grid">
        <StatCard label="Bills reported" value={totals.totalReports.toLocaleString('en-IN')} />
        <StatCard label="Hospitals covered" value={totals.totalHospitals.toLocaleString('en-IN')} />
        <StatCard label="Cities" value={totals.totalCities.toLocaleString('en-IN')} />
        <StatCard label="Procedures tracked" value={totals.totalProcedures.toLocaleString('en-IN')} />
      </div>

      <section className="section card">
        <h2>Where the price gap is widest</h2>
        <p className="lede" style={{ marginBottom: 16 }}>
          The cheapest and most expensive reported bill for the same procedure.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Procedure</th>
                <th className="num">Reports</th>
                <th className="num">Cheapest</th>
                <th className="num">Most expensive</th>
                <th className="num">Gap</th>
              </tr>
            </thead>
            <tbody>
              {biggestGaps.map((g) => (
                <tr
                  key={g.procedure}
                  className="row-link"
                  onClick={() => navigate(`/compare?procedure=${encodeURIComponent(g.procedure)}`)}
                >
                  <td><Link to={`/compare?procedure=${encodeURIComponent(g.procedure)}`}>{g.procedure}</Link></td>
                  <td className="num">{g.reportCount}</td>
                  <td className="num">{formatCurrency(g.minAmount)}</td>
                  <td className="num">{formatCurrency(g.maxAmount)}</td>
                  <td className="num"><span className="badge gap">{g.priceGapRatio}×</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section card">
        <h2>Average bill by hospital type</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Hospital type</th>
                <th className="num">Reports</th>
                <th className="num">Average bill</th>
              </tr>
            </thead>
            <tbody>
              {byHospitalType.map((h) => (
                <tr key={h.hospitalType}>
                  <td>{labelFor('hospitalType', h.hospitalType)}</td>
                  <td className="num">{h.count}</td>
                  <td className="num">{formatCurrency(h.avgAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section card">
        <h2>Recently reported</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Procedure</th>
                <th>Hospital</th>
                <th>City</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((r) => (
                <tr key={r.id}>
                  <td>{r.procedure}</td>
                  <td>{r.hospital}</td>
                  <td>{r.city}</td>
                  <td className="num">{formatCompact(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 16, marginBottom: 0 }}>
          <Link to="/submit">Add the bill you paid →</Link>
        </p>
      </section>

      <p className="disclaimer">
        All figures are self-reported by the public and are not verified against hospital records. Treat them as a
        rough guide to what others were charged, not as a quote or a definitive price list.
      </p>
    </div>
  );
}
