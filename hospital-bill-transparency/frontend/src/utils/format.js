const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const formatCurrency = (value) => (Number.isFinite(Number(value)) ? currency.format(Number(value)) : '—');

export const formatCompact = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
};

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const LABELS = {
  hospitalType: { private: 'Private', government: 'Government', trust: 'Trust / Charitable' },
  paymentType: {
    cash: 'Paid out of pocket',
    'insurance-cashless': 'Insurance (cashless)',
    'insurance-reimbursement': 'Insurance (reimbursed)',
  },
  roomType: { general: 'General ward', 'semi-private': 'Semi-private', private: 'Private room', icu: 'ICU' },
};

export const labelFor = (group, value) => LABELS[group]?.[value] || value || '—';
