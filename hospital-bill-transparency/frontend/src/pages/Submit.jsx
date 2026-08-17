import { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { submitReport, getProcedures, getCategories } from '../utils/api';
import { formatCurrency } from '../utils/format';

const BLANK = {
  procedure: '',
  category: '',
  hospital: '',
  hospitalType: 'private',
  city: '',
  state: '',
  amount: '',
  paymentType: 'cash',
  roomType: '',
  billDate: '',
  notes: '',
};

export default function Submit() {
  const [form, setForm] = useState(BLANK);
  const [status, setStatus] = useState({ state: 'idle' });

  const { data: procedures } = useFetch(() => getProcedures(), []);
  const { data: categories } = useFetch(getCategories, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onProcedureChange = (e) => {
    const value = e.target.value;
    const known = (procedures || []).find((p) => p.procedure === value);
    setForm((f) => ({ ...f, procedure: value, category: known ? known.category : f.category }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ state: 'submitting' });
    try {
      const payload = { ...form, amount: Number(form.amount) };
      Object.keys(payload).forEach((k) => { if (payload[k] === '') delete payload[k]; });
      const result = await submitReport(payload);
      setStatus({ state: 'success', message: result.message, procedure: form.procedure });
      setForm(BLANK);
    } catch (err) {
      const details = err.response?.data?.details;
      setStatus({
        state: 'error',
        message: details ? details.join(' · ') : err.response?.data?.error || err.message,
      });
    }
  };

  return (
    <div className="container">
      <h1>Report a hospital bill</h1>
      <p className="lede">
        No account, no name, no email. We never ask who you are, which hospital record this came from, or anything
        about the patient. Only the bill amount and where it was charged.
      </p>

      {status.state === 'success' && (
        <div className="notice success">
          {status.message}{' '}
          <Link to={`/compare?procedure=${encodeURIComponent(status.procedure)}`}>See how it compares →</Link>
        </div>
      )}
      {status.state === 'error' && <div className="notice error">{status.message}</div>}

      <form className="card" onSubmit={onSubmit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="procedure">Procedure *</label>
            <input
              id="procedure"
              list="procedure-options"
              required
              placeholder="e.g. Cataract Surgery"
              value={form.procedure}
              onChange={onProcedureChange}
            />
            <datalist id="procedure-options">
              {(procedures || []).map((p) => <option key={p.procedure} value={p.procedure} />)}
            </datalist>
            <span className="hint">Pick an existing one where possible so bills group together.</span>
          </div>

          <div className="field">
            <label htmlFor="category">Category *</label>
            <input
              id="category"
              list="category-options"
              required
              placeholder="e.g. Surgery"
              value={form.category}
              onChange={set('category')}
            />
            <datalist id="category-options">
              {(categories || []).map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div className="field">
            <label htmlFor="hospital">Hospital *</label>
            <input id="hospital" required placeholder="Hospital name" value={form.hospital} onChange={set('hospital')} />
          </div>

          <div className="field">
            <label htmlFor="hospitalType">Hospital type</label>
            <select id="hospitalType" value={form.hospitalType} onChange={set('hospitalType')}>
              <option value="private">Private</option>
              <option value="government">Government</option>
              <option value="trust">Trust / Charitable</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="city">City *</label>
            <input id="city" required placeholder="City" value={form.city} onChange={set('city')} />
          </div>

          <div className="field">
            <label htmlFor="state">State *</label>
            <input id="state" required placeholder="State" value={form.state} onChange={set('state')} />
          </div>

          <div className="field">
            <label htmlFor="amount">Total amount billed (₹) *</label>
            <input
              id="amount"
              type="number"
              min="1"
              step="1"
              required
              placeholder="e.g. 45000"
              value={form.amount}
              onChange={set('amount')}
            />
            <span className="hint">
              {form.amount && Number(form.amount) > 0 ? formatCurrency(form.amount) : 'The final bill total, not the deposit.'}
            </span>
          </div>

          <div className="field">
            <label htmlFor="paymentType">How was it paid?</label>
            <select id="paymentType" value={form.paymentType} onChange={set('paymentType')}>
              <option value="cash">Out of pocket</option>
              <option value="insurance-cashless">Insurance (cashless)</option>
              <option value="insurance-reimbursement">Insurance (reimbursed)</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="roomType">Room category</label>
            <select id="roomType" value={form.roomType} onChange={set('roomType')}>
              <option value="">Not applicable</option>
              <option value="general">General ward</option>
              <option value="semi-private">Semi-private</option>
              <option value="private">Private room</option>
              <option value="icu">ICU</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="billDate">Bill date</label>
            <input
              id="billDate"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={form.billDate}
              onChange={set('billDate')}
            />
            <span className="hint">Prices move fast — the date matters.</span>
          </div>
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="notes">Anything else? (optional)</label>
          <textarea
            id="notes"
            maxLength={500}
            placeholder="e.g. included 3 nights stay and all medicines; consultation billed separately"
            value={form.notes}
            onChange={set('notes')}
          />
          <span className="hint">Do not include names, phone numbers, or patient details.</span>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button type="submit" disabled={status.state === 'submitting'}>
            {status.state === 'submitting' ? 'Submitting…' : 'Submit anonymously'}
          </button>
          <button type="button" className="secondary" onClick={() => setForm(BLANK)}>Clear</button>
        </div>

        <p className="disclaimer">
          Submissions are stored without any identifier tying them to you. Report only what you were charged —
          this is a price record, not a complaint or review channel.
        </p>
      </form>
    </div>
  );
}
