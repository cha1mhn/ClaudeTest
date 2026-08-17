import { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { getReports, getCities, getCategories } from '../utils/api';
import { Loading, ErrorMessage, Empty } from '../components/StateMessage';
import { formatCurrency, formatDate, labelFor } from '../utils/format';

const EMPTY_FILTERS = { q: '', city: '', category: '', hospitalType: '', paymentType: '' };

export default function Browse() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const { data: cities } = useFetch(getCities, []);
  const { data: categories } = useFetch(getCategories, []);

  const activeParams = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const { data, loading, error } = useFetch(
    () => getReports({ ...activeParams, page, limit: 20 }),
    [JSON.stringify(activeParams), page]
  );

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const reset = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  return (
    <div className="container">
      <h1>Browse reported bills</h1>
      <p className="lede">Every submitted bill, newest first. Filter by city, category, or hospital type.</p>

      <div className="filter-bar">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input
            id="q"
            placeholder="Procedure, hospital or city"
            value={filters.q}
            onChange={(e) => setFilter('q', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="f-city">City</label>
          <select id="f-city" value={filters.city} onChange={(e) => setFilter('city', e.target.value)}>
            <option value="">All cities</option>
            {(cities || []).map((c) => <option key={`${c.city}-${c.state}`} value={c.city}>{c.city}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-cat">Category</label>
          <select id="f-cat" value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
            <option value="">All categories</option>
            {(categories || []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-htype">Hospital type</label>
          <select id="f-htype" value={filters.hospitalType} onChange={(e) => setFilter('hospitalType', e.target.value)}>
            <option value="">Any</option>
            <option value="private">Private</option>
            <option value="government">Government</option>
            <option value="trust">Trust / Charitable</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-ptype">Paid via</label>
          <select id="f-ptype" value={filters.paymentType} onChange={(e) => setFilter('paymentType', e.target.value)}>
            <option value="">Any</option>
            <option value="cash">Out of pocket</option>
            <option value="insurance-cashless">Insurance (cashless)</option>
            <option value="insurance-reimbursement">Insurance (reimbursed)</option>
          </select>
        </div>
        <button className="secondary" onClick={reset}>Reset</button>
      </div>

      {loading && <Loading />}
      {error && <ErrorMessage error={error} />}

      {!loading && !error && data && (
        <div className="card">
          {data.data.length === 0 ? (
            <Empty label="No reports match these filters." />
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Procedure</th>
                      <th>Hospital</th>
                      <th>City</th>
                      <th>Room</th>
                      <th>Paid via</th>
                      <th>Bill date</th>
                      <th className="num">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <Link to={`/compare?procedure=${encodeURIComponent(r.procedure)}`}>{r.procedure}</Link>
                        </td>
                        <td>{r.hospital}</td>
                        <td>{r.city}</td>
                        <td>{labelFor('roomType', r.room_type)}</td>
                        <td>{labelFor('paymentType', r.payment_type)}</td>
                        <td>{formatDate(r.bill_date)}</td>
                        <td className="num"><strong>{formatCurrency(r.amount)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button className="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <span>
                  Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} reports
                </span>
                <button
                  className="secondary"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
